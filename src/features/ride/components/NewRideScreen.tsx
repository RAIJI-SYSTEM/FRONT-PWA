'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Check, CircleDot, MapPin, Route, Search } from 'lucide-react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import FlowTopBar from '@/components/FlowTopBar';
import RideMap, { type MapPadding, type PickTarget } from '@/features/map/components/RideMap';
import { getDrivingRoute, reverseGeocode, type DrivingRoute } from '@/services/mapbox';
import { createRideSearch } from '@/services/rideSearch';
import type { LngLat, Place } from '@/types/place';
import type { Departure } from '@/types/ride';
import DepartureSelector, { type DepartureMode } from './DepartureSelector';
import PlaceAutocomplete from './PlaceAutocomplete';

/** Antecedência mínima para agendar uma carona */
const MIN_SCHEDULE_MINUTES = 15;
/** Respiro entre os painéis e a área útil do mapa */
const OVERLAY_GAP = 16;

/** origin/destination: escolhendo o ponto com o pino; review: confirmando a viagem */
type Step = PickTarget | 'review';

const pillButton = { height: 52, borderRadius: 999, fontSize: '1rem', fontWeight: 600, textTransform: 'none' } as const;

interface NewRideScreenProps {
  initialMode?: DepartureMode;
}

/**
 * "Informar rota" do BPMN, no estilo dos apps de corrida:
 * mapa em tela cheia, campos de origem/destino no topo e pino fixo no centro —
 * o passageiro arrasta o mapa para escolher o ponto ou digita o endereço.
 */
export default function NewRideScreen({ initialMode = 'now' }: NewRideScreenProps) {
  const router = useRouter();
  const [step, setStep] = useState<Step>('origin');
  const [origin, setOrigin] = useState<Place | null>(null);
  const [destination, setDestination] = useState<Place | null>(null);
  const [resolving, setResolving] = useState(false);
  const [moving, setMoving] = useState(false);
  const [focus, setFocus] = useState<{ point: LngLat; key: number }>();
  const [userLocation, setUserLocation] = useState<LngLat>();
  const [route, setRoute] = useState<DrivingRoute | null>(null);
  const [mode, setMode] = useState<DepartureMode>(initialMode);
  const [scheduledAt, setScheduledAt] = useState('');
  const [scheduleError, setScheduleError] = useState<string>();
  const [apiError, setApiError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const topRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLFormElement>(null);
  const [padding, setPadding] = useState<MapPadding>({ top: 0, bottom: 0 });
  const geocodeAbort = useRef<AbortController>(undefined);
  const routeAbort = useRef<AbortController>(undefined);

  const flyTo = (point: LngLat) => setFocus({ point, key: Date.now() });

  // Mede os painéis sobre o mapa para o pino ficar no centro da área visível
  useEffect(() => {
    const measure = () => {
      const top = Math.round((topRef.current?.offsetTop ?? 0) + (topRef.current?.offsetHeight ?? 0) + OVERLAY_GAP);
      const bottom = Math.round((bottomRef.current?.offsetHeight ?? 0) + OVERLAY_GAP);
      // Só atualiza se mudou de fato: cada mudança reposiciona o mapa
      setPadding((prev) => (prev.top === top && prev.bottom === bottom ? prev : { top, bottom }));
    };
    const observer = new ResizeObserver(measure);
    if (topRef.current) observer.observe(topRef.current);
    if (bottomRef.current) observer.observe(bottomRef.current);
    return () => observer.disconnect();
  }, []);

  const resolvePoint = async (target: PickTarget, point: LngLat) => {
    geocodeAbort.current?.abort();
    const controller = new AbortController();
    geocodeAbort.current = controller;
    setResolving(true);
    try {
      const place = await reverseGeocode(point, controller.signal);
      if (target === 'origin') setOrigin(place);
      else setDestination(place);
    } catch {
      // requisição cancelada por um novo movimento do mapa
    } finally {
      if (!controller.signal.aborted) setResolving(false);
    }
  };

  /** Centraliza na localização do usuário e a usa como o ponto que está sendo escolhido */
  const locateUser = (target: PickTarget | null) => {
    navigator.geolocation?.getCurrentPosition(
      ({ coords }) => {
        const point: LngLat = [coords.longitude, coords.latitude];
        setUserLocation(point);
        setFocus({ point, key: Date.now() });
        if (target) resolvePoint(target, point);
      },
      () => setApiError('Não foi possível obter sua localização. Verifique a permissão do navegador.'),
      { maximumAge: 60_000, timeout: 10_000 },
    );
  };

  // Começa na localização do usuário, já preenchendo a partida (se ele permitir)
  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      ({ coords }) => {
        const point: LngLat = [coords.longitude, coords.latitude];
        setUserLocation(point);
        setFocus({ point, key: Date.now() });
        resolvePoint('origin', point);
      },
      () => undefined, // recusar aqui é normal: o usuário escolhe no mapa ou digita
      { maximumAge: 5 * 60_000, timeout: 10_000 },
    );
  }, []);

  // Recebe os pontos explicitamente: logo após um setOrigin/setDestination o estado ainda é o antigo
  const goToStep = async (next: Step, from = origin, to = destination) => {
    setStep(next);
    setApiError(null);
    if (next !== 'review') {
      const place = next === 'origin' ? from : to;
      if (place) flyTo(place.coordinates);
      return;
    }
    // Revisão: desenha o trajeto
    routeAbort.current?.abort();
    setRoute(null);
    if (!from || !to) return;
    const controller = new AbortController();
    routeAbort.current = controller;
    try {
      setRoute(await getDrivingRoute(from.coordinates, to.coordinates, controller.signal));
    } catch {
      // sem rota desenhada; a busca continua funcionando
    }
  };

  // Endereço digitado: leva o próprio pino até ele (na mesma etapa), e o usuário pode
  // arrastar o mapa para ajustar o ponto antes de confirmar
  const handleTypedPlace = (target: PickTarget, place: Place | null) => {
    if (target === 'origin') setOrigin(place);
    else setDestination(place);
    if (!place) return;

    setStep(target);
    flyTo(place.coordinates);
    // Fecha o teclado do celular, que cobriria o mapa
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  };

  const handleConfirmPoint = () => {
    if (step === 'origin') goToStep(destination ? 'review' : 'destination');
    else goToStep('review');
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (step !== 'review' || !origin || !destination) return;

    let departure: Departure = { type: 'now' };
    if (mode === 'scheduled') {
      const time = Date.parse(scheduledAt);
      if (Number.isNaN(time)) return setScheduleError('Escolha a data e o horário.');
      if (time < Date.now() + MIN_SCHEDULE_MINUTES * 60_000)
        return setScheduleError(`Agende com pelo menos ${MIN_SCHEDULE_MINUTES} minutos de antecedência.`);
      departure = { type: 'scheduled', at: new Date(time).toISOString() };
    }
    setScheduleError(undefined);

    setApiError(null);
    setSubmitting(true);
    try {
      const search = await createRideSearch({ origin, destination, departure });
      router.push(`/viagem/busca/${search.id}`);
    } catch (error) {
      setApiError(error instanceof Error ? error.message : 'Não foi possível iniciar a busca.');
      setSubmitting(false);
    }
  };

  const picking: PickTarget | null = step === 'review' ? null : step;
  const pickedPlace = step === 'origin' ? origin : destination;
  const samePlace = Boolean(origin && destination && origin.id === destination.id);

  return (
    // Ocupa a tela inteira por cima do layout de fluxo
    <Box sx={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
      <Box sx={{ bgcolor: 'background.default', zIndex: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Container maxWidth="sm" sx={{ px: { xs: 2, sm: 3 } }}>
          <FlowTopBar title="Nova viagem" backHref="/homepage" />
        </Container>
      </Box>

      <Box sx={{ position: 'relative', flex: 1, overflow: 'hidden' }}>
        <RideMap
          origin={origin?.coordinates}
          destination={destination?.coordinates}
          route={route?.geometry.coordinates}
          picking={picking}
          focus={focus}
          padding={padding}
          onPickStart={() => setMoving(true)}
          onPick={(point) => {
            setMoving(false);
            if (picking) resolvePoint(picking, point);
          }}
          onLocate={() => locateUser(picking)}
        />

        {/* Campos de origem e destino */}
        <Container maxWidth="sm" sx={{ position: 'absolute', top: 12, left: 0, right: 0, px: { xs: 1.5, sm: 3 } }}>
          <Paper ref={topRef} elevation={6} sx={{ p: 1.5, borderRadius: 3 }}>
            <Stack spacing={1.5}>
              <PlaceAutocomplete
                label="Saindo de"
                value={origin}
                onChange={(place) => handleTypedPlace('origin', place)}
                onFocus={() => step !== 'origin' && goToStep('origin')}
                active={step === 'origin'}
                icon={<CircleDot size={18} />}
                proximity={userLocation}
              />
              <PlaceAutocomplete
                label="Indo para"
                value={destination}
                onChange={(place) => handleTypedPlace('destination', place)}
                onFocus={() => step !== 'destination' && goToStep('destination')}
                active={step === 'destination'}
                icon={<MapPin size={18} />}
                proximity={userLocation}
              />
            </Stack>
          </Paper>
        </Container>

        {/* Painel inferior: confirma o ponto do pino ou revisa a viagem */}
        <Container
          maxWidth="sm"
          sx={{ position: 'absolute', bottom: { xs: 0, sm: 16 }, left: 0, right: 0, px: { xs: 0, sm: 3 } }}
        >
          <Paper
            ref={bottomRef}
            component="form"
            noValidate
            onSubmit={handleSubmit}
            elevation={8}
            sx={{
              p: { xs: 2, sm: 2.5 },
              pb: { xs: 'calc(16px + env(safe-area-inset-bottom))', sm: 2.5 },
              borderRadius: { xs: '24px 24px 0 0', sm: 3 },
            }}
          >
            {apiError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {apiError}
              </Alert>
            )}

            {step === 'review' ? (
              <Stack spacing={2}>
                {route && (
                  <Chip
                    icon={<Route size={16} />}
                    label={`${(route.distanceMeters / 1000).toFixed(1)} km · cerca de ${Math.round(route.durationSeconds / 60)} min`}
                    sx={{ alignSelf: 'flex-start', fontWeight: 600 }}
                  />
                )}
                <DepartureSelector
                  mode={mode}
                  onModeChange={setMode}
                  scheduledAt={scheduledAt}
                  onScheduledAtChange={setScheduledAt}
                  error={scheduleError}
                />
                <Button
                  type="submit"
                  variant="contained"
                  disabled={submitting || samePlace}
                  startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : <Search size={20} />}
                  sx={{ ...pillButton, boxShadow: 3 }}
                >
                  {samePlace ? 'Origem e destino são iguais' : mode === 'now' ? 'Procurar motorista' : 'Publicar carona'}
                </Button>
              </Stack>
            ) : (
              <Stack spacing={2}>
                {/* Sempre as mesmas 3 linhas: o painel não muda de altura e o mapa não "pula" */}
                <Box aria-live="polite">
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    {step === 'origin' ? 'Ponto de partida' : 'Destino'}
                  </Typography>
                  <Typography sx={{ fontWeight: 700 }} noWrap>
                    {moving
                      ? 'Solte o mapa para escolher…'
                      : resolving
                        ? 'Buscando endereço…'
                        : (pickedPlace?.name ?? 'Arraste o mapa ou digite o endereço')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" noWrap>
                    {!moving && !resolving && pickedPlace?.address ? pickedPlace.address : '\u00a0'}
                  </Typography>
                </Box>
                <Button
                  type="button"
                  variant="contained"
                  onClick={handleConfirmPoint}
                  disabled={!pickedPlace || moving || resolving}
                  startIcon={<Check size={20} />}
                  sx={{ ...pillButton, boxShadow: 3 }}
                >
                  {step === 'origin' ? 'Confirmar partida' : 'Confirmar destino'}
                </Button>
              </Stack>
            )}
          </Paper>
        </Container>
      </Box>
    </Box>
  );
}

'use client';

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Check, CircleDot, MapPin, Route } from 'lucide-react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import FlowTopBar from '@/components/FlowTopBar';
import PlaceAutocomplete from '@/features/ride/components/PlaceAutocomplete';
import { getDrivingRoute, reverseGeocode, type DrivingRoute } from '@/services/mapbox';
import type { LngLat, Place } from '@/types/place';
import RideMap, { type MapPadding, type PickTarget } from './RideMap';

/** Respiro entre os painéis e a área útil do mapa */
const OVERLAY_GAP = 16;

/** origin/destination: escolhendo o ponto com o pino; review: confirmando a rota */
type Step = PickTarget | 'review';

const pillButton = { height: 52, borderRadius: 999, fontSize: '1rem', fontWeight: 600, textTransform: 'none' } as const;

export interface RouteReviewContext {
  origin: Place;
  destination: Place;
  route: DrivingRoute | null;
}

interface RoutePickerProps {
  title: string;
  backHref: string;
  labels?: {
    origin: string;
    destination: string;
    originStep: string;
    destinationStep: string;
  };
  /** Conteúdo do painel na revisão (ex.: horário e botão de envio, com type="submit") */
  renderReview: (context: RouteReviewContext) => ReactNode;
  onSubmit: (origin: Place, destination: Place) => void;
  /** Erro vindo de quem usa o componente (ex.: falha na API) */
  error?: string | null;
}

const DEFAULT_LABELS = {
  origin: 'Saindo de',
  destination: 'Indo para',
  originStep: 'Ponto de partida',
  destinationStep: 'Destino',
};

/**
 * Seleção de rota no estilo dos apps de corrida: mapa em tela cheia, campos de origem/destino
 * no topo e pino fixo no centro. O usuário arrasta o mapa ou digita o endereço (o pino vai até
 * ele) e confirma cada ponto. Usado por viagens e encomendas.
 */
export default function RoutePicker({ title, backHref, labels = DEFAULT_LABELS, renderReview, onSubmit, error }: RoutePickerProps) {
  const [step, setStep] = useState<Step>('origin');
  const [origin, setOrigin] = useState<Place | null>(null);
  const [destination, setDestination] = useState<Place | null>(null);
  const [resolving, setResolving] = useState(false);
  const [moving, setMoving] = useState(false);
  const [focus, setFocus] = useState<{ point: LngLat; key: number }>();
  const [userLocation, setUserLocation] = useState<LngLat>();
  const [route, setRoute] = useState<DrivingRoute | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

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
      () => setLocalError('Não foi possível obter sua localização. Verifique a permissão do navegador.'),
      { maximumAge: 60_000, timeout: 10_000 },
    );
  };

  // Começa na localização do usuário, já preenchendo a origem (se ele permitir)
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
    setLocalError(null);
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
      // sem rota desenhada; o fluxo continua funcionando
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
    if (origin && destination && origin.id === destination.id) {
      setLocalError('A origem e o destino precisam ser diferentes.');
      return;
    }
    if (step === 'origin') goToStep(destination ? 'review' : 'destination');
    else goToStep('review');
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (step === 'review' && origin && destination) onSubmit(origin, destination);
  };

  const picking: PickTarget | null = step === 'review' ? null : step;
  const pickedPlace = step === 'origin' ? origin : destination;
  const shownError = localError ?? error;

  return (
    // Ocupa a tela inteira por cima do layout de fluxo
    <Box sx={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
      <Box sx={{ bgcolor: 'background.default', zIndex: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Container maxWidth="sm" sx={{ px: { xs: 2, sm: 3 } }}>
          <FlowTopBar title={title} backHref={backHref} />
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
                label={labels.origin}
                value={origin}
                onChange={(place) => handleTypedPlace('origin', place)}
                onFocus={() => step !== 'origin' && goToStep('origin')}
                active={step === 'origin'}
                icon={<CircleDot size={18} />}
                proximity={userLocation}
              />
              <PlaceAutocomplete
                label={labels.destination}
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

        {/* Painel inferior: confirma o ponto do pino ou revisa a rota */}
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
            {shownError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {shownError}
              </Alert>
            )}

            {step === 'review' && origin && destination ? (
              <Stack spacing={2}>
                {route && (
                  <Chip
                    icon={<Route size={16} />}
                    label={`${(route.distanceMeters / 1000).toFixed(1)} km · cerca de ${Math.round(route.durationSeconds / 60)} min`}
                    sx={{ alignSelf: 'flex-start', fontWeight: 600 }}
                  />
                )}
                {renderReview({ origin, destination, route })}
              </Stack>
            ) : (
              <Stack spacing={2}>
                {/* Sempre as mesmas 3 linhas: o painel não muda de altura e o mapa não "pula" */}
                <Box aria-live="polite">
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    {step === 'origin' ? labels.originStep : labels.destinationStep}
                  </Typography>
                  <Typography sx={{ fontWeight: 700 }} noWrap>
                    {moving
                      ? 'Solte o mapa para escolher…'
                      : resolving
                        ? 'Buscando endereço…'
                        : (pickedPlace?.name ?? 'Arraste o mapa ou digite o endereço')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" noWrap>
                    {!moving && !resolving && pickedPlace?.address ? pickedPlace.address : ' '}
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
                  Confirmar {step === 'origin' ? labels.originStep.toLowerCase() : labels.destinationStep.toLowerCase()}
                </Button>
              </Stack>
            )}
          </Paper>
        </Container>
      </Box>
    </Box>
  );
}

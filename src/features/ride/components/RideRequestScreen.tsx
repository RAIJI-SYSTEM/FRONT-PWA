'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Briefcase, CircleCheck, MapPin, Send } from 'lucide-react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
import ActionBar from '@/components/ActionBar';
import StatusScreen from '@/components/StatusScreen';
import { useSession } from '@/hooks/useSession';
import type { BaggageItemApi } from '@/services/backend/types';
import { fromBrazilLocal, toCents } from '@/services/backend/client';
import { getSearchResult } from '@/services/rideSearch';
import { requestSeat } from '@/services/rides';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate, formatTime } from '@/utils/formatDate';
import BaggageEditor from '../baggage/BaggageEditor';

const pillButton = { height: 52, borderRadius: 999, fontSize: '1rem', fontWeight: 600, textTransform: 'none' } as const;

/**
 * Pedir vaga numa carona encontrada. No fim, a pergunta: "Vai levar alguma carga ou mala?"
 * (dá para pular e informar depois, nos detalhes da viagem). O motorista aceita ou recusa.
 */
export default function RideRequestScreen({ searchId, rideId }: { searchId: string; rideId: string }) {
  const session = useSession();
  const found = useMemo(() => getSearchResult(searchId, rideId), [searchId, rideId]);
  const [name, setName] = useState<string | null>(null);
  const [takesLuggage, setTakesLuggage] = useState<'no' | 'yes' | null>(null);
  const [baggage, setBaggage] = useState<BaggageItemApi[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  if (!found) {
    return (
      <Alert severity="warning" sx={{ mt: 2 }}>
        Esta busca expirou. <Link href="/viagem/nova">Faça uma nova busca</Link>.
      </Alert>
    );
  }

  const { search, result } = found;
  const ride = result.ride;
  const departureAt = fromBrazilLocal(ride.departureDate);
  const passengerName = name ?? session?.user.name ?? '';

  const submit = async () => {
    setError(null);
    if (!passengerName.trim()) {
      setError('Informe seu nome.');
      return;
    }
    setSending(true);
    try {
      // Trecho: embarca/desce no meio do caminho (o preço é o proporcional)
      const segment = result.fullRoute
        ? {}
        : {
            pickup: { latitude: search.origin.coordinates[1], longitude: search.origin.coordinates[0], address: search.origin.name },
            dropoff: { latitude: search.destination.coordinates[1], longitude: search.destination.coordinates[0], address: search.destination.name },
          };
      await requestSeat(ride.id, { passengerName: passengerName.trim(), baggage: takesLuggage === 'yes' ? baggage : [], ...segment });
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível pedir a vaga.');
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <StatusScreen
        icon={CircleCheck}
        tone="success"
        title="Pedido enviado ao motorista"
        description={`${ride.driverName ?? 'O motorista'} vai aceitar ou recusar. Avisaremos você. Se precisar, dá para mudar a bagagem nos detalhes da viagem.`}
        actions={
          <>
            <Button component={Link} href="/corridas" variant="contained" sx={pillButton}>
              Ver minhas viagens
            </Button>
            <Button component={Link} href="/homepage" color="inherit" sx={pillButton}>
              Voltar ao início
            </Button>
          </>
        }
      />
    );
  }

  return (
    <Stack spacing={2.5}>
      <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
        <Typography sx={{ fontWeight: 800, fontSize: '1.1rem' }}>{ride.driverName ?? 'Motorista'}</Typography>
        <Typography variant="body2" color="text.secondary">
          {ride.originCity} → {ride.destinationCity}
          {result.vehicle ? ` · ${result.vehicle}` : ''}
        </Typography>
        <Divider sx={{ my: 1.5 }} />
        <Stack spacing={0.75}>
          <Typography variant="body2">
            Saída: <b>{formatDate(departureAt)} às {formatTime(departureAt)}</b>
          </Typography>
          {ride.meetingPoint && (
            <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
              <MapPin size={14} />
              <Typography variant="body2">Encontro: {ride.meetingPoint}</Typography>
            </Stack>
          )}
          {!result.fullRoute && (
            <Typography variant="body2" color="text.secondary">
              Você embarca em {search.origin.name} e desce em {search.destination.name} (trecho do caminho).
            </Typography>
          )}
          <Typography sx={{ fontWeight: 800, fontSize: '1.25rem', mt: 0.5 }}>
            {result.suggestedPrice ? formatCurrency(toCents(result.suggestedPrice)) : 'Grátis'}
          </Typography>
        </Stack>
      </Paper>

      <TextField label="Seu nome" value={passengerName} onChange={(e) => setName(e.target.value)} />

      <Stack spacing={1.25}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <Briefcase size={20} />
          <Typography sx={{ fontWeight: 700 }}>Vai levar alguma carga ou mala?</Typography>
        </Stack>
        <ToggleButtonGroup
          exclusive
          fullWidth
          value={takesLuggage}
          onChange={(_, value) => value && setTakesLuggage(value)}
          aria-label="Vai levar bagagem?"
        >
          <ToggleButton value="no" sx={{ textTransform: 'none', fontWeight: 600 }}>
            Não, só eu
          </ToggleButton>
          <ToggleButton value="yes" sx={{ textTransform: 'none', fontWeight: 600 }}>
            Sim, vou levar
          </ToggleButton>
        </ToggleButtonGroup>
        <Typography variant="caption" color="text.secondary">
          Você pode mudar depois, nos detalhes da viagem. Aumentar a bagagem depois do aceite depende do motorista aprovar.
        </Typography>
        {takesLuggage === 'yes' && <BaggageEditor items={baggage} onChange={setBaggage} />}
      </Stack>

      {error && <Alert severity="error">{error}</Alert>}

      <ActionBar>
        <Button
          fullWidth
          variant="contained"
          onClick={submit}
          disabled={sending || takesLuggage === null || (takesLuggage === 'yes' && baggage.length === 0)}
          startIcon={sending ? <CircularProgress size={20} color="inherit" /> : <Send size={18} />}
          sx={{ ...pillButton, boxShadow: 3 }}
        >
          Enviar pedido ao motorista
        </Button>
      </ActionBar>
    </Stack>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Briefcase, MapPin, Save, X } from 'lucide-react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { usePolling } from '@/hooks/usePolling';
import type { BaggageItemApi, MyBookingApi } from '@/services/backend/types';
import { fromBrazilLocal, toCents } from '@/services/backend/client';
import { cancelBooking, listMyBookings, updateBaggage } from '@/services/rides';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate, formatTime } from '@/utils/formatDate';
import BaggageEditor from '../baggage/BaggageEditor';
import { describeBaggage } from '../baggage/baggageTypes';

const loadOnce = () => false;
const findBooking = async (id: string) => ({ item: (await listMyBookings()).find((b) => b.booking.id === id) ?? null });

const STATUS_LABEL = { PENDING: 'Aguardando o motorista', CONFIRMED: 'Vaga confirmada', CANCELLED: 'Cancelada', COMPLETED: 'Concluída' } as const;

/** Detalhes da minha reserva: mudar a bagagem até a viagem começar, ou cancelar */
export default function BookingDetailScreen({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const { data, error, setData } = usePolling(`booking:${bookingId}`, () => findBooking(bookingId), loadOnce);
  const item = data?.item ?? null;
  const setItem = (next: MyBookingApi) => setData({ item: next });
  const [editing, setEditing] = useState<BaggageItemApi[] | null>(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  if (error) return <Alert severity="error">{error}</Alert>;
  if (data && !item) return <Alert severity="error">Reserva não encontrada.</Alert>;
  if (!item) {
    return (
      <Stack sx={{ alignItems: 'center', py: 8 }}>
        <CircularProgress />
      </Stack>
    );
  }

  const { booking, ride } = item;
  const departureAt = fromBrazilLocal(ride.departureDate);
  const editable = ride.status === 'PLANNED' && (booking.status === 'PENDING' || booking.status === 'CONFIRMED');

  const saveBaggage = async () => {
    if (!editing) return;
    setSaving(true);
    setNotice(null);
    try {
      const updated = await updateBaggage(ride.id, booking.id, editing);
      setItem({ booking: updated, ride });
      setEditing(null);
      setNotice(
        updated.pendingBaggage.length > 0
          ? 'A bagagem nova aumenta a carga: o motorista precisa aprovar. Até lá, vale a anterior.'
          : 'Bagagem atualizada.',
      );
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Não foi possível salvar.');
    } finally {
      setSaving(false);
    }
  };

  const cancel = async () => {
    if (!window.confirm('Cancelar esta reserva?')) return;
    setSaving(true);
    try {
      await cancelBooking(ride.id, booking.id);
      router.push('/corridas');
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Não foi possível cancelar.');
      setSaving(false);
    }
  };

  return (
    <Stack spacing={2.5}>
      <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography sx={{ fontWeight: 800 }}>{ride.driverName ?? 'Motorista'}</Typography>
          <Chip size="small" label={STATUS_LABEL[booking.status]} color={booking.status === 'CONFIRMED' ? 'success' : 'default'} />
        </Stack>
        <Typography variant="body2" color="text.secondary">
          {booking.pickupAddress ?? ride.originCity} → {booking.dropoffAddress ?? ride.destinationCity}
        </Typography>
        <Divider sx={{ my: 1.5 }} />
        <Typography variant="body2">
          Saída: <b>{formatDate(departureAt)} às {formatTime(departureAt)}</b>
        </Typography>
        {ride.meetingPoint && (
          <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', mt: 0.5 }}>
            <MapPin size={14} />
            <Typography variant="body2">Encontro: {ride.meetingPoint}</Typography>
          </Stack>
        )}
        <Typography sx={{ fontWeight: 800, mt: 1 }}>{booking.price ? formatCurrency(toCents(booking.price)) : 'Grátis'}</Typography>
      </Paper>

      <Stack spacing={1}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <Briefcase size={20} />
          <Typography sx={{ fontWeight: 700 }}>Bagagem</Typography>
        </Stack>
        <Typography variant="body2">{describeBaggage(booking.baggage)}</Typography>
        {booking.pendingBaggage.length > 0 && (
          <Alert severity="info">Esperando o motorista aprovar: {describeBaggage(booking.pendingBaggage)}</Alert>
        )}
        {editable &&
          (editing ? (
            <>
              <BaggageEditor items={editing} onChange={setEditing} />
              <Stack direction="row" spacing={1}>
                <Button variant="contained" onClick={saveBaggage} disabled={saving} startIcon={<Save size={16} />} sx={{ borderRadius: 999, textTransform: 'none' }}>
                  Salvar bagagem
                </Button>
                <Button color="inherit" onClick={() => setEditing(null)} sx={{ borderRadius: 999, textTransform: 'none' }}>
                  Desistir
                </Button>
              </Stack>
            </>
          ) : (
            <Button variant="outlined" onClick={() => setEditing(booking.baggage)} sx={{ alignSelf: 'flex-start', borderRadius: 999, textTransform: 'none' }}>
              {booking.baggage.length === 0 ? 'Vou levar carga ou mala' : 'Mudar bagagem'}
            </Button>
          ))}
      </Stack>

      {notice && <Alert severity="info" onClose={() => setNotice(null)}>{notice}</Alert>}

      {editable && (
        <Button color="error" onClick={cancel} disabled={saving} startIcon={<X size={16} />} sx={{ alignSelf: 'flex-start', textTransform: 'none' }}>
          Cancelar reserva
        </Button>
      )}
    </Stack>
  );
}

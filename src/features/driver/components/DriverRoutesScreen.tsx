'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Armchair, MapPin, Package, Plus, Route } from 'lucide-react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import StatusScreen from '@/components/StatusScreen';
import { usePolling } from '@/hooks/usePolling';
import { cancelRoute, getDriverAccount, listDriverRoutes } from '@/services/driverMode';
import type { DriverRoute } from '@/types/driverMode';
import { formatPlate } from '@/utils/driverValidation';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate, formatTime } from '@/utils/formatDate';

const loadOnce = () => false;
const STATUS = {
  published: { label: 'Publicada', color: 'primary' },
  completed: { label: 'Concluída', color: 'success' },
  canceled: { label: 'Cancelada', color: 'default' },
} as const;

/** Rotas publicadas pelo motorista (aparecem para passageiros em "Buscar → Entre cidades") */
export default function DriverRoutesScreen() {
  const { data: routes, error, setData } = usePolling('driver-routes', listDriverRoutes, loadOnce);
  const { data: account } = usePolling('driver-account', getDriverAccount, loadOnce);
  const [confirm, setConfirm] = useState<DriverRoute | null>(null);
  const [canceling, setCanceling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  if (!routes) {
    return error ? (
      <Alert severity="error">{error}</Alert>
    ) : (
      <Stack sx={{ alignItems: 'center', py: 8 }}>
        <CircularProgress />
      </Stack>
    );
  }

  const vehicleLabel = (id: string) => {
    const v = account?.vehicles.find((x) => x.id === id);
    return v ? `${v.model} · ${formatPlate(v.plate)}` : '';
  };

  const doCancel = async () => {
    if (!confirm) return;
    setCanceling(true);
    setCancelError(null);
    try {
      const updated = await cancelRoute(confirm.id);
      setData((prev) => prev?.map((r) => (r.id === updated.id ? updated : r)) ?? prev);
      setConfirm(null);
    } catch (err) {
      setCancelError(err instanceof Error ? err.message : 'Não foi possível cancelar.');
    } finally {
      setCanceling(false);
    }
  };

  return (
    <Stack spacing={2.5}>
      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography component="h1" variant="h5" sx={{ fontWeight: 800 }}>
            Minhas rotas
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Passageiros veem suas rotas na busca entre cidades.
          </Typography>
        </Box>
      </Stack>

      <Button
        component={Link}
        href="/motorista/rotas/nova"
        variant="contained"
        startIcon={<Plus size={20} />}
        sx={{ height: 52, borderRadius: 999, textTransform: 'none', fontWeight: 600, fontSize: '1rem', boxShadow: 3 }}
      >
        Publicar nova rota
      </Button>

      {routes.length === 0 ? (
        <StatusScreen icon={Route} title="Nenhuma rota publicada" description="Vai fazer uma viagem? Publique a rota e ganhe levando pessoas ou encomendas." />
      ) : (
        <Stack spacing={1.5}>
          {routes.map((route) => {
            const status = STATUS[route.status];
            const free = route.seats - route.seatsTaken;
            return (
              <Paper key={route.id} variant="outlined" component="article" sx={{ p: 2, borderRadius: 3, opacity: route.status === 'canceled' ? 0.6 : 1 }}>
                <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography sx={{ fontWeight: 800, fontSize: '1.25rem', lineHeight: 1.1 }}>{formatTime(route.departureAt)}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {formatDate(route.departureAt)}
                    </Typography>
                  </Box>
                  <Chip label={status.label} color={status.color} size="small" sx={{ fontWeight: 600 }} />
                </Stack>
                <Typography sx={{ fontWeight: 700, mt: 1 }}>
                  {route.originCity} → {route.destinationCity}
                </Typography>
                <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', color: 'text.secondary' }}>
                  <MapPin size={14} />
                  <Typography variant="body2" noWrap>
                    Saída: {route.departurePoint}
                  </Typography>
                </Stack>
                <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1, mt: 1.5, alignItems: 'center' }}>
                  <Typography sx={{ fontWeight: 700, mr: 0.5 }}>{formatCurrency(route.pricePerSeatCents)}/lugar</Typography>
                  <Chip size="small" variant="outlined" icon={<Armchair size={14} />} label={`${free} de ${route.seats} livre${free === 1 ? '' : 's'}`} />
                  {route.acceptsPackages && <Chip size="small" variant="outlined" icon={<Package size={14} />} label="Encomendas" />}
                </Stack>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                  {vehicleLabel(route.vehicleId)}
                </Typography>
                {route.status === 'published' && (
                  <Button
                    size="small"
                    color="error"
                    onClick={() => setConfirm(route)}
                    sx={{ mt: 1, borderRadius: 999, textTransform: 'none', fontWeight: 600 }}
                  >
                    Cancelar rota
                  </Button>
                )}
              </Paper>
            );
          })}
        </Stack>
      )}

      <Dialog open={Boolean(confirm)} onClose={() => setConfirm(null)} aria-labelledby="cancel-route-title" fullWidth maxWidth="xs">
        <Stack spacing={2} sx={{ p: 3 }}>
          <Typography id="cancel-route-title" variant="h6" sx={{ fontWeight: 700 }}>
            Cancelar esta rota?
          </Typography>
          <Typography color="text.secondary">
            {confirm && `${confirm.originCity} → ${confirm.destinationCity}, ${formatDate(confirm.departureAt)} às ${formatTime(confirm.departureAt)}. `}
            Ela deixa de aparecer na busca e quem reservou é avisado.
          </Typography>
          {cancelError && <Alert severity="error">{cancelError}</Alert>}
          <Stack direction="row" spacing={1.5}>
            <Button fullWidth color="inherit" onClick={() => setConfirm(null)} sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 600 }}>
              Manter
            </Button>
            <Button
              fullWidth
              variant="contained"
              color="error"
              onClick={doCancel}
              disabled={canceling}
              sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 600 }}
            >
              Cancelar rota
            </Button>
          </Stack>
        </Stack>
      </Dialog>
    </Stack>
  );
}

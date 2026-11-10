'use client';

import Link from 'next/link';
import { Car, ChevronRight, ListChecks, Package, Plus, Route, Wallet, type LucideIcon } from 'lucide-react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import ButtonBase from '@mui/material/ButtonBase';
import CircularProgress from '@mui/material/CircularProgress';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import RouteSummary from '@/features/activities/components/RouteSummary';
import { usePolling } from '@/hooks/usePolling';
import { listDriverJobs, listRegionRequests } from '@/services/driverMode';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate, formatTime } from '@/utils/formatDate';

const POLL_MS = 15_000;
const keepPolling = () => true;
const loadOnce = () => false;

/** Cartão com número grande (ganhos) */
function StatTile({ label, value, icon: Icon }: { label: string; value: string; icon: LucideIcon }) {
  return (
    <Paper variant="outlined" sx={{ p: 1.75, borderRadius: 3, flex: 1, minWidth: 0 }}>
      <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', color: 'text.secondary' }}>
        <Icon size={16} />
        <Typography variant="caption" noWrap>
          {label}
        </Typography>
      </Stack>
      <Typography sx={{ fontWeight: 800, fontSize: '1.25rem', mt: 0.5 }}>{value}</Typography>
    </Paper>
  );
}

/** Atalho com contagem para os pedidos da região */
function RegionShortcut({ href, icon: Icon, count, label }: { href: string; icon: LucideIcon; count: number; label: string }) {
  return (
    <ButtonBase
      component={Link}
      href={href}
      sx={{ flex: 1, minWidth: 0, justifyContent: 'flex-start', gap: 1.5, p: 1.75, borderRadius: 3, border: 1, borderColor: 'divider', bgcolor: 'background.paper', textAlign: 'left' }}
    >
      <Box sx={{ width: 40, height: 40, flexShrink: 0, borderRadius: 2, display: 'grid', placeItems: 'center', color: 'primary.contrastText', bgcolor: 'primary.main' }}>
        <Icon size={20} />
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontWeight: 800, fontSize: '1.25rem', lineHeight: 1.1 }}>{count}</Typography>
        <Typography variant="caption" color="text.secondary">
          {label}
        </Typography>
      </Box>
    </ButtonBase>
  );
}

/** Início do modo motorista: ganhos, pedidos da região, atalho para rotas e próximos compromissos */
export default function DriverHomeScreen() {
  const requestsQuery = usePolling('driver-requests', listRegionRequests, keepPolling, POLL_MS);
  const jobsQuery = usePolling('driver-jobs', listDriverJobs, loadOnce);
  const requests = requestsQuery.data;
  const jobs = jobsQuery.data;

  if (!requests || !jobs) {
    const error = requestsQuery.error ?? jobsQuery.error;
    return error ? (
      <Alert severity="error">{error}</Alert>
    ) : (
      <Stack sx={{ alignItems: 'center', py: 8 }}>
        <CircularProgress />
      </Stack>
    );
  }

  const upcoming = jobs.filter((j) => j.status === 'accepted' || j.status === 'in_progress');
  const earned = jobs.filter((j) => j.status === 'completed').reduce((t, j) => t + j.earningsCents, 0);
  const toReceive = upcoming.reduce((t, j) => t + j.earningsCents, 0);

  return (
    <Stack spacing={3}>
      <Typography component="h1" variant="h5" sx={{ fontWeight: 800 }}>
        Seu painel
      </Typography>

      <Stack direction="row" spacing={1.5}>
        <StatTile label="Ganhos concluídos" value={formatCurrency(earned)} icon={Wallet} />
        <StatTile label="A receber" value={formatCurrency(toReceive)} icon={ListChecks} />
      </Stack>

      <Box component="section" aria-labelledby="region-title">
        <Typography id="region-title" component="h2" variant="h6" sx={{ fontWeight: 700, mb: 1.25 }}>
          Na sua região agora
        </Typography>
        <Stack direction="row" spacing={1.5}>
          <RegionShortcut href="/motorista/viagens?aba=regiao" icon={Car} count={requests.filter((r) => r.kind === 'ride').length} label="caronas disponíveis" />
          <RegionShortcut href="/motorista/encomendas?aba=regiao" icon={Package} count={requests.filter((r) => r.kind === 'delivery').length} label="encomendas disponíveis" />
        </Stack>
      </Box>

      {/* Rotas: publicar uma nova ou ver/alterar as que já foram publicadas */}
      <Box
        sx={{
          p: 2,
          borderRadius: 3,
          color: 'primary.contrastText',
          background: 'linear-gradient(135deg, var(--mui-palette-primary-light) 0%, var(--mui-palette-primary-main) 100%)',
          boxShadow: 3,
        }}
      >
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
          <Route size={28} style={{ flexShrink: 0 }} />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontWeight: 800 }}>Vai viajar?</Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Publique sua rota e leve passageiros ou encomendas no caminho.
            </Typography>
          </Box>
        </Stack>
        <Stack direction="row" spacing={1.5} sx={{ mt: 1.5 }}>
          <Button
            component={Link}
            href="/motorista/rotas"
            fullWidth
            sx={{ height: 44, borderRadius: 999, textTransform: 'none', fontWeight: 700, color: 'inherit', border: '1px solid rgba(255 255 255 / 0.6)' }}
          >
            Minhas rotas
          </Button>
          <Button
            component={Link}
            href="/motorista/rotas/nova"
            fullWidth
            startIcon={<Plus size={18} />}
            sx={{ height: 44, borderRadius: 999, textTransform: 'none', fontWeight: 700, bgcolor: 'background.paper', color: 'primary.main', '&:hover': { bgcolor: 'background.paper' } }}
          >
            Publicar rota
          </Button>
        </Stack>
      </Box>

      <Box component="section" aria-labelledby="upcoming-title">
        <Typography id="upcoming-title" component="h2" variant="h6" sx={{ fontWeight: 700, mb: 1.25 }}>
          Próximos compromissos
        </Typography>
        {upcoming.length === 0 ? (
          <Typography color="text.secondary">Nada agendado. Aceite uma carona ou encomenda na sua região.</Typography>
        ) : (
          <Stack spacing={1.5}>
            {upcoming.slice(0, 3).map((job) => (
              <ButtonBase
                key={job.id}
                component={Link}
                href={`${job.kind === 'ride' ? '/motorista/viagens' : '/motorista/encomendas'}?aba=minhas`}
                sx={{ display: 'block', textAlign: 'left', p: 2, borderRadius: 3, border: 1, borderColor: 'divider', bgcolor: 'background.paper' }}
              >
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1 }}>
                  {job.kind === 'ride' ? <Car size={18} /> : <Package size={18} />}
                  <Typography sx={{ fontWeight: 700, flex: 1 }} noWrap>
                    {job.customerName} · {formatDate(job.date)} {formatTime(job.date)}
                  </Typography>
                  <Typography sx={{ fontWeight: 700 }}>{formatCurrency(job.earningsCents)}</Typography>
                  <ChevronRight size={18} />
                </Stack>
                <RouteSummary origin={job.origin} destination={job.destination} />
              </ButtonBase>
            ))}
          </Stack>
        )}
      </Box>
    </Stack>
  );
}

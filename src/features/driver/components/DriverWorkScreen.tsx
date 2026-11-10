'use client';

import { useCallback, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Car, Inbox, MessageCircle, Package, Star } from 'lucide-react';
import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Rating from '@mui/material/Rating';
import Snackbar from '@mui/material/Snackbar';
import Stack from '@mui/material/Stack';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Typography from '@mui/material/Typography';
import StatusScreen from '@/components/StatusScreen';
import HistoryCard from '@/features/history/components/HistoryCard';
import HistoryList from '@/features/history/components/HistoryList';
import { participantColor } from '@/features/messages/participantColor';
import FilterChips from '@/features/search/components/FilterChips';
import { usePolling } from '@/hooks/usePolling';
import { listDriverJobs, listRegionRequests, rateCustomer, respondToRequest } from '@/services/driverMode';
import type { DriverJob, DriverJobStatus, RegionRequest } from '@/types/driverMode';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate, formatTime } from '@/utils/formatDate';
import { customerTagsFor } from '@/utils/ratingTags';
import RequestCard from './RequestCard';

// Diálogo de avaliação só é baixado quando necessário
const RatingDialog = dynamic(() => import('@/components/RatingDialog'));

export type WorkKind = RegionRequest['kind'];
export type WorkTab = 'regiao' | 'minhas';

const COPY: Record<WorkKind, { title: string; noun: string; plural: string; path: string; customer: string; icon: typeof Car }> = {
  ride: { title: 'Viagens', noun: 'carona', plural: 'caronas', path: '/motorista/viagens', customer: 'Passageiro', icon: Car },
  delivery: { title: 'Encomendas', noun: 'encomenda', plural: 'encomendas', path: '/motorista/encomendas', customer: 'Remetente', icon: Package },
};

const STATUS: Record<DriverJobStatus, { label: string; color: 'default' | 'primary' | 'secondary' | 'success' }> = {
  accepted: { label: 'Aceita', color: 'primary' },
  in_progress: { label: 'Em andamento', color: 'primary' },
  completed: { label: 'Concluída', color: 'success' },
  canceled: { label: 'Cancelada', color: 'default' },
};

/** Novos pedidos chegam a todo momento: a lista da região atualiza a cada 15s */
const POLL_MS = 15_000;
const keepPolling = () => true;
const loadOnce = () => false;
const isActive = (j: DriverJob) => j.status === 'accepted' || j.status === 'in_progress';

/**
 * Viagens (caronas) ou Encomendas do motorista, em duas abas:
 * "Na região" (pedidos para aceitar/recusar) e "Minhas" (aceitas e concluídas, com avaliação).
 */
export default function DriverWorkScreen({ kind, initialTab }: { kind: WorkKind; initialTab: WorkTab }) {
  const router = useRouter();
  const copy = COPY[kind];
  const [tab, setTab] = useState<WorkTab>(initialTab);
  const requestsQuery = usePolling('driver-requests', listRegionRequests, keepPolling, POLL_MS);
  const jobsQuery = usePolling('driver-jobs', listDriverJobs, loadOnce);
  const setRequests = requestsQuery.setData;
  const setJobs = jobsQuery.setData;

  const [busy, setBusy] = useState<{ id: string; action: 'accept' | 'reject' } | null>(null);
  const [feedback, setFeedback] = useState<{ message: string; accepted: boolean } | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [jobFilter, setJobFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [rating, setRating] = useState<DriverJob | null>(null);

  const changeTab = (next: WorkTab) => {
    setTab(next);
    router.replace(`${copy.path}?aba=${next}`, { scroll: false });
  };

  // Estável (useCallback): os cartões usam memo e não redesenham à toa
  const respond = useCallback(
    async (request: RegionRequest, action: 'accept' | 'reject') => {
      setActionError(null);
      setBusy({ id: request.id, action });
      try {
        await respondToRequest(request.id, action);
        setRequests((prev) => prev?.filter((r) => r.id !== request.id) ?? prev);
        if (action === 'accept') listDriverJobs().then(setJobs).catch(() => undefined); // aparece em "Minhas"
        setFeedback({
          accepted: action === 'accept',
          message: action === 'accept' ? `Você aceitou a ${COPY[request.kind].noun} de ${request.customerName}.` : 'Pedido recusado.',
        });
      } catch (err) {
        setActionError(err instanceof Error ? err.message : 'Não foi possível responder.');
        listRegionRequests().then(setRequests).catch(() => undefined); // pode ter sido aceito por outro motorista
      } finally {
        setBusy(null);
      }
    },
    [setRequests, setJobs],
  );

  const requests = requestsQuery.data?.filter((r) => r.kind === kind);
  const jobs = jobsQuery.data?.filter((j) => j.kind === kind);

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

  const visibleJobs = jobs.filter((j) => jobFilter === 'all' || (jobFilter === 'active' ? isActive(j) : j.status === 'completed'));
  const earned = jobs.filter((j) => j.status === 'completed').reduce((t, j) => t + j.earningsCents, 0);
  const potential = requests.reduce((t, r) => t + r.earningsCents, 0);

  return (
    <Stack spacing={2.5}>
      <Stack spacing={0.25}>
        <Typography component="h1" variant="h5" sx={{ fontWeight: 800 }}>
          {copy.title}
        </Typography>
        <Typography variant="body2" color="text.secondary" aria-live="polite">
          {tab === 'regiao'
            ? `${requests.length} ${requests.length === 1 ? copy.noun : copy.plural} na região${potential > 0 ? ` · até ${formatCurrency(potential)}` : ''}`
            : `${formatCurrency(earned)} em ${copy.plural} concluídas`}
        </Typography>
      </Stack>

      <Tabs
        value={tab}
        onChange={(_, value: WorkTab) => changeTab(value)}
        variant="fullWidth"
        aria-label={`${copy.title}: região ou minhas`}
        sx={{
          minHeight: 44,
          p: 0.5,
          borderRadius: 999,
          bgcolor: 'background.paper',
          border: 1,
          borderColor: 'divider',
          '& .MuiTabs-indicator': { height: '100%', borderRadius: 999, zIndex: 0 },
          '& .MuiTab-root': { minHeight: 36, zIndex: 1, textTransform: 'none', fontWeight: 600, borderRadius: 999 },
          '& .MuiTab-root.Mui-selected': { color: 'primary.contrastText' },
        }}
      >
        <Tab value="regiao" label={`Na região (${requests.length})`} />
        <Tab value="minhas" label={`Minhas (${jobs.length})`} />
      </Tabs>

      {actionError && (
        <Alert severity="warning" onClose={() => setActionError(null)}>
          {actionError}
        </Alert>
      )}

      {tab === 'regiao' ? (
        requests.length === 0 ? (
          <StatusScreen icon={Inbox} title={`Nenhuma ${copy.noun} na região agora`} description="Novos pedidos aparecem aqui automaticamente." />
        ) : (
          <Stack spacing={1.5}>
            {requests.map((request) => (
              <RequestCard key={request.id} request={request} busy={busy?.id === request.id ? busy.action : null} onRespond={respond} />
            ))}
          </Stack>
        )
      ) : (
        <>
          <FilterChips
            label="Situação"
            options={[
              { value: 'all', label: 'Todas' },
              { value: 'active', label: `Aceitas · ${jobs.filter(isActive).length}` },
              { value: 'completed', label: 'Concluídas' },
            ]}
            value={jobFilter}
            onChange={setJobFilter}
          />
          <HistoryList
            key={jobFilter}
            items={visibleJobs}
            emptyTitle={`Você ainda não aceitou nenhuma ${copy.noun}`}
            filtered={jobFilter !== 'all'}
            onClear={() => setJobFilter('all')}
            renderItem={(job) => (
              <HistoryCard
                icon={copy.icon}
                title={job.customerName}
                subtitle={`${formatDate(job.date)} · ${formatTime(job.date)}`}
                status={STATUS[job.status]}
                origin={job.origin}
                destination={job.destination}
                details={<Typography sx={{ fontWeight: 700 }}>Você recebe {formatCurrency(job.earningsCents)}</Typography>}
                footer={
                  <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                    <Avatar sx={{ width: 36, height: 36, bgcolor: participantColor(job.customerId), color: '#fff', fontWeight: 700, fontSize: '0.95rem' }}>
                      {job.customerName.charAt(0)}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                        {job.customerName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {copy.customer}
                      </Typography>
                    </Box>
                    {job.customerRating ? (
                      <Stack sx={{ alignItems: 'flex-end' }}>
                        <Rating
                          value={job.customerRating.stars}
                          readOnly
                          size="small"
                          icon={<Star size={16} fill="currentColor" />}
                          emptyIcon={<Star size={16} />}
                          sx={{ color: 'primary.main' }}
                          aria-label={`Você deu ${job.customerRating.stars} de 5 estrelas`}
                        />
                        <Typography variant="caption" color="text.secondary">
                          Sua avaliação
                        </Typography>
                      </Stack>
                    ) : job.status === 'completed' ? (
                      <Button size="small" variant="contained" startIcon={<Star size={16} />} onClick={() => setRating(job)} sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 600 }}>
                        Avaliar
                      </Button>
                    ) : isActive(job) ? (
                      <Button
                        size="small"
                        variant="outlined"
                        component={Link}
                        href="/motorista/mensagens"
                        startIcon={<MessageCircle size={16} />}
                        sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 600 }}
                      >
                        Mensagem
                      </Button>
                    ) : null}
                  </Stack>
                }
              />
            )}
          />
        </>
      )}

      {rating && (
        <RatingDialog
          person={{ id: rating.customerId, name: rating.customerName }}
          title={`Como foi ${kind === 'ride' ? 'a carona' : 'a entrega'} com ${rating.customerName.split(' ')[0]}?`}
          subtitle="Avaliar clientes ajuda a manter a comunidade segura para os motoristas."
          tagsFor={customerTagsFor}
          onSubmit={async (value) => {
            const updated = await rateCustomer(rating.id, value);
            setJobs((prev) => prev?.map((j) => (j.id === updated.id ? updated : j)) ?? prev);
            setRating(null);
            setFeedback({ message: 'Avaliação enviada. Obrigado!', accepted: false });
          }}
          onClose={() => setRating(null)}
        />
      )}

      <Snackbar
        open={Boolean(feedback)}
        autoHideDuration={4000}
        onClose={() => setFeedback(null)}
        message={feedback?.message}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        action={
          feedback?.accepted && (
            <Button
              color="primary"
              size="small"
              sx={{ fontWeight: 700 }}
              onClick={() => {
                setFeedback(null);
                changeTab('minhas');
              }}
            >
              Ver em Minhas
            </Button>
          )
        }
      />
    </Stack>
  );
}

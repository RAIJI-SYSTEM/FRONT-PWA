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
/** Filtro por tipo: tudo, só caronas ou só encomendas (na URL: ?tipo=caronas|encomendas) */
export type WorkFilter = WorkKind | 'all';

const COPY: Record<WorkKind, { noun: string; plural: string; param: string; customer: string; icon: typeof Car }> = {
  ride: { noun: 'carona', plural: 'caronas', param: 'caronas', customer: 'Passageiro', icon: Car },
  delivery: { noun: 'encomenda', plural: 'encomendas', param: 'encomendas', customer: 'Remetente', icon: Package },
};

const PATH = '/motorista/pedidos';

/** ?tipo= da URL → filtro */
export const workFilterFromParam = (value: string | null): WorkFilter =>
  value === COPY.ride.param ? 'ride' : value === COPY.delivery.param ? 'delivery' : 'all';

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
 * Pedidos do motorista (caronas e encomendas nas viagens que ele publicou), em duas abas:
 * "Pedidos" (para aceitar/recusar) e "Minhas" (aceitas e concluídas, com avaliação).
 */
export default function DriverWorkScreen({ initialKind, initialTab }: { initialKind: WorkFilter; initialTab: WorkTab }) {
  const router = useRouter();
  const [tab, setTab] = useState<WorkTab>(initialTab);
  const [kind, setKind] = useState<WorkFilter>(initialKind);
  const requestsQuery = usePolling('driver-requests', listRegionRequests, keepPolling, POLL_MS);
  const jobsQuery = usePolling('driver-jobs', listDriverJobs, loadOnce);
  const setRequests = requestsQuery.setData;
  const setJobs = jobsQuery.setData;

  const [busy, setBusy] = useState<{ id: string; action: 'accept' | 'reject' } | null>(null);
  const [feedback, setFeedback] = useState<{ message: string; accepted: boolean } | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [jobFilter, setJobFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [rating, setRating] = useState<DriverJob | null>(null);

  const syncUrl = (nextTab: WorkTab, nextKind: WorkFilter) =>
    router.replace(`${PATH}?aba=${nextTab}${nextKind === 'all' ? '' : `&tipo=${COPY[nextKind].param}`}`, { scroll: false });

  const changeTab = (next: WorkTab) => {
    setTab(next);
    syncUrl(next, kind);
  };

  const changeKind = (next: WorkFilter) => {
    setKind(next);
    syncUrl(tab, next);
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

  const ofKind = (item: { kind: WorkKind }) => kind === 'all' || item.kind === kind;
  const requests = requestsQuery.data?.filter(ofKind);
  const jobs = jobsQuery.data?.filter(ofKind);

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
  // Contagem por tipo da aba atual, para os filtros
  const source = tab === 'regiao' ? requestsQuery.data : jobsQuery.data;
  const countOf = (k: WorkKind) => source?.filter((item) => item.kind === k).length ?? 0;
  const noun = kind === 'all' ? { one: 'pedido', many: 'viagens e encomendas' } : { one: COPY[kind].noun, many: COPY[kind].plural };

  return (
    <Stack spacing={2.5}>
      <Stack spacing={0.25}>
        <Typography component="h1" variant="h5" sx={{ fontWeight: 800 }}>
          Pedidos
        </Typography>
        <Typography variant="body2" color="text.secondary" aria-live="polite">
          {tab === 'regiao'
            ? `${requests.length} ${requests.length === 1 ? 'pedido' : 'pedidos'} nas suas viagens${potential > 0 ? ` · até ${formatCurrency(potential)}` : ''}`
            : `${formatCurrency(earned)} em ${noun.many} concluídas`}
        </Typography>
      </Stack>

      <Tabs
        value={tab}
        onChange={(_, value: WorkTab) => changeTab(value)}
        variant="fullWidth"
        aria-label="Pedidos: novos ou já aceitos"
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
        <Tab value="regiao" label={`Pedidos (${requests.length})`} />
        <Tab value="minhas" label={`Minhas (${jobs.length})`} />
      </Tabs>

      <FilterChips
        label="Tipo"
        options={[
          { value: 'all', label: 'Todos' },
          { value: 'ride', label: `Caronas · ${countOf('ride')}` },
          { value: 'delivery', label: `Encomendas · ${countOf('delivery')}` },
        ]}
        value={kind}
        onChange={changeKind}
      />

      {actionError && (
        <Alert severity="warning" onClose={() => setActionError(null)}>
          {actionError}
        </Alert>
      )}

      {tab === 'regiao' ? (
        requests.length === 0 ? (
          <StatusScreen
            icon={Inbox}
            title="Nenhum pedido agora"
            description="Pedidos de vaga e de encomenda nas viagens que você publicou aparecem aqui automaticamente."
          />
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
            emptyTitle={`Você ainda não aceitou nenhum${kind === 'all' ? ' pedido' : `a ${noun.one}`}`}
            filtered={jobFilter !== 'all'}
            onClear={() => setJobFilter('all')}
            renderItem={(job) => (
              <HistoryCard
                icon={COPY[job.kind].icon}
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
                        {COPY[job.kind].customer}
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
          title={`Como foi ${rating.kind === 'ride' ? 'a carona' : 'a entrega'} com ${rating.customerName.split(' ')[0]}?`}
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

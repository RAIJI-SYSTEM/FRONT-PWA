'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';
import Alert from '@mui/material/Alert';
import ButtonBase from '@mui/material/ButtonBase';
import CircularProgress from '@mui/material/CircularProgress';
import Snackbar from '@mui/material/Snackbar';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { listRides } from '@/services/history';
import type { RideHistoryItem, RideHistoryStatus } from '@/types/history';
import { formatCurrency } from '@/utils/formatCurrency';
import { inPeriod, matchesQuery, PERIODS, type Period } from '../filters';
import { useHistory } from '../useHistory';
import HistoryList from './HistoryList';
import HistoryToolbar, { FilterGroup } from './HistoryToolbar';
import RateDriverDialog from './RateDriverDialog';
import RideHistoryCard from './RideHistoryCard';

type StatusFilter = 'all' | 'active' | 'completed' | 'canceled';
type TypeFilter = 'all' | 'shared' | 'solo';
type RatingFilter = 'all' | 'unrated' | 'rated';
type PaymentFilter = 'all' | 'card' | 'pix';

const STATUS_GROUPS: Record<StatusFilter, { label: string; includes: (s: RideHistoryStatus) => boolean }> = {
  all: { label: 'Todas', includes: () => true },
  active: { label: 'Em andamento', includes: (s) => s === 'scheduled' || s === 'in_progress' },
  completed: { label: 'Concluídas', includes: (s) => s === 'completed' },
  canceled: { label: 'Canceladas', includes: (s) => s === 'canceled' },
};

const DEFAULTS = { period: 'all' as Period, type: 'all' as TypeFilter, rating: 'all' as RatingFilter, payment: 'all' as PaymentFilter };

const needsRating = (ride: RideHistoryItem) => ride.status === 'completed' && !ride.rating;

export default function RidesScreen() {
  const { items, error, rating, startRating, cancelRating, onRated, thanks, closeThanks } = useHistory('rides', listRides);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [filters, setFilters] = useState(DEFAULTS);

  if (!items) {
    return error ? (
      <Alert severity="error">{error}</Alert>
    ) : (
      <Stack sx={{ alignItems: 'center', py: 8 }}>
        <CircularProgress />
      </Stack>
    );
  }

  // Tudo, menos o status: assim os chips mostram quantas sobram em cada situação
  const matchesOthers = (ride: RideHistoryItem) =>
    matchesQuery(search, ride.origin, ride.destination, ride.driver.name) &&
    inPeriod(ride.date, filters.period) &&
    (filters.type === 'all' || ride.shared === (filters.type === 'shared')) &&
    (filters.rating === 'all' || (filters.rating === 'unrated' ? needsRating(ride) : Boolean(ride.rating))) &&
    (filters.payment === 'all' || ride.paymentMethod === filters.payment);

  const base = items.filter(matchesOthers);
  const visible = base.filter((ride) => STATUS_GROUPS[status].includes(ride.status));
  const activeFilters = (Object.keys(DEFAULTS) as (keyof typeof DEFAULTS)[]).filter((key) => filters[key] !== DEFAULTS[key]).length;
  const filtered = activeFilters > 0 || status !== 'all' || search.trim() !== '';
  const spent = visible.filter((r) => r.status === 'completed').reduce((total, r) => total + r.priceCents, 0);
  const toRate = items.filter(needsRating).length;

  const clear = () => {
    setSearch('');
    setStatus('all');
    setFilters(DEFAULTS);
  };

  return (
    <Stack spacing={2.5}>
      <Stack spacing={0.25}>
        <Typography component="h1" variant="h5" sx={{ fontWeight: 800 }}>
          Corridas
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {visible.length} corrida{visible.length === 1 ? '' : 's'}
          {spent > 0 && ` · ${formatCurrency(spent)} em corridas concluídas`}
        </Typography>
      </Stack>

      {toRate > 0 && filters.rating !== 'unrated' && (
        <ButtonBase
          onClick={() => {
            setStatus('completed');
            setFilters((f) => ({ ...f, rating: 'unrated' }));
          }}
          sx={{
            justifyContent: 'flex-start',
            gap: 1.5,
            p: 1.5,
            borderRadius: 3,
            textAlign: 'left',
            bgcolor: 'rgba(var(--mui-palette-primary-mainChannel) / 0.1)',
            color: 'text.primary',
          }}
        >
          <Star size={20} style={{ flexShrink: 0 }} color="var(--mui-palette-primary-main)" />
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            Você tem {toRate} corrida{toRate === 1 ? '' : 's'} para avaliar. Ver agora
          </Typography>
        </ButtonBase>
      )}

      <HistoryToolbar
        search={search}
        onSearch={setSearch}
        searchPlaceholder="Buscar endereço ou motorista"
        statusOptions={(Object.keys(STATUS_GROUPS) as StatusFilter[]).map((value) => ({
          value,
          label: STATUS_GROUPS[value].label,
          count: base.filter((ride) => STATUS_GROUPS[value].includes(ride.status)).length,
        }))}
        status={status}
        onStatus={setStatus}
        activeFilters={activeFilters}
        onClear={clear}
        resultCount={visible.length}
      >
        <FilterGroup label="Período" options={PERIODS} value={filters.period} onChange={(period) => setFilters((f) => ({ ...f, period }))} />
        <FilterGroup
          label="Tipo de corrida"
          options={[
            { value: 'all', label: 'Todas' },
            { value: 'solo', label: 'Individuais' },
            { value: 'shared', label: 'Compartilhadas' },
          ]}
          value={filters.type}
          onChange={(type) => setFilters((f) => ({ ...f, type }))}
        />
        <FilterGroup
          label="Avaliação"
          options={[
            { value: 'all', label: 'Todas' },
            { value: 'unrated', label: 'Para avaliar' },
            { value: 'rated', label: 'Já avaliadas' },
          ]}
          value={filters.rating}
          onChange={(value) => setFilters((f) => ({ ...f, rating: value }))}
        />
        <FilterGroup
          label="Pagamento"
          options={[
            { value: 'all', label: 'Todos' },
            { value: 'card', label: 'Cartão' },
            { value: 'pix', label: 'Pix' },
          ]}
          value={filters.payment}
          onChange={(payment) => setFilters((f) => ({ ...f, payment }))}
        />
      </HistoryToolbar>

      <HistoryList
        items={visible}
        emptyTitle="Você ainda não fez nenhuma corrida"
        filtered={filtered}
        onClear={clear}
        renderItem={(ride) => <RideHistoryCard ride={ride} onRate={() => startRating(ride)} />}
      />

      {rating && <RateDriverDialog kind="rides" item={rating} driver={rating.driver} onClose={cancelRating} onRated={onRated} />}
      <Snackbar open={thanks} autoHideDuration={3500} onClose={closeThanks} message="Obrigado pela avaliação!" anchorOrigin={{ vertical: 'top', horizontal: 'center' }} />
    </Stack>
  );
}

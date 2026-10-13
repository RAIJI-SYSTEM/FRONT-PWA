'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';
import Alert from '@mui/material/Alert';
import ButtonBase from '@mui/material/ButtonBase';
import CircularProgress from '@mui/material/CircularProgress';
import Snackbar from '@mui/material/Snackbar';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { PACKAGE_SIZES } from '@/features/delivery/packageSizes';
import { listDeliveries } from '@/services/history';
import type { PackageSize } from '@/types/delivery';
import type { DeliveryHistoryItem, DeliveryHistoryStatus } from '@/types/history';
import { formatCurrency } from '@/utils/formatCurrency';
import { inPeriod, matchesQuery, PERIODS, type Period } from '../filters';
import { useHistory } from '../useHistory';
import DeliveryHistoryCard from './DeliveryHistoryCard';
import HistoryList from './HistoryList';
import HistoryToolbar, { FilterGroup } from './HistoryToolbar';
import RateDriverDialog from './RateDriverDialog';

type StatusFilter = 'all' | 'active' | 'delivered' | 'canceled';
type RatingFilter = 'all' | 'unrated' | 'rated';

const STATUS_GROUPS: Record<StatusFilter, { label: string; includes: (s: DeliveryHistoryStatus) => boolean }> = {
  all: { label: 'Todas', includes: () => true },
  active: { label: 'A caminho', includes: (s) => s === 'awaiting_pickup' || s === 'in_transit' },
  delivered: { label: 'Entregues', includes: (s) => s === 'delivered' },
  canceled: { label: 'Canceladas', includes: (s) => s === 'canceled' },
};

const DEFAULTS = { period: 'all' as Period, size: 'all' as 'all' | PackageSize, rating: 'all' as RatingFilter };

const needsRating = (delivery: DeliveryHistoryItem) => delivery.status === 'delivered' && !delivery.rating;

export default function DeliveriesScreen() {
  const { items, error, rating, startRating, cancelRating, onRated, thanks, closeThanks } = useHistory('deliveries', listDeliveries);
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

  const matchesOthers = (d: DeliveryHistoryItem) =>
    matchesQuery(search, d.code, d.description, d.recipientName, d.origin, d.destination, d.driver.name) &&
    inPeriod(d.date, filters.period) &&
    (filters.size === 'all' || d.size === filters.size) &&
    (filters.rating === 'all' || (filters.rating === 'unrated' ? needsRating(d) : Boolean(d.rating)));

  const base = items.filter(matchesOthers);
  const visible = base.filter((d) => STATUS_GROUPS[status].includes(d.status));
  const activeFilters = (Object.keys(DEFAULTS) as (keyof typeof DEFAULTS)[]).filter((key) => filters[key] !== DEFAULTS[key]).length;
  const filtered = activeFilters > 0 || status !== 'all' || search.trim() !== '';
  const spent = visible.filter((d) => d.status === 'delivered').reduce((total, d) => total + d.priceCents, 0);
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
          Encomendas
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {visible.length} encomenda{visible.length === 1 ? '' : 's'}
          {spent > 0 && ` · ${formatCurrency(spent)} em entregas concluídas`}
        </Typography>
      </Stack>

      {toRate > 0 && filters.rating !== 'unrated' && (
        <ButtonBase
          onClick={() => {
            setStatus('delivered');
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
            Você tem {toRate} entrega{toRate === 1 ? '' : 's'} para avaliar. Ver agora
          </Typography>
        </ButtonBase>
      )}

      <HistoryToolbar
        search={search}
        onSearch={setSearch}
        searchPlaceholder="Buscar código, conteúdo ou destinatário"
        statusOptions={(Object.keys(STATUS_GROUPS) as StatusFilter[]).map((value) => ({
          value,
          label: STATUS_GROUPS[value].label,
          count: base.filter((d) => STATUS_GROUPS[value].includes(d.status)).length,
        }))}
        status={status}
        onStatus={setStatus}
        activeFilters={activeFilters}
        onClear={clear}
        resultCount={visible.length}
      >
        <FilterGroup label="Período" options={PERIODS} value={filters.period} onChange={(period) => setFilters((f) => ({ ...f, period }))} />
        <FilterGroup
          label="Tamanho do pacote"
          options={[{ value: 'all' as const, label: 'Todos' }, ...PACKAGE_SIZES.map((s) => ({ value: s.value, label: s.label }))]}
          value={filters.size}
          onChange={(size) => setFilters((f) => ({ ...f, size }))}
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
      </HistoryToolbar>

      <HistoryList
        items={visible}
        emptyTitle="Você ainda não enviou nenhuma encomenda"
        filtered={filtered}
        onClear={clear}
        renderItem={(delivery) => <DeliveryHistoryCard delivery={delivery} onRate={() => startRating(delivery)} />}
      />

      {rating && (
        <RateDriverDialog kind="deliveries" item={rating} driver={rating.driver} onClose={cancelRating} onRated={onRated} />
      )}
      <Snackbar open={thanks} autoHideDuration={3500} onClose={closeThanks} message="Obrigado pela avaliação!" anchorOrigin={{ vertical: 'top', horizontal: 'center' }} />
    </Stack>
  );
}

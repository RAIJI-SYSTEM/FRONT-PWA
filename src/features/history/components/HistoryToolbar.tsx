'use client';

import { useEffect, useState, type ReactNode } from 'react';
import dynamic from 'next/dynamic';
import { Search, SlidersHorizontal } from 'lucide-react';
import Badge from '@mui/material/Badge';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { preloadWhenIdle } from '@/utils/preload';

const loadFilterDrawer = () => import('./FilterDrawer');
const FilterDrawer = dynamic(loadFilterDrawer);

export interface StatusOption<S extends string> {
  value: S;
  label: string;
  count: number;
}

interface HistoryToolbarProps<S extends string> {
  search: string;
  onSearch: (value: string) => void;
  searchPlaceholder: string;
  statusOptions: StatusOption<S>[];
  status: S;
  onStatus: (value: S) => void;
  /** Quantos filtros avançados estão ativos (mostra no botão "Filtros") */
  activeFilters: number;
  onClear: () => void;
  resultCount: number;
  /** Filtros avançados, exibidos na gaveta */
  children: ReactNode;
}

/** Busca + status em chips (rápidos) + gaveta com filtros avançados */
export default function HistoryToolbar<S extends string>({
  search,
  onSearch,
  searchPlaceholder,
  statusOptions,
  status,
  onStatus,
  activeFilters,
  onClear,
  resultCount,
  children,
}: HistoryToolbarProps<S>) {
  const [open, setOpen] = useState(false);
  // Depois de aberta uma vez, a gaveta continua montada (para a animação de fechar funcionar)
  const [everOpened, setEverOpened] = useState(false);

  useEffect(() => preloadWhenIdle(loadFilterDrawer), []);

  const openFilters = () => {
    setEverOpened(true);
    setOpen(true);
  };

  return (
    <Stack
      spacing={1.5}
      sx={(theme) => ({
        // Fica preso logo abaixo do cabeçalho ao rolar a lista
        position: 'sticky',
        top: 'var(--app-header-height, 0px)',
        zIndex: theme.zIndex.appBar - 1,
        // Ocupa a largura toda (cobre o espaçamento lateral do container) para a lista passar por baixo
        mx: { xs: -2, sm: -3 },
        px: { xs: 2, sm: 3 },
        pt: 1,
        pb: 1.25,
        bgcolor: 'rgba(var(--mui-palette-background-defaultChannel) / 0.9)',
        backdropFilter: 'blur(12px)',
      })}
    >
      <Stack direction="row" spacing={1}>
        <TextField
          fullWidth
          size="small"
          type="search"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder={searchPlaceholder}
          slotProps={{
            htmlInput: { 'aria-label': searchPlaceholder },
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Search size={18} />
                </InputAdornment>
              ),
            },
          }}
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 999 } }}
        />
        <IconButton
          onClick={openFilters}
          aria-label={activeFilters > 0 ? `Filtros (${activeFilters} ativos)` : 'Filtros'}
          sx={{ flexShrink: 0, border: 1, borderColor: activeFilters > 0 ? 'primary.main' : 'divider', bgcolor: 'background.paper' }}
        >
          <Badge badgeContent={activeFilters} color="primary">
            <SlidersHorizontal size={20} />
          </Badge>
        </IconButton>
      </Stack>

      {/* Status: um toque, sem abrir nada */}
      <Stack
        direction="row"
        spacing={1}
        role="radiogroup"
        aria-label="Filtrar por situação"
        sx={{ overflowX: 'auto', pb: 0.5, scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' } }}
      >
        {statusOptions.map((option) => {
          const selected = option.value === status;
          return (
            <Chip
              key={option.value}
              role="radio"
              aria-checked={selected}
              label={`${option.label} · ${option.count}`}
              onClick={() => onStatus(option.value)}
              color={selected ? 'primary' : 'default'}
              variant={selected ? 'filled' : 'outlined'}
              sx={{ flexShrink: 0, fontWeight: 600 }}
            />
          );
        })}
      </Stack>

      {/* A gaveta só é baixada na primeira vez que o usuário abre os filtros (ou quando o app fica ocioso) */}
      {everOpened && (
        <FilterDrawer open={open} onClose={() => setOpen(false)} onClear={onClear} resultCount={resultCount}>
          {children}
        </FilterDrawer>
      )}
    </Stack>
  );
}

/** Grupo de opções dentro da gaveta de filtros */
export function FilterGroup<V extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: V; label: string }[];
  value: V;
  onChange: (value: V) => void;
}) {
  return (
    <Box role="radiogroup" aria-label={label}>
      <Typography variant="body2" sx={{ fontWeight: 700, mb: 1 }}>
        {label}
      </Typography>
      <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1 }}>
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <Chip
              key={option.value}
              role="radio"
              aria-checked={selected}
              label={option.label}
              onClick={() => onChange(option.value)}
              color={selected ? 'primary' : 'default'}
              variant={selected ? 'filled' : 'outlined'}
              sx={{ fontWeight: 600 }}
            />
          );
        })}
      </Stack>
    </Box>
  );
}

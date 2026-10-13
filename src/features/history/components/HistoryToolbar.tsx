'use client';

import { useState, type ReactNode } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import Badge from '@mui/material/Badge';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

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
          onClick={() => setOpen(true)}
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

      <Drawer
        anchor="bottom"
        open={open}
        onClose={() => setOpen(false)}
        slotProps={{ paper: { sx: { borderRadius: '24px 24px 0 0', maxWidth: 600, mx: 'auto' } } }}
      >
        <Box sx={{ p: 2.5, pb: 'calc(20px + env(safe-area-inset-bottom))' }} role="dialog" aria-labelledby="filters-title">
          <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography id="filters-title" variant="h6" sx={{ fontWeight: 700 }}>
              Filtros
            </Typography>
            <IconButton onClick={() => setOpen(false)} aria-label="Fechar filtros">
              <X size={20} />
            </IconButton>
          </Stack>
          <Stack spacing={2.5}>{children}</Stack>
          <Stack direction="row" spacing={1.5} sx={{ mt: 3 }}>
            <Button
              fullWidth
              variant="outlined"
              color="inherit"
              onClick={onClear}
              sx={{ height: 48, borderRadius: 999, textTransform: 'none', fontWeight: 600, borderColor: 'divider' }}
            >
              Limpar
            </Button>
            <Button
              fullWidth
              variant="contained"
              onClick={() => setOpen(false)}
              sx={{ height: 48, borderRadius: 999, textTransform: 'none', fontWeight: 600 }}
            >
              Ver {resultCount} resultado{resultCount === 1 ? '' : 's'}
            </Button>
          </Stack>
        </Box>
      </Drawer>
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

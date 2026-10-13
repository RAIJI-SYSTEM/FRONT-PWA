'use client';

import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

interface FilterDrawerProps {
  open: boolean;
  onClose: () => void;
  onClear: () => void;
  resultCount: number;
  children: ReactNode;
}

/** Gaveta de filtros avançados (carregada sob demanda pelo HistoryToolbar) */
export default function FilterDrawer({ open, onClose, onClear, resultCount, children }: FilterDrawerProps) {
  return (
    <Drawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      slotProps={{ paper: { sx: { borderRadius: '24px 24px 0 0', maxWidth: 600, mx: 'auto' } } }}
    >
      <Box sx={{ p: 2.5, pb: 'calc(20px + env(safe-area-inset-bottom))' }} role="dialog" aria-labelledby="filters-title">
        <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography id="filters-title" variant="h6" sx={{ fontWeight: 700 }}>
            Filtros
          </Typography>
          <IconButton onClick={onClose} aria-label="Fechar filtros">
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
            onClick={onClose}
            sx={{ height: 48, borderRadius: 999, textTransform: 'none', fontWeight: 600 }}
          >
            Ver {resultCount} resultado{resultCount === 1 ? '' : 's'}
          </Button>
        </Stack>
      </Box>
    </Drawer>
  );
}

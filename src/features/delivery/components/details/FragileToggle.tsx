'use client';

import { Wine } from 'lucide-react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Typography from '@mui/material/Typography';

interface FragileToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

/** "Item frágil": vidro, eletrônicos, cerâmica... (o motorista manuseia com mais cuidado) */
export default function FragileToggle({ checked, onChange }: FragileToggleProps) {
  return (
    // A linha inteira é clicável (label), não só a chavinha
    <Stack
      component="label"
      direction="row"
      spacing={1.5}
      sx={{
        alignItems: 'center',
        p: 1.5,
        borderRadius: 3,
        border: 1,
        borderColor: checked ? 'primary.main' : 'divider',
        bgcolor: checked ? 'rgba(var(--mui-palette-primary-mainChannel) / 0.08)' : 'transparent',
        cursor: 'pointer',
        transition: 'border-color 150ms, background-color 150ms',
      }}
    >
      <Box
        sx={{
          width: 40,
          height: 40,
          flexShrink: 0,
          borderRadius: 2,
          display: 'grid',
          placeItems: 'center',
          color: checked ? 'primary.contrastText' : 'primary.main',
          bgcolor: checked ? 'primary.main' : 'rgba(var(--mui-palette-primary-mainChannel) / 0.12)',
        }}
      >
        <Wine size={20} />
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontWeight: 700 }}>Item frágil</Typography>
        <Typography variant="body2" color="text.secondary">
          Vidro, eletrônicos ou cerâmica: o motorista vai manusear com mais cuidado.
        </Typography>
      </Box>
      <Switch checked={checked} onChange={(e) => onChange(e.target.checked)} slotProps={{ input: { 'aria-label': 'Item frágil' } }} />
    </Stack>
  );
}

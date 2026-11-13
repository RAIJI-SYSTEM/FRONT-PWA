'use client';

import { Minus, Plus, Trash2 } from 'lucide-react';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import type { BaggageItemApi } from '@/services/backend/types';
import { BAGGAGE_TYPES, baggageLabel, newBaggageItem } from './baggageTypes';

interface BaggageEditorProps {
  items: BaggageItemApi[];
  onChange: (items: BaggageItemApi[]) => void;
}

/** Lista de volumes que a pessoa vai levar: tipo, quantidade e (opcional) medidas/peso */
export default function BaggageEditor({ items, onChange }: BaggageEditorProps) {
  const update = (index: number, changes: Partial<BaggageItemApi>) =>
    onChange(items.map((item, i) => (i === index ? { ...item, ...changes } : item)));
  const remove = (index: number) => onChange(items.filter((_, i) => i !== index));

  const number = (value: string) => {
    const n = Number(value.replace(',', '.'));
    return Number.isFinite(n) && n > 0 ? n : undefined;
  };

  return (
    <Stack spacing={1.5}>
      {items.map((item, index) => (
        <Paper key={index} variant="outlined" sx={{ p: 1.5, borderRadius: 3 }}>
          <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography sx={{ fontWeight: 700 }}>{baggageLabel(item.type)}</Typography>
            <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
              <IconButton
                size="small"
                aria-label="Menos um"
                onClick={() => (item.quantity <= 1 ? remove(index) : update(index, { quantity: item.quantity - 1 }))}
              >
                <Minus size={16} />
              </IconButton>
              <Typography sx={{ fontWeight: 800, minWidth: 20, textAlign: 'center' }} aria-live="polite">
                {item.quantity}
              </Typography>
              <IconButton size="small" aria-label="Mais um" onClick={() => update(index, { quantity: Math.min(9, item.quantity + 1) })}>
                <Plus size={16} />
              </IconButton>
              <IconButton size="small" aria-label={`Remover ${baggageLabel(item.type)}`} onClick={() => remove(index)}>
                <Trash2 size={16} />
              </IconButton>
            </Stack>
          </Stack>
          <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
            {(['lengthCm', 'widthCm', 'heightCm'] as const).map((field, i) => (
              <TextField
                key={field}
                size="small"
                label={['Compr.', 'Largura', 'Altura'][i]}
                value={item[field]}
                onChange={(e) => update(index, { [field]: number(e.target.value) ?? item[field] })}
                slotProps={{ htmlInput: { inputMode: 'numeric' }, input: { endAdornment: <InputAdornment position="end">cm</InputAdornment> } }}
              />
            ))}
            <TextField
              size="small"
              label="Peso"
              value={item.weightKg ?? ''}
              onChange={(e) => update(index, { weightKg: number(e.target.value) ?? null })}
              slotProps={{ htmlInput: { inputMode: 'decimal' }, input: { endAdornment: <InputAdornment position="end">kg</InputAdornment> } }}
            />
          </Stack>
        </Paper>
      ))}

      <Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Adicionar volume
        </Typography>
        <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1 }}>
          {BAGGAGE_TYPES.map(({ value, label, icon: Icon }) => (
            <Chip key={value} icon={<Icon size={16} />} label={label} variant="outlined" onClick={() => onChange([...items, newBaggageItem(value)])} />
          ))}
        </Stack>
      </Box>
    </Stack>
  );
}

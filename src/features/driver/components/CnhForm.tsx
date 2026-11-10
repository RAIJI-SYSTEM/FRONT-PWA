'use client';

import { IdCard } from 'lucide-react';
import Box from '@mui/material/Box';
import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormHelperText from '@mui/material/FormHelperText';
import InputAdornment from '@mui/material/InputAdornment';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { CNH_CATEGORIES, type CnhCategory } from '@/types/driverMode';
import type { Attachment } from '@/types/message';
import PhotoUploadField from './PhotoUploadField';

export interface CnhDraft {
  number: string;
  category: CnhCategory | null;
  expiresAt: string;
  ear: boolean;
  frontPhoto?: Attachment;
  backPhoto?: Attachment;
}

export const EMPTY_CNH: CnhDraft = { number: '', category: null, expiresAt: '', ear: false };

interface CnhFormProps {
  value: CnhDraft;
  onChange: (changes: Partial<CnhDraft>) => void;
  errors: Partial<Record<keyof CnhDraft, string>>;
}

/** Dados da CNH: número, categoria, validade, observação EAR e fotos (frente e verso) */
export default function CnhForm({ value, onChange, errors }: CnhFormProps) {
  return (
    <Stack spacing={2.5}>
      <TextField
        label="Número de registro da CNH"
        value={value.number}
        onChange={(e) => onChange({ number: e.target.value.replace(/\D/g, '').slice(0, 11) })}
        error={Boolean(errors.number)}
        helperText={errors.number ?? 'Os 11 números que ficam no campo "Nº registro".'}
        autoComplete="off"
        slotProps={{
          htmlInput: { inputMode: 'numeric' },
          input: { startAdornment: <InputAdornment position="start"><IdCard size={18} /></InputAdornment> },
        }}
      />

      <Box role="radiogroup" aria-label="Categoria da CNH">
        <Typography variant="body2" sx={{ fontWeight: 700, mb: 1 }}>
          Categoria
        </Typography>
        <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1 }}>
          {CNH_CATEGORIES.map((category) => {
            const selected = value.category === category;
            return (
              <Chip
                key={category}
                role="radio"
                aria-checked={selected}
                label={category}
                onClick={() => onChange({ category })}
                color={selected ? 'primary' : 'default'}
                variant={selected ? 'filled' : 'outlined'}
                sx={{ fontWeight: 700, minWidth: 52 }}
              />
            );
          })}
        </Stack>
        {errors.category && <FormHelperText error>{errors.category}</FormHelperText>}
      </Box>

      <TextField
        type="date"
        label="Validade"
        value={value.expiresAt}
        onChange={(e) => onChange({ expiresAt: e.target.value })}
        error={Boolean(errors.expiresAt)}
        helperText={errors.expiresAt}
        slotProps={{ inputLabel: { shrink: true } }}
      />

      <Box>
        <FormControlLabel
          control={<Checkbox checked={value.ear} onChange={(e) => onChange({ ear: e.target.checked })} />}
          label={
            <Box>
              <Typography sx={{ fontWeight: 600 }}>Minha CNH tem a observação EAR</Typography>
              <Typography variant="body2" color="text.secondary">
                &quot;Exerce Atividade Remunerada&quot; — obrigatória por lei para dirigir por aplicativo.
              </Typography>
            </Box>
          }
          sx={{ alignItems: 'flex-start', m: 0, '& .MuiCheckbox-root': { mt: -0.75 } }}
        />
        {errors.ear && <FormHelperText error>{errors.ear}</FormHelperText>}
      </Box>

      <Box>
        <Typography variant="body2" sx={{ fontWeight: 700, mb: 1 }}>
          Fotos da CNH
        </Typography>
        <Stack direction="row" spacing={1.5}>
          <PhotoUploadField label="Frente" value={value.frontPhoto} onChange={(frontPhoto) => onChange({ frontPhoto })} error={errors.frontPhoto} />
          <PhotoUploadField label="Verso" value={value.backPhoto} onChange={(backPhoto) => onChange({ backPhoto })} error={errors.backPhoto} />
        </Stack>
        <FormHelperText>Fotos nítidas, sem reflexo. Usadas só para conferir seus dados.</FormHelperText>
      </Box>
    </Stack>
  );
}

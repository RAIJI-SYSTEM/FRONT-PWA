'use client';

import InputAdornment from '@mui/material/InputAdornment';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import PackageSizePicker from '../PackageSizePicker';
import type { DetailsErrors, DetailsForm } from './form';

interface StepProps {
  form: DetailsForm;
  errors: DetailsErrors;
  update: (changes: Partial<DetailsForm>) => void;
}

export default function PackageStep({ form, errors, update }: StepProps) {
  return (
    <Stack spacing={2.5}>
      <PackageSizePicker value={form.size} onChange={(size) => update({ size })} error={errors.size} />
      <TextField
        label="Descrição do conteúdo"
        placeholder="Ex.: livros, roupas, documentos"
        value={form.description}
        onChange={(e) => update({ description: e.target.value })}
        error={Boolean(errors.description)}
        helperText={errors.description}
        slotProps={{ htmlInput: { maxLength: 120 } }}
      />
      <TextField
        label="Valor declarado (opcional)"
        value={form.declaredValue}
        onChange={(e) => update({ declaredValue: e.target.value.replace(/[^\d.,]/g, '') })}
        error={Boolean(errors.declaredValue)}
        helperText={errors.declaredValue ?? 'Usado em caso de extravio ou dano.'}
        slotProps={{
          htmlInput: { inputMode: 'decimal' },
          input: { startAdornment: <InputAdornment position="start">R$</InputAdornment> },
        }}
      />
    </Stack>
  );
}

export type { StepProps };

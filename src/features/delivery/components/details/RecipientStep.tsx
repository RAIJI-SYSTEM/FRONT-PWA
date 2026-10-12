'use client';

import { Phone, User } from 'lucide-react';
import InputAdornment from '@mui/material/InputAdornment';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import { formatPhone } from '@/utils/phone';
import type { StepProps } from './PackageStep';

export default function RecipientStep({ form, errors, update }: StepProps) {
  return (
    <Stack spacing={2.5}>
      <TextField
        label="Nome do destinatário"
        autoComplete="off"
        value={form.recipientName}
        onChange={(e) => update({ recipientName: e.target.value })}
        error={Boolean(errors.recipientName)}
        helperText={errors.recipientName}
        slotProps={{ input: { startAdornment: <InputAdornment position="start"><User size={18} /></InputAdornment> } }}
      />
      <TextField
        label="Telefone do destinatário"
        type="tel"
        autoComplete="off"
        value={form.recipientPhone}
        onChange={(e) => update({ recipientPhone: formatPhone(e.target.value) })}
        error={Boolean(errors.recipientPhone)}
        helperText={errors.recipientPhone ?? 'Enviamos por aqui a palavra-chave e os avisos da entrega.'}
        slotProps={{
          htmlInput: { inputMode: 'tel' },
          input: { startAdornment: <InputAdornment position="start"><Phone size={18} /></InputAdornment> },
        }}
      />
      <TextField
        label="Observações para o motorista (opcional)"
        placeholder="Ex.: interfone 12, deixar na portaria"
        multiline
        minRows={3}
        value={form.notes}
        onChange={(e) => update({ notes: e.target.value })}
        slotProps={{ htmlInput: { maxLength: 200 } }}
      />
    </Stack>
  );
}

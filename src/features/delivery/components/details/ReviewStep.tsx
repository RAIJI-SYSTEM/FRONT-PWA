'use client';

import type { ReactNode } from 'react';
import { Pencil } from 'lucide-react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate, formatTime } from '@/utils/formatDate';
import { PACKAGE_SIZES } from '../../packageSizes';
import { parseMoney, type DetailsForm, type StepKey } from './form';

interface ReviewStepProps {
  form: DetailsForm;
  onEdit: (step: StepKey) => void;
}

function ReviewItem({ title, onEdit, children }: { title: string; onEdit: () => void; children: ReactNode }) {
  return (
    <Stack direction="row" spacing={2} sx={{ alignItems: 'flex-start', py: 1.5 }}>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="caption" color="text.secondary">
          {title}
        </Typography>
        {children}
      </Box>
      <Button
        size="small"
        onClick={onEdit}
        startIcon={<Pencil size={14} />}
        aria-label={`Editar ${title.toLowerCase()}`}
        sx={{ textTransform: 'none', fontWeight: 600, flexShrink: 0 }}
      >
        Editar
      </Button>
    </Stack>
  );
}

/** Resumo de tudo o que foi preenchido, com atalho para editar cada etapa */
export default function ReviewStep({ form, onEdit }: ReviewStepProps) {
  const size = PACKAGE_SIZES.find((s) => s.value === form.size);
  const declared = parseMoney(form.declaredValue);
  const when =
    form.mode === 'now'
      ? 'Agora, assim que um motorista aceitar'
      : `${formatDate(form.scheduledAt)} às ${formatTime(form.scheduledAt)}`;

  return (
    <Paper variant="outlined" sx={{ px: 2.5, py: 1, borderRadius: 3 }}>
      <ReviewItem title="Pacote" onEdit={() => onEdit('package')}>
        <Typography sx={{ fontWeight: 700 }}>
          {size?.label} · {form.description}
          {form.fragile && ' · Frágil'}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {size?.hint}
          {declared ? ` · valor declarado ${formatCurrency(declared)}` : ''}
        </Typography>
      </ReviewItem>
      <Divider />
      <ReviewItem title="Destinatário" onEdit={() => onEdit('recipient')}>
        <Typography sx={{ fontWeight: 700 }}>{form.recipientName}</Typography>
        <Typography variant="body2" color="text.secondary">
          {form.recipientPhone}
        </Typography>
        {form.notes && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontStyle: 'italic' }}>
            “{form.notes}”
          </Typography>
        )}
      </ReviewItem>
      <Divider />
      <ReviewItem title="Quando" onEdit={() => onEdit('schedule')}>
        <Typography sx={{ fontWeight: 700 }}>{when}</Typography>
      </ReviewItem>
    </Paper>
  );
}

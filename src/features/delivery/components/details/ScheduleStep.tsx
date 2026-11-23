'use client';

import DepartureSelector from '@/features/ride/components/DepartureSelector';
import type { StepProps } from './PackageStep';

export default function ScheduleStep({ form, errors, update }: StepProps) {
  return (
    <DepartureSelector
      mode={form.mode}
      onModeChange={(mode) => update({ mode })}
      scheduledAt={form.scheduledAt}
      onScheduledAtChange={(scheduledAt) => update({ scheduledAt })}
      error={errors.scheduledAt}
      dateLabel="Data e horário da coleta"
      scheduledHint="Se já houver carona nesse caminho, mostramos. Senão, o pedido vai para o mural e os motoristas da região mandam um valor."
    />
  );
}

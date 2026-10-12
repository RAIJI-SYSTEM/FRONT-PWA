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
      scheduledHint="Sua entrega fica no mural da região até um motorista aceitar."
    />
  );
}

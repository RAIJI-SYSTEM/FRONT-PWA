import type { DepartureMode } from '@/features/ride/components/DepartureSelector';
import type { PackageSize } from '@/types/delivery';

/** Estado do questionário de dados do pacote, compartilhado entre as etapas */
export interface DetailsForm {
  size: PackageSize | null;
  description: string;
  declaredValue: string;
  recipientName: string;
  recipientPhone: string;
  notes: string;
  mode: DepartureMode;
  scheduledAt: string;
}

export type DetailsField = keyof DetailsForm;
export type DetailsErrors = Partial<Record<DetailsField, string>>;

export const EMPTY_FORM: DetailsForm = {
  size: null,
  description: '',
  declaredValue: '',
  recipientName: '',
  recipientPhone: '',
  notes: '',
  mode: 'now',
  scheduledAt: '',
};

export const STEPS = [
  { key: 'package', label: 'Pacote', title: 'O que você vai enviar?' },
  { key: 'recipient', label: 'Destinatário', title: 'Quem vai receber?' },
  { key: 'schedule', label: 'Quando', title: 'Quando devemos coletar?' },
  { key: 'review', label: 'Revisão', title: 'Confira antes de enviar' },
] as const;

export type StepKey = (typeof STEPS)[number]['key'];

const MIN_SCHEDULE_MINUTES = 30;

/** "12,50" → 1250 centavos; vazio → undefined; inválido → NaN */
export function parseMoney(value: string) {
  if (!value.trim()) return undefined;
  const number = Number(value.replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(number) && number >= 0 ? Math.round(number * 100) : NaN;
}

/** Valida só os campos da etapa atual, para o usuário corrigir antes de avançar */
export function validateStep(step: StepKey, form: DetailsForm): DetailsErrors {
  const errors: DetailsErrors = {};
  if (step === 'package') {
    if (!form.size) errors.size = 'Escolha o tamanho do pacote.';
    if (!form.description.trim()) errors.description = 'Conte o que você está enviando.';
    if (Number.isNaN(parseMoney(form.declaredValue))) errors.declaredValue = 'Valor inválido.';
  }
  if (step === 'recipient') {
    if (!form.recipientName.trim()) errors.recipientName = 'Informe quem vai receber.';
    if (form.recipientPhone.replace(/\D/g, '').length < 10) errors.recipientPhone = 'Telefone inválido.';
  }
  if (step === 'schedule' && form.mode === 'scheduled') {
    const time = Date.parse(form.scheduledAt);
    if (Number.isNaN(time)) errors.scheduledAt = 'Escolha a data e o horário.';
    else if (time < Date.now() + MIN_SCHEDULE_MINUTES * 60_000)
      errors.scheduledAt = `Agende com pelo menos ${MIN_SCHEDULE_MINUTES} minutos de antecedência.`;
  }
  return errors;
}

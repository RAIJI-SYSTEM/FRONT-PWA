/** Formata enquanto digita: (11) 91234-5678 ou (11) 1234-5678 */
export function formatPhone(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return digits.length ? `(${digits}` : '';
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

/** (11) 91234-5678 → +5511912345678 (formato E.164, exigido pelo backend). null se incompleto. */
export function toE164(value: string) {
  const digits = value.replace(/\D/g, '');
  return digits.length === 10 || digits.length === 11 ? `+55${digits}` : null;
}

/** +5511912345678 → (11) 91234-5678 */
export const fromE164 = (value: string | null | undefined) => formatPhone((value ?? '').replace(/^\+55/, ''));

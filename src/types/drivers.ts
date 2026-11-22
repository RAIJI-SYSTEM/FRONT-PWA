/** "48213759" → "4821-3759" (mais fácil de ler e ditar) */
export const formatDriverCode = (code: string) => (code.length === 8 ? `${code.slice(0, 4)}-${code.slice(4)}` : code);

/** O código do motorista tem 8 dígitos (gerado pelo backend a partir da conta) */
export const DRIVER_CODE_LENGTH = 8;

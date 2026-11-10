import { CNH_CATEGORIES, type Cnh, type Vehicle } from '@/types/driverMode';

/** Placa antiga (ABC1234) ou Mercosul (ABC1D23): só letras e números, sem hífen */
export const normalizePlate = (plate: string) => plate.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 7);
export const isValidPlate = (plate: string) => /^[A-Z]{3}\d[A-Z0-9]\d{2}$/.test(normalizePlate(plate));
/** "ABC1D23" → "ABC-1D23" (mais fácil de ler) */
export const formatPlate = (plate: string) => {
  const p = normalizePlate(plate);
  return p.length === 7 ? `${p.slice(0, 3)}-${p.slice(3)}` : p;
};

export const VEHICLE_TYPES: { value: Vehicle['type']; label: string; maxSeats: number }[] = [
  { value: 'car', label: 'Carro', maxSeats: 6 },
  { value: 'van', label: 'Van', maxSeats: 15 },
  { value: 'motorcycle', label: 'Moto', maxSeats: 1 },
];

export const MIN_VEHICLE_YEAR = 2008;

/** Remove os erros dos campos que acabaram de mudar (o erro some assim que a pessoa corrige) */
export const clearFieldErrors = <E extends Record<string, string | undefined>>(errors: E, changes: object): E => {
  const next = { ...errors };
  for (const key of Object.keys(changes)) delete next[key];
  return next;
};

/** Erros de validação por campo (vazio = válido). Usado na tela e no servidor. */
export function validateCnh(cnh: Partial<Cnh>, today = new Date()): Partial<Record<keyof Cnh, string>> {
  const errors: Partial<Record<keyof Cnh, string>> = {};
  const digits = (cnh.number ?? '').replace(/\D/g, '');
  // Formato: 11 dígitos e não uma sequência repetida. O dígito verificador oficial deve ser
  // conferido no backend real (e a CNH, na base do Detran/Senatran).
  if (digits.length !== 11 || /^(\d)\1{10}$/.test(digits)) errors.number = 'O número da CNH tem 11 dígitos.';
  if (!cnh.category || !CNH_CATEGORIES.includes(cnh.category)) errors.category = 'Escolha a categoria.';
  if (!cnh.expiresAt || Number.isNaN(Date.parse(cnh.expiresAt))) errors.expiresAt = 'Informe a validade.';
  else if (new Date(`${cnh.expiresAt}T23:59:59`) < today) errors.expiresAt = 'Esta CNH está vencida.';
  if (!cnh.ear) errors.ear = 'Para dirigir por aplicativo, a CNH precisa ter a observação EAR.';
  return errors;
}

export function validateVehicle(vehicle: Partial<Vehicle>, currentYear = new Date().getFullYear()): Partial<Record<keyof Vehicle, string>> {
  const errors: Partial<Record<keyof Vehicle, string>> = {};
  const type = VEHICLE_TYPES.find((t) => t.value === vehicle.type);
  if (!type) errors.type = 'Escolha o tipo de veículo.';
  if (!vehicle.model?.trim()) errors.model = 'Informe marca e modelo.';
  if (!vehicle.year || vehicle.year < MIN_VEHICLE_YEAR || vehicle.year > currentYear + 1)
    errors.year = `Aceitamos veículos a partir de ${MIN_VEHICLE_YEAR}.`;
  if (!vehicle.color?.trim()) errors.color = 'Informe a cor.';
  if (!vehicle.plate || !isValidPlate(vehicle.plate)) errors.plate = 'Placa inválida (ex.: ABC1D23).';
  if (type && (!vehicle.seats || vehicle.seats < 1 || vehicle.seats > type.maxSeats))
    errors.seats = `De 1 a ${type.maxSeats} lugar${type.maxSeats === 1 ? '' : 'es'} para ${type.label.toLowerCase()}.`;
  return errors;
}

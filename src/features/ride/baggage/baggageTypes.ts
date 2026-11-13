import { Backpack, Box as BoxIcon, Briefcase, ShoppingBag, type LucideIcon } from 'lucide-react';
import type { BaggageItemApi } from '@/services/backend/types';

/** Tipos de volume com medidas e peso típicos (a pessoa ajusta se quiser) */
export const BAGGAGE_TYPES: {
  value: BaggageItemApi['type'];
  label: string;
  icon: LucideIcon;
  defaults: { lengthCm: number; widthCm: number; heightCm: number; weightKg: number };
}[] = [
  { value: 'mochila', label: 'Mochila', icon: Backpack, defaults: { lengthCm: 45, widthCm: 30, heightCm: 20, weightKg: 5 } },
  { value: 'sacola', label: 'Sacola', icon: ShoppingBag, defaults: { lengthCm: 40, widthCm: 30, heightCm: 30, weightKg: 4 } },
  { value: 'mala', label: 'Mala', icon: Briefcase, defaults: { lengthCm: 70, widthCm: 45, heightCm: 30, weightKg: 15 } },
  { value: 'caixa', label: 'Caixa', icon: BoxIcon, defaults: { lengthCm: 50, widthCm: 40, heightCm: 40, weightKg: 10 } },
];

export const baggageLabel = (type: BaggageItemApi['type']) => BAGGAGE_TYPES.find((t) => t.value === type)?.label ?? type;

export function newBaggageItem(type: BaggageItemApi['type']): BaggageItemApi {
  const preset = BAGGAGE_TYPES.find((t) => t.value === type)!;
  return { type, quantity: 1, ...preset.defaults };
}

export function describeBaggage(items: BaggageItemApi[]) {
  if (items.length === 0) return 'Sem bagagem';
  return items.map((i) => `${i.quantity}× ${baggageLabel(i.type).toLowerCase()}`).join(', ');
}

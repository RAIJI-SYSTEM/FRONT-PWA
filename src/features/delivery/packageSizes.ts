import { Boxes, Mail, Package, ShoppingBag, type LucideIcon } from 'lucide-react';
import type { PackageSize } from '@/types/delivery';

/** Peso máximo de cada tamanho (o mesmo limite do backend) */
export const MAX_WEIGHT_KG: Record<PackageSize, number> = { envelope: 1, small: 5, medium: 15, large: 30 };

export const PACKAGE_SIZES: { value: PackageSize; label: string; hint: string; icon: LucideIcon }[] = [
  { value: 'envelope', label: 'Envelope', hint: 'Documentos, até 1 kg', icon: Mail },
  { value: 'small', label: 'Pequeno', hint: 'Cabe numa mochila, até 5 kg', icon: ShoppingBag },
  { value: 'medium', label: 'Médio', hint: 'Caixa de sapato, até 15 kg', icon: Package },
  { value: 'large', label: 'Grande', hint: 'Porta-malas, até 30 kg', icon: Boxes },
];

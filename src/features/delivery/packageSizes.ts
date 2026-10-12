import { Boxes, Mail, Package, ShoppingBag, type LucideIcon } from 'lucide-react';
import type { PackageSize } from '@/types/delivery';

export const PACKAGE_SIZES: { value: PackageSize; label: string; hint: string; icon: LucideIcon }[] = [
  { value: 'envelope', label: 'Envelope', hint: 'Documentos, até 1 kg', icon: Mail },
  { value: 'small', label: 'Pequeno', hint: 'Cabe numa mochila, até 5 kg', icon: ShoppingBag },
  { value: 'medium', label: 'Médio', hint: 'Caixa de sapato, até 10 kg', icon: Package },
  { value: 'large', label: 'Grande', hint: 'Porta-malas, até 30 kg', icon: Boxes },
];

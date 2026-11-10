import { Car, CreditCard, Gift, MessageCircle, Package, ShieldCheck, type LucideIcon } from 'lucide-react';
import type { NotificationCategory } from '@/types/notification';

export const NOTIFICATION_CATEGORIES: Record<NotificationCategory, { label: string; description: string; icon: LucideIcon }> = {
  trips: { label: 'Viagens', description: 'Motorista a caminho, reservas e avaliações', icon: Car },
  deliveries: { label: 'Encomendas', description: 'Coleta, trajeto e entrega dos pacotes', icon: Package },
  payments: { label: 'Pagamentos', description: 'Pagamentos aprovados, recusados e ganhos', icon: CreditCard },
  messages: { label: 'Mensagens', description: 'Novas mensagens nas conversas', icon: MessageCircle },
  promotions: { label: 'Promoções', description: 'Cupons, recompensas e novidades', icon: Gift },
  account: { label: 'Conta', description: 'Segurança e documentos (sempre ativos)', icon: ShieldCheck },
};

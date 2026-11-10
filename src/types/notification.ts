import type { AppMode } from './message';

/** Tipos de aviso (cada um pode ser ligado/desligado em Configurações, menos "account") */
export type NotificationCategory = 'trips' | 'deliveries' | 'payments' | 'messages' | 'promotions' | 'account';

export interface AppNotification {
  id: string;
  mode: AppMode;
  category: NotificationCategory;
  title: string;
  body: string;
  createdAt: string; // ISO 8601
  read: boolean;
  /** Para onde o toque leva */
  href?: string;
}

export type NotificationPreferences = Record<Exclude<NotificationCategory, 'account'>, boolean>;

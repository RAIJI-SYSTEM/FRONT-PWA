import { backend } from './backend/client';

/** Um valor pago à plataforma que é (menos a comissão) do motorista */
export interface PayoutItemApi {
  kind: 'RIDE' | 'DELIVERY';
  id: string;
  rideId: string;
  driverSub: string;
  driverName: string | null;
  description: string;
  departureDate: string | null;
  paidAt: string | null;
  paidCents: number;
  feeCents: number;
  driverCents: number;
}

export interface DriverPayoutApi {
  id: string;
  driverSub: string;
  amountCents: number;
  itemCount: number;
  pixKey: string | null;
  note: string | null;
  paidAt: string;
}

export interface MyPayoutsApi {
  pixKey: string | null;
  pendingCents: number;
  pending: PayoutItemApi[];
  payouts: DriverPayoutApi[];
}

export interface DriverBalanceApi {
  driverSub: string;
  driverName: string | null;
  pixKey: string | null;
  amountCents: number;
  itemCount: number;
  items: PayoutItemApi[];
}

// Motorista
export const getMyPayouts = () => backend<MyPayoutsApi>('/api/drivers/me/payouts');
export const savePixKey = (pixKey: string) =>
  backend<{ pixKey: string }>('/api/drivers/me/pix-key', { method: 'PUT', body: { pixKey } });

// Admin (role "admin")
export const getPayoutBalances = () => backend<DriverBalanceApi[]>('/api/admin/payouts/balances');
export const getPayoutHistory = () => backend<DriverPayoutApi[]>('/api/admin/payouts');
export const registerPayout = (driverSub: string, amountCents: number, note?: string) =>
  backend<DriverPayoutApi>('/api/admin/payouts', { method: 'POST', body: { driverSub, amountCents, note: note || null } });

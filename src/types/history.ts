import type { PackageSize } from './delivery';

export type HistoryKind = 'rides' | 'deliveries';

export interface HistoryDriver {
  id: string;
  name: string;
  vehicle: string;
}

/** Avaliação que o passageiro/remetente deu ao motorista */
export interface DriverRating {
  stars: number; // 1 a 5
  tags: string[];
  comment?: string;
  ratedAt: string; // ISO 8601
}

export type RideHistoryStatus = 'scheduled' | 'in_progress' | 'completed' | 'canceled';

export interface RideHistoryItem {
  id: string;
  status: RideHistoryStatus;
  origin: string;
  destination: string;
  date: string; // ISO 8601: saída (agendada) ou início da corrida
  priceCents: number;
  distanceKm: number;
  /** Corrida dividida com outros passageiros (tem grupo no chat) */
  shared: boolean;
  paymentMethod: 'card' | 'pix';
  driver: HistoryDriver;
  rating?: DriverRating;
}

export type DeliveryHistoryStatus = 'awaiting_pickup' | 'in_transit' | 'delivered' | 'canceled';

export interface DeliveryHistoryItem {
  id: string;
  code: string;
  status: DeliveryHistoryStatus;
  origin: string;
  destination: string;
  date: string; // ISO 8601: coleta
  priceCents: number;
  size: PackageSize;
  description: string;
  recipientName: string;
  driver: HistoryDriver;
  rating?: DriverRating;
}

export interface RateDriverRequest {
  stars: number;
  tags?: string[];
  comment?: string;
}

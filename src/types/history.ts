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

/** requested = pedido enviado, esperando o motorista aceitar */
export type RideHistoryStatus = 'requested' | 'scheduled' | 'in_progress' | 'completed' | 'canceled';

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
  /** Carona e pedido de vaga no backend (para ver detalhes / mudar a bagagem) */
  rideId?: string;
  bookingId?: string;
  /** Ex.: "1× mala, 1× mochila" ou "Sem bagagem" */
  baggageSummary?: string;
  /** Há uma alteração de bagagem esperando o motorista aprovar */
  baggagePending?: boolean;
  meetingPoint?: string | null;
}

/** requested = pedido enviado, esperando o motorista aceitar */
export type DeliveryHistoryStatus = 'requested' | 'awaiting_pickup' | 'in_transit' | 'delivered' | 'canceled';

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
  fragile?: boolean;
  recipientName: string;
  driver: HistoryDriver;
  rating?: DriverRating;
  /** Código que o remetente mostra ao motorista na coleta */
  pickupCode?: string | null;
  /** Palavra-chave que o destinatário diz ao motorista na entrega */
  keyword?: string | null;
  companyId?: string | null;
}

export interface RateDriverRequest {
  stars: number;
  tags?: string[];
  comment?: string;
}

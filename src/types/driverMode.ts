import type { PackageSize } from './delivery';
import type { DriverRating } from './history';
import type { Attachment } from './message';

/** Categorias da CNH que permitem transportar passageiros/cargas em veículos comuns */
export const CNH_CATEGORIES = ['A', 'B', 'AB', 'C', 'D', 'E'] as const;
export type CnhCategory = (typeof CNH_CATEGORIES)[number];

export interface Cnh {
  /** Número de registro: 11 dígitos */
  number: string;
  category: CnhCategory;
  expiresAt: string; // AAAA-MM-DD
  /**
   * "Exerce Atividade Remunerada": observação obrigatória na CNH de quem dirige
   * profissionalmente por aplicativo (Lei 13.640/2018).
   */
  ear: boolean;
  frontPhoto?: Attachment;
  backPhoto?: Attachment;
}

export type VehicleType = 'car' | 'van' | 'motorcycle';

export interface Vehicle {
  id: string;
  type: VehicleType;
  model: string; // ex.: "Chevrolet Onix"
  year: number;
  color: string;
  /** Placa no padrão antigo (ABC1234) ou Mercosul (ABC1D23), sem hífen */
  plate: string;
  /** Lugares para passageiros (sem contar o motorista) */
  seats: number;
  /** Veículo usado por padrão nas rotas */
  primary: boolean;
}

/**
 * - none: nunca se cadastrou como motorista
 * - in_review: enviou CNH e veículo; aguardando análise dos documentos
 * - approved: pode publicar rotas e aceitar pedidos
 */
export type DriverAccountStatus = 'none' | 'in_review' | 'approved';

export interface DriverAccount {
  status: DriverAccountStatus;
  cnh?: Cnh;
  vehicles: Vehicle[];
  /** Última verificação da CNH (recusada = o motivo, para reenviar) */
  review?: { status: 'PROCESSING' | 'APPROVED' | 'REJECTED' | 'ERROR'; reason: string | null };
}

/** Envio para a verificação automática: foto da CNH + código de segurança (verso / CNH digital) */
export interface CnhSubmission {
  image: File;
  securityCode: string;
}

export type DriverRouteStatus = 'published' | 'in_progress' | 'completed' | 'canceled';

/** Rota que o motorista vai fazer e oferece lugares/espaço para encomendas */
export interface DriverRoute {
  id: string;
  originCity: string;
  departurePoint: string;
  destinationCity: string;
  departureAt: string; // ISO 8601
  vehicleId: string;
  seats: number;
  seatsTaken: number;
  pricePerSeatCents: number;
  acceptsPackages: boolean;
  status: DriverRouteStatus;
  /** Preço por encomenda (centavos) */
  pricePerPackageCents?: number;
  /** Peso máximo de encomendas/bagagem (kg) */
  maxCargoKg?: number | null;
  bookingsClosed?: boolean;
  /** O motorista recebe por vaga (preço menos a comissão da plataforma) */
  driverReceivesPerSeatCents?: number;
  /** Viagem exclusiva de frete (não aparece na busca) */
  private?: boolean;
}

export type NewDriverRoute = Omit<DriverRoute, 'id' | 'seatsTaken' | 'status' | 'departurePoint' | 'originCity' | 'destinationCity'> & {
  origin: import('./place').Place;
  destination: import('./place').Place;
  departurePoint: string;
};

export type RegionRequestStatus = 'open' | 'accepted' | 'rejected';

/** Pedido de alguém da região (corrida ou encomenda) esperando um motorista */
export interface RegionRequest {
  /** "ride:<carona>:<pedido>" ou "delivery:<carona>:<encomenda>" */
  id: string;
  kind: 'ride' | 'delivery';
  customerId: string;
  customerName: string;
  customerRating: number;
  origin: string;
  destination: string;
  distanceKm: number;
  /** Quando: agora ou agendado */
  when: { type: 'now' } | { type: 'scheduled'; at: string };
  /** Valor que o motorista recebe */
  earningsCents: number;
  /** Corridas */
  passengers?: number;
  /** Encomendas */
  packageSize?: PackageSize;
  fragile?: boolean;
  status: RegionRequestStatus;
  /** Carona a que o pedido se refere */
  rideId?: string;
  /** Bagagem declarada (corridas) ou peso (encomendas) */
  cargoSummary?: string;
  /** Pedido de trecho (embarca/desce no meio do caminho) */
  segment?: boolean;
  /** Alteração de bagagem esperando aprovação (passageiro já aceito) */
  baggageChange?: boolean;
}

export type DriverJobStatus = 'accepted' | 'in_progress' | 'completed' | 'canceled';

/** Corrida/encomenda que o motorista aceitou (aparece em "Viagens") */
export interface DriverJob {
  /** "ride:<carona>:<pedido>" ou "delivery:<carona>:<encomenda>" */
  id: string;
  kind: 'ride' | 'delivery';
  customerId: string;
  customerName: string;
  origin: string;
  destination: string;
  date: string; // ISO 8601
  earningsCents: number;
  status: DriverJobStatus;
  /** Avaliação que o motorista deu ao passageiro/remetente */
  customerRating?: DriverRating;
  rideId?: string;
  /** Encomendas: status no backend (para coletar/entregar com código) */
  deliveryStatus?: 'CONFIRMED' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED' | 'PENDING';
}

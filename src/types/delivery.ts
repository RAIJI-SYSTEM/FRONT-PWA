import type { Place } from './place';
import type { Departure, RideOffer } from './ride';

export type PackageSize = 'envelope' | 'small' | 'medium' | 'large';

/** "Informar dados do produto" do BPMN */
export interface PackageDetails {
  size: PackageSize;
  description: string;
  /** Vidro, eletrônicos, cerâmica...: o motorista manuseia com mais cuidado */
  fragile: boolean;
  /** Valor declarado em centavos (opcional, para seguro/ressarcimento) */
  declaredValueCents?: number;
  recipientName: string;
  recipientPhone: string;
  notes?: string;
}

/**
 * - awaiting_details: rota válida, aguardando os dados do produto
 * - searching: procurando motorista (entrega imediata)
 * - published: publicada no mural de entregas da região (entrega agendada)
 * - results: opções de viagem disponíveis para o remetente escolher
 * - no_results: nenhum motorista disponível
 * - paid: pagamento concluído; palavra-chave gerada
 * - canceled: o remetente desistiu
 */
export type DeliveryStatus = 'awaiting_details' | 'searching' | 'published' | 'results' | 'no_results' | 'paid' | 'canceled';

export interface Delivery {
  id: string;
  origin: Place;
  destination: Place;
  status: DeliveryStatus;
  intermunicipal: boolean;
  details?: PackageDetails;
  departure?: Departure;
  offers: RideOffer[];
  /** Palavra-chave que o destinatário informa ao motorista para receber a entrega */
  keyword?: string;
  createdAt: string;
}

export interface DeliveryDetailsRequest {
  details: PackageDetails;
  departure: Departure;
}

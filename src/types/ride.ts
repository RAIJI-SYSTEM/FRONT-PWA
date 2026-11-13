import type { Place } from './place';

export type Departure = { type: 'now' } | { type: 'scheduled'; at: string /* ISO 8601 */ };

/**
 * - searching: procurando motorista (o passageiro vê a tela de espera com anúncios)
 * - published: carona agendada publicada no mural, aguardando o horário
 * - results: motoristas encontrados, aguardando o passageiro escolher
 * - no_results: nenhuma rota/motorista disponível (busca encerrada)
 * - canceled: o passageiro desistiu
 */
export type RideSearchStatus = 'searching' | 'published' | 'results' | 'no_results' | 'canceled';

export type ProviderType = 'cnpj' | 'mei' | 'autonomo';

/**
 * Uma carona publicada que serve para o trajeto buscado (o id é o da carona).
 * O preço é o do motorista — proporcional ao trecho quando a pessoa embarca/desce no meio do caminho.
 */
export interface RideOffer {
  id: string;
  driverName: string;
  /** Avaliação do motorista (ainda não existe no backend) */
  driverRating?: number;
  vehicle: string;
  providerType?: ProviderType;
  /** Preço em centavos (BRL). Definido pelo motorista/servidor, nunca pelo cliente. */
  priceCents: number;
  /** Minutos até a saída */
  etaMinutes: number;
  /** Saída (ISO 8601) */
  departureAt?: string;
  /** false = trecho da viagem (embarca/desce no meio do caminho) */
  fullRoute?: boolean;
  seatsLeft?: number;
  meetingPoint?: string | null;
  /** Rota da carona (ex.: "São Paulo → Campinas") */
  routeLabel?: string;
}

export interface RideSearchRequest {
  origin: Place;
  destination: Place;
  departure: Departure;
}

export interface RideSearch extends RideSearchRequest {
  id: string;
  status: RideSearchStatus;
  intermunicipal: boolean;
  offers: RideOffer[];
  createdAt: string;
}

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

export interface RideOffer {
  id: string;
  driverName: string;
  driverRating: number;
  vehicle: string;
  providerType: ProviderType;
  /** Preço em centavos (BRL). Definido pelo servidor, nunca pelo cliente. */
  priceCents: number;
  etaMinutes: number;
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

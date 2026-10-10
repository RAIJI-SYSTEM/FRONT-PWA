/**
 * SIMULAÇÃO do "Sistema AVXAE" para desenvolvimento.
 *
 * Segue as decisões do BPMN (verificar rotas → intermunicipal? → filtrar CNPJ/MEI →
 * há rotas? → carona é para agora? → procurar motorista → definir preço mínimo),
 * mas guarda tudo em memória e sorteia motoristas fictícios.
 *
 * Em produção, troque por chamadas ao seu backend real e um banco de dados:
 * a memória do processo não é compartilhada entre instâncias (ex.: Vercel) e
 * é perdida a cada reinício.
 */
import type { RideOffer, RideSearch, RideSearchRequest } from '@/types/ride';
import { distanceKm } from '@/utils/geo';

/** Tempo simulado até um motorista responder */
const MATCHING_DELAY_MS = 12_000;
/** Chance simulada de ninguém aceitar a carona */
const NO_DRIVER_CHANCE = 0.15;

const BASE_FARE_CENTS = 500;
const PER_KM_CENTS = 210;

interface StoredSearch extends RideSearch {
  /** Quando a "resposta" dos motoristas fica disponível */
  resolvesAt: number;
  /** Resultado já sorteado, revelado só depois de resolvesAt */
  pendingOffers: RideOffer[];
}

// Mantém os dados entre recarregamentos do `next dev`
const globalStore = globalThis as unknown as { rideSearches?: Map<string, StoredSearch> };
const searches = (globalStore.rideSearches ??= new Map());

const DRIVERS: Omit<RideOffer, 'id' | 'priceCents' | 'etaMinutes'>[] = [
  { driverName: 'Carlos Souza', driverRating: 4.9, vehicle: 'Onix prata · ABC1D23', providerType: 'mei' },
  { driverName: 'Ana Ribeiro', driverRating: 4.8, vehicle: 'HB20 branco · QWE4R56', providerType: 'autonomo' },
  { driverName: 'Transportes Lima', driverRating: 4.7, vehicle: 'Spin preta · RTY7U89', providerType: 'cnpj' },
  { driverName: 'Marcos Alves', driverRating: 4.6, vehicle: 'Corolla cinza · ZXC0V12', providerType: 'mei' },
];

/** "Definir preço mínimo": tarifa base + valor por km */
function minimumPriceCents(request: RideSearchRequest) {
  const km = distanceKm(request.origin.coordinates, request.destination.coordinates);
  return Math.round(BASE_FARE_CENTS + km * PER_KM_CENTS);
}

function findDrivers(request: RideSearchRequest, intermunicipal: boolean): RideOffer[] {
  if (Math.random() < NO_DRIVER_CHANCE) return [];

  // "Filtrar prestadores com CNPJ/MEI" quando a rota é intermunicipal
  const eligible = intermunicipal ? DRIVERS.filter((d) => d.providerType !== 'autonomo') : DRIVERS;
  const minimum = minimumPriceCents(request);

  return eligible
    .slice(0, 1 + Math.floor(Math.random() * eligible.length))
    .map((driver, index) => ({
      ...driver,
      id: crypto.randomUUID(),
      priceCents: minimum + index * 150,
      etaMinutes: 3 + Math.floor(Math.random() * 10),
    }))
    .sort((a, b) => a.priceCents - b.priceCents);
}

/** Remove os campos internos da simulação antes de enviar ao cliente */
function toPublic(stored: StoredSearch): RideSearch {
  const { resolvesAt, pendingOffers, ...search } = stored;
  void resolvesAt;
  void pendingOffers;
  return search;
}

export function createRideSearch(request: RideSearchRequest): RideSearch {
  const { origin, destination } = request;
  const intermunicipal = Boolean(origin.city && destination.city && origin.city !== destination.city);
  const isScheduled = request.departure.type === 'scheduled';

  const search: StoredSearch = {
    ...request,
    id: crypto.randomUUID(),
    // "Carona é para agora?" → não: publica no mural e aguarda o horário
    status: isScheduled ? 'published' : 'searching',
    intermunicipal,
    offers: [],
    createdAt: new Date().toISOString(),
    resolvesAt: Date.now() + MATCHING_DELAY_MS,
    pendingOffers: isScheduled ? [] : findDrivers(request, intermunicipal),
  };

  searches.set(search.id, search);
  return toPublic(search);
}

export function getRideSearch(id: string): RideSearch | null {
  const search = searches.get(id);
  if (!search) return null;

  // Revela o resultado quando o "tempo de resposta" dos motoristas passa
  if (search.status === 'searching' && Date.now() >= search.resolvesAt) {
    search.offers = search.pendingOffers;
    search.status = search.offers.length > 0 ? 'results' : 'no_results';
  }
  return toPublic(search);
}

export function cancelRideSearch(id: string): RideSearch | null {
  const search = searches.get(id);
  if (!search) return null;
  if (search.status === 'searching' || search.status === 'published') search.status = 'canceled';
  return toPublic(search);
}

export function findOffer(searchId: string, offerId: string) {
  const search = getRideSearch(searchId);
  return search?.offers.find((offer) => offer.id === offerId) ?? null;
}

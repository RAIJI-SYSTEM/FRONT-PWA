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
import 'server-only';
import type { RideOffer, RideSearch, RideSearchRequest } from '@/types/ride';
import { isIntermunicipal, matchDrivers, MATCHING_DELAY_MS } from './matching';

interface StoredSearch extends RideSearch {
  /** Quando a "resposta" dos motoristas fica disponível */
  resolvesAt: number;
  /** Resultado já sorteado, revelado só depois de resolvesAt */
  pendingOffers: RideOffer[];
}

// Mantém os dados entre recarregamentos do `next dev`
const globalStore = globalThis as unknown as { rideSearches?: Map<string, StoredSearch> };
const searches = (globalStore.rideSearches ??= new Map());

/** Remove os campos internos da simulação antes de enviar ao cliente */
function toPublic(stored: StoredSearch): RideSearch {
  const { resolvesAt, pendingOffers, ...search } = stored;
  void resolvesAt;
  void pendingOffers;
  return search;
}

export function createRideSearch(request: RideSearchRequest): RideSearch {
  const intermunicipal = isIntermunicipal(request.origin, request.destination);
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
    pendingOffers: isScheduled ? [] : matchDrivers(request.origin, request.destination, { intermunicipal }),
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

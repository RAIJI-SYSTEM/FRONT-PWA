import { ApiError } from './api';
import { backend, fromBrazilLocal, toBrazilLocal, toCents } from './backend/client';
import type { RideSearchResultApi } from './backend/types';
import type { Place } from '@/types/place';
import type { RideOffer, RideSearch, RideSearchRequest } from '@/types/ride';

/**
 * Busca de carona = consulta às caronas PUBLICADAS que passam perto do embarque e do
 * destino (busca pelo caminho no backend). A busca fica guardada no aparelho (sessão)
 * para as telas de resultado e de pedido de vaga.
 */
const STORAGE_KEY = 'raiji.rideSearches';
/** Distância máxima entre a rota do motorista e o embarque/desembarque */
export const SEARCH_RADIUS_METERS = 5_000;

interface StoredSearch {
  search: RideSearch;
  results: RideSearchResultApi[];
}

function loadAll(): Record<string, StoredSearch> {
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? '{}');
  } catch {
    return {};
  }
}

function saveAll(all: Record<string, StoredSearch>) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {
    /* sem armazenamento: a busca vale só nesta tela */
  }
}

const latLng = (place: Place) => ({ lat: place.coordinates[1], lng: place.coordinates[0] });

/** Janela de horário: "agora" = saídas na próxima 1h; agendada = do horário até 4h depois (com 1h de folga antes) */
export function searchWindow(departure: RideSearchRequest['departure']) {
  if (departure.type === 'now') {
    const now = new Date();
    return { from: toBrazilLocal(now), to: toBrazilLocal(new Date(now.getTime() + 60 * 60_000)) };
  }
  const at = new Date(departure.at);
  const from = new Date(Math.max(Date.now(), at.getTime() - 60 * 60_000));
  return { from: toBrazilLocal(from), to: toBrazilLocal(new Date(at.getTime() + 4 * 60 * 60_000)) };
}

export function toOffer(result: RideSearchResultApi, kind: 'seat' | 'package' = 'seat'): RideOffer {
  const ride = result.ride;
  const departureAt = fromBrazilLocal(ride.departureDate);
  const price = kind === 'package' ? result.suggestedPackagePrice : result.suggestedPrice;
  return {
    id: ride.id,
    driverName: ride.driverName ?? 'Motorista',
    vehicle: result.vehicle ?? '',
    priceCents: toCents(price),
    etaMinutes: Math.max(0, Math.round((Date.parse(departureAt) - Date.now()) / 60_000)),
    departureAt,
    fullRoute: result.fullRoute,
    seatsLeft: ride.availableSeats,
    meetingPoint: ride.meetingPoint,
    routeLabel: `${ride.originCity} → ${ride.destinationCity}`,
  };
}

export async function findRides(origin: Place, destination: Place, departure: RideSearchRequest['departure'], kind: 'SEAT' | 'PACKAGE') {
  const o = latLng(origin);
  const d = latLng(destination);
  const window = searchWindow(departure);
  return backend<RideSearchResultApi[]>('/api/rides/search', {
    query: {
      originLat: o.lat,
      originLng: o.lng,
      destinationLat: d.lat,
      destinationLng: d.lng,
      radiusMeters: SEARCH_RADIUS_METERS,
      from: window.from,
      to: window.to,
      kind,
    },
  });
}

export async function createRideSearch(request: RideSearchRequest): Promise<RideSearch> {
  const results = await findRides(request.origin, request.destination, request.departure, 'SEAT');
  const offers = results.map((r) => toOffer(r)).sort((a, b) => a.priceCents - b.priceCents || a.etaMinutes - b.etaMinutes);
  const search: RideSearch = {
    ...request,
    id: crypto.randomUUID(),
    status: offers.length > 0 ? 'results' : 'no_results',
    intermunicipal: Boolean(request.origin.city && request.destination.city && request.origin.city !== request.destination.city),
    offers,
    createdAt: new Date().toISOString(),
  };
  const all = loadAll();
  all[search.id] = { search, results };
  saveAll(all);
  return search;
}

export async function getRideSearch(id: string): Promise<RideSearch> {
  const stored = loadAll()[id];
  if (!stored) throw new ApiError('Esta busca expirou. Faça uma nova busca.', 404);
  return stored.search;
}

/** O resultado completo (carona + trecho) de uma oferta da busca, para o pedido de vaga */
export function getSearchResult(searchId: string, rideId: string): { search: RideSearch; result: RideSearchResultApi } | null {
  const stored = loadAll()[searchId];
  const result = stored?.results.find((r) => r.ride.id === rideId);
  return stored && result ? { search: stored.search, result } : null;
}

export async function cancelRideSearch(id: string): Promise<RideSearch> {
  const all = loadAll();
  const stored = all[id];
  if (!stored) throw new ApiError('Esta busca expirou.', 404);
  stored.search = { ...stored.search, status: 'canceled' };
  saveAll(all);
  return stored.search;
}

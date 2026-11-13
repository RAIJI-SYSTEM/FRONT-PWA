import type { Delivery, DeliveryDetailsRequest } from '@/types/delivery';
import type { Place } from '@/types/place';
import { ApiError } from './api';
import { backend, toReais } from './backend/client';
import type { DeliveryApi, RideSearchResultApi } from './backend/types';
import { findRides, toOffer } from './rideSearch';

/**
 * Enviar encomenda = pedir ESPAÇO DE CARGA numa carona publicada que passa pelo caminho
 * (do mesmo jeito que o passageiro pede vaga). Rascunho no aparelho até escolher a carona.
 */
const STORAGE_KEY = 'raiji.deliveryDrafts';

interface StoredDelivery {
  delivery: Delivery;
  results: RideSearchResultApi[];
}

function loadAll(): Record<string, StoredDelivery> {
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? '{}');
  } catch {
    return {};
  }
}

function save(stored: StoredDelivery) {
  const all = loadAll();
  all[stored.delivery.id] = stored;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {
    /* sem armazenamento */
  }
  return stored.delivery;
}

function load(id: string): StoredDelivery {
  const stored = loadAll()[id];
  if (!stored) throw new ApiError('Esta encomenda expirou. Comece de novo.', 404);
  return stored;
}

export async function createDelivery(origin: Place, destination: Place): Promise<Delivery> {
  return save({
    delivery: {
      id: crypto.randomUUID(),
      origin,
      destination,
      status: 'awaiting_details',
      intermunicipal: Boolean(origin.city && destination.city && origin.city !== destination.city),
      offers: [],
      createdAt: new Date().toISOString(),
    },
    results: [],
  });
}

export async function getDelivery(id: string): Promise<Delivery> {
  return load(id).delivery;
}

/** Dados do pacote + quando: procura caronas que levam encomendas nesse caminho */
export async function submitDeliveryDetails(id: string, request: DeliveryDetailsRequest): Promise<Delivery> {
  const stored = load(id);
  const results = await findRides(stored.delivery.origin, stored.delivery.destination, request.departure, 'PACKAGE');
  const offers = results.map((r) => toOffer(r, 'package')).sort((a, b) => a.priceCents - b.priceCents || a.etaMinutes - b.etaMinutes);
  return save({
    delivery: { ...stored.delivery, details: request.details, departure: request.departure, offers, status: offers.length ? 'results' : 'no_results' },
    results,
  });
}

/** Pede o espaço na carona escolhida. O motorista aceita ou recusa; os códigos já valem. */
export async function requestDeliverySpace(id: string, rideId: string, companyId?: string | null): Promise<Delivery> {
  const stored = load(id);
  const { delivery } = stored;
  const details = delivery.details;
  if (!details) throw new ApiError('Faltam os dados do pacote.', 400);
  const result = stored.results.find((r) => r.ride.id === rideId);
  const segment =
    result && !result.fullRoute
      ? {
          pickup: { latitude: delivery.origin.coordinates[1], longitude: delivery.origin.coordinates[0], address: delivery.origin.address || delivery.origin.name },
          dropoff: { latitude: delivery.destination.coordinates[1], longitude: delivery.destination.coordinates[0], address: delivery.destination.address || delivery.destination.name },
        }
      : {};
  const created = await backend<DeliveryApi>(`/api/rides/${rideId}/deliveries`, {
    method: 'POST',
    body: {
      pkg: {
        size: details.size.toUpperCase(),
        description: details.description,
        weightKg: details.weightKg,
        fragile: details.fragile,
        declaredValue: details.declaredValueCents ? toReais(details.declaredValueCents) : null,
        recipientName: details.recipientName,
        recipientPhone: details.recipientPhone,
      },
      companyId: companyId ?? null,
      ...segment,
    },
  });
  return save({
    delivery: {
      ...delivery,
      status: 'requested',
      backendId: created.id,
      rideId,
      pickupCode: created.pickupCode ?? undefined,
      keyword: created.deliveryKeyword ?? undefined,
      companyId: created.companyId,
    },
    results: stored.results,
  });
}

export async function cancelDelivery(id: string): Promise<Delivery> {
  const stored = load(id);
  if (stored.delivery.backendId) {
    await backend<DeliveryApi>(`/api/deliveries/${stored.delivery.backendId}/cancel`, { method: 'POST', body: {} });
  }
  return save({ ...stored, delivery: { ...stored.delivery, status: 'canceled' } });
}

/** Encomendas do backend (remetente / empresa) */
export const listMyDeliveries = () => backend<DeliveryApi[]>('/api/deliveries/mine');
export const getDeliveryApi = (id: string) => backend<DeliveryApi>(`/api/deliveries/${id}`);

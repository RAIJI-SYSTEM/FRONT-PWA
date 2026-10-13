/**
 * SIMULAÇÃO do fluxo de encomendas do "AVXAE Core System" (ver BPMN de envio):
 * verificar rotas válidas → solicitar dados do produto → a entrega é imediata?
 * (sim: procurar motorista / não: publicar no mural de entregas da região) →
 * enviar opções → processar pagamento → gerar palavra-chave da entrega.
 *
 * Guarda tudo em memória: troque pelo backend real em produção.
 */
import 'server-only';
import type { Delivery, DeliveryDetailsRequest, PackageSize } from '@/types/delivery';
import type { Place } from '@/types/place';
import type { RideOffer } from '@/types/ride';
import { distanceKm } from '@/utils/geo';
import { isIntermunicipal, matchDrivers, MATCHING_DELAY_MS } from './matching';

/** Limites do que a plataforma atende */
const MIN_DISTANCE_KM = 0.3;
const MAX_DISTANCE_KM = 800;

/** Encomendas maiores custam mais */
const SIZE_PRICE_MULTIPLIER: Record<PackageSize, number> = { envelope: 1, small: 1.2, medium: 1.5, large: 2 };

const KEYWORDS = ['girassol', 'canela', 'farol', 'jabuti', 'cometa', 'pitanga', 'bussola', 'tucano', 'jangada', 'ipe', 'cacau', 'maracuja'];

interface StoredDelivery extends Delivery {
  resolvesAt?: number;
  pendingOffers?: RideOffer[];
}

const globalStore = globalThis as unknown as { deliveries?: Map<string, StoredDelivery> };
const deliveries = (globalStore.deliveries ??= new Map());

export class DeliveryError extends Error {
  constructor(
    message: string,
    public status = 422,
  ) {
    super(message);
  }
}

function toPublic(stored: StoredDelivery): Delivery {
  const { resolvesAt, pendingOffers, ...delivery } = stored;
  void resolvesAt;
  void pendingOffers;
  return delivery;
}

/** "Verificar rotas válidas" → cria a entrega aguardando os dados do produto */
export function createDelivery(origin: Place, destination: Place): Delivery {
  const km = distanceKm(origin.coordinates, destination.coordinates);
  if (km < MIN_DISTANCE_KM) throw new DeliveryError('Origem e destino estão muito próximos.');
  if (km > MAX_DISTANCE_KM) throw new DeliveryError(`Ainda não fazemos entregas acima de ${MAX_DISTANCE_KM} km.`);

  const delivery: StoredDelivery = {
    id: crypto.randomUUID(),
    origin,
    destination,
    status: 'awaiting_details',
    intermunicipal: isIntermunicipal(origin, destination),
    offers: [],
    createdAt: new Date().toISOString(),
  };
  deliveries.set(delivery.id, delivery);
  return toPublic(delivery);
}

/** "Dados do produto recebidos" → "A entrega é imediata?" */
export function submitDeliveryDetails(id: string, { details, departure }: DeliveryDetailsRequest): Delivery {
  const delivery = deliveries.get(id);
  if (!delivery) throw new DeliveryError('Entrega não encontrada.', 404);
  if (delivery.status !== 'awaiting_details') throw new DeliveryError('Os dados desta entrega já foram enviados.', 409);

  delivery.details = details;
  delivery.departure = departure;
  delivery.createdAt = new Date().toISOString(); // a espera começa agora

  if (departure.type === 'scheduled') {
    // Não: "Publicar no mural de entregas da região"
    delivery.status = 'published';
  } else {
    // Sim: "Procurar motorista"
    delivery.status = 'searching';
    delivery.resolvesAt = Date.now() + MATCHING_DELAY_MS;
    delivery.pendingOffers = matchDrivers(delivery.origin, delivery.destination, {
      intermunicipal: delivery.intermunicipal,
      priceMultiplier: SIZE_PRICE_MULTIPLIER[details.size],
    });
  }
  return toPublic(delivery);
}

export function getDelivery(id: string): Delivery | null {
  const delivery = deliveries.get(id);
  if (!delivery) return null;

  if (delivery.status === 'searching' && delivery.resolvesAt && Date.now() >= delivery.resolvesAt) {
    delivery.offers = delivery.pendingOffers ?? [];
    delivery.status = delivery.offers.length > 0 ? 'results' : 'no_results';
  }
  return toPublic(delivery);
}

export function cancelDelivery(id: string): Delivery | null {
  const delivery = deliveries.get(id);
  if (!delivery) return null;
  if (['awaiting_details', 'searching', 'published'].includes(delivery.status)) delivery.status = 'canceled';
  return toPublic(delivery);
}

export function findDeliveryOffer(id: string, offerId: string) {
  return getDelivery(id)?.offers.find((offer) => offer.id === offerId) ?? null;
}

/**
 * "Gerar palavra-chave da entrega" após o pagamento. Idempotente: chamado tanto pelo
 * webhook do Stripe quanto pela consulta de status, devolve sempre a mesma palavra.
 */
export function markDeliveryPaid(id: string): string | null {
  const delivery = deliveries.get(id);
  if (!delivery) return null;
  if (!delivery.keyword) {
    const [wordIndex, number] = crypto.getRandomValues(new Uint32Array(2));
    delivery.keyword = `${KEYWORDS[wordIndex % KEYWORDS.length]}-${10 + (number % 90)}`;
    delivery.status = 'paid';
  }
  return delivery.keyword;
}

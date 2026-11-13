import type { DeliveryHistoryItem, DeliveryHistoryStatus, DriverRating, HistoryKind, RateDriverRequest, RideHistoryItem, RideHistoryStatus } from '@/types/history';
import type { PackageSize } from '@/types/delivery';
import { describeBaggage } from '@/features/ride/baggage/baggageTypes';
import { backend, fromBrazilLocal, toCents } from './backend/client';
import type { BookingStatus, DeliveryApi, DeliveryStatusApi, MyBookingApi, RideStatus } from './backend/types';

/** "Minhas viagens" e "Minhas encomendas" a partir do backend. */

function rideStatus(booking: BookingStatus, ride: RideStatus): RideHistoryStatus {
  if (booking === 'CANCELLED' || ride === 'CANCELLED') return 'canceled';
  if (booking === 'COMPLETED' || ride === 'COMPLETED') return booking === 'CONFIRMED' || booking === 'COMPLETED' ? 'completed' : 'canceled';
  if (booking === 'PENDING') return 'requested';
  return ride === 'IN_PROGRESS' ? 'in_progress' : 'scheduled';
}

const DELIVERY_STATUS: Record<DeliveryStatusApi, DeliveryHistoryStatus> = {
  PENDING: 'requested',
  CONFIRMED: 'awaiting_pickup',
  IN_TRANSIT: 'in_transit',
  DELIVERED: 'delivered',
  CANCELLED: 'canceled',
};

// Avaliações ainda não existem no backend: ficam guardadas neste aparelho
const RATINGS_KEY = 'raiji.driverRatings';
function loadRatings(): Record<string, DriverRating> {
  try {
    return JSON.parse(localStorage.getItem(RATINGS_KEY) ?? '{}');
  } catch {
    return {};
  }
}

export async function listRides(): Promise<RideHistoryItem[]> {
  const ratings = loadRatings();
  const items = await backend<MyBookingApi[]>('/api/rides/bookings/mine');
  return items.map(({ booking, ride }) => ({
    id: booking.id,
    status: rideStatus(booking.status, ride.status),
    origin: booking.pickupAddress ?? `${ride.originCity}/${ride.originState}`,
    destination: booking.dropoffAddress ?? `${ride.destinationCity}/${ride.destinationState}`,
    date: fromBrazilLocal(ride.departureDate),
    priceCents: toCents(booking.price),
    distanceKm: (ride.routeDistanceMeters ?? 0) / 1000,
    shared: ride.totalSeats > 1,
    paymentMethod: 'card',
    driver: { id: ride.driverSub, name: ride.driverName ?? 'Motorista', vehicle: '' },
    rating: ratings[`rides:${booking.id}`],
    rideId: ride.id,
    bookingId: booking.id,
    baggageSummary: describeBaggage(booking.baggage),
    baggagePending: booking.pendingBaggage.length > 0,
    meetingPoint: ride.meetingPoint,
  }));
}

export function toDeliveryHistory(d: DeliveryApi, rating?: DriverRating): DeliveryHistoryItem {
  return {
    id: d.id,
    code: d.deliveryKeyword ?? d.id.slice(0, 8).toUpperCase(),
    status: DELIVERY_STATUS[d.status],
    origin: d.pickupAddress ?? (d.ride ? `${d.ride.originCity}/${d.ride.originState}` : ''),
    destination: d.dropoffAddress ?? (d.ride ? `${d.ride.destinationCity}/${d.ride.destinationState}` : ''),
    date: d.ride ? fromBrazilLocal(d.ride.departureDate) : d.requestedAt,
    priceCents: toCents(d.price),
    size: d.size.toLowerCase() as PackageSize,
    description: d.description,
    fragile: d.fragile,
    recipientName: d.recipientName,
    driver: { id: d.ride?.driverSub ?? '', name: d.ride?.driverName ?? 'Motorista', vehicle: '' },
    rating,
    pickupCode: d.pickupCode,
    keyword: d.deliveryKeyword,
    companyId: d.companyId,
  };
}

export async function listDeliveries(): Promise<DeliveryHistoryItem[]> {
  const ratings = loadRatings();
  const items = await backend<DeliveryApi[]>('/api/deliveries/mine');
  return items.map((d) => toDeliveryHistory(d, ratings[`deliveries:${d.id}`]));
}

export async function rateDriver<T extends RideHistoryItem | DeliveryHistoryItem>(kind: HistoryKind, id: string, request: RateDriverRequest): Promise<T> {
  const ratings = loadRatings();
  const rating: DriverRating = { stars: request.stars, tags: request.tags ?? [], comment: request.comment, ratedAt: new Date().toISOString() };
  ratings[`${kind}:${id}`] = rating;
  try {
    localStorage.setItem(RATINGS_KEY, JSON.stringify(ratings));
  } catch {
    /* sem armazenamento */
  }
  const list = kind === 'rides' ? await listRides() : await listDeliveries();
  return list.find((item) => item.id === id) as T;
}

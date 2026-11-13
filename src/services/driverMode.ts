import type { RateDriverRequest } from '@/types/history';
import type { CnhSubmission, DriverAccount, DriverJob, DriverRoute, NewDriverRoute, RegionRequest, Vehicle, VehicleType } from '@/types/driverMode';
import type { PackageSize } from '@/types/delivery';
import { describeBaggage } from '@/features/ride/baggage/baggageTypes';
import { ApiError } from './api';
import { backend, fromBrazilLocal, toBrazilLocal, toCents, toReais } from './backend/client';
import type { AcceptAllApi, BookingApi, DeliveryApi, DriverApplicationApi, RideApi, UserMeApi, VehicleApi } from './backend/types';
import { getDrivingRoute } from './mapbox';

/** Modo motorista sobre o backend Raiji: cadastro (CNH real), veículos, rotas (caronas) e pedidos. */

// ------------------------------------------------------------------ conta e veículos

const TYPE_TO_API: Record<VehicleType, string> = { car: 'CARRO', van: 'VAN', motorcycle: 'MOTO' };
const typeFromApi = (t: string): VehicleType => (/moto/i.test(t) ? 'motorcycle' : /van/i.test(t) ? 'van' : 'car');

const toVehicle = (v: VehicleApi, index: number): Vehicle => ({
  id: v.id,
  type: typeFromApi(v.type),
  model: v.model,
  year: v.year ?? 0,
  color: v.color ?? '',
  plate: v.plate,
  seats: v.passengerSeats ?? 0,
  primary: index === 0,
});

export async function getDriverAccount(): Promise<DriverAccount> {
  const [me, application] = await Promise.all([
    backend<UserMeApi>('/api/users/me'),
    backend<DriverApplicationApi>('/api/users/me/driver/cnh').catch(() => null),
  ]);
  const approved = me.driver || application?.status === 'APPROVED';
  const vehicles = approved ? await backend<VehicleApi[]>('/api/vehicles').catch(() => [] as VehicleApi[]) : [];
  return {
    status: approved ? 'approved' : application?.status === 'PROCESSING' ? 'in_review' : 'none',
    cnh:
      approved && application?.categoria
        ? { number: '', category: application.categoria as never, expiresAt: application.validade ?? '', ear: false }
        : undefined,
    vehicles: vehicles.filter((v) => v.active).map(toVehicle),
    review: application && application.status !== 'NONE' ? { status: application.status, reason: application.reason } : undefined,
  };
}

/** Envia a CNH para a verificação automática (resposta em segundos; o app acompanha) */
export async function saveCnh({ image, securityCode }: CnhSubmission): Promise<DriverAccount> {
  const form = new FormData();
  form.append('image', image);
  form.append('securityCode', securityCode);
  await backend<DriverApplicationApi>('/api/users/me/driver/cnh', { method: 'POST', body: form });
  return getDriverAccount();
}

const vehicleBody = (v: Partial<Vehicle>) => ({
  plate: v.plate,
  type: v.type ? TYPE_TO_API[v.type] : undefined,
  model: v.model,
  color: v.color,
  year: v.year,
  passengerSeats: v.seats,
});

export async function addVehicle(vehicle: Partial<Vehicle>) {
  await backend<VehicleApi>('/api/vehicles', { method: 'POST', body: vehicleBody(vehicle) });
  return getDriverAccount();
}

export async function updateVehicle(id: string, changes: Partial<Vehicle>) {
  if (Object.keys(changes).length === 1 && changes.primary) return getDriverAccount(); // "principal" é o primeiro da lista
  const current = (await getDriverAccount()).vehicles.find((v) => v.id === id);
  await backend<VehicleApi>(`/api/vehicles/${id}`, { method: 'PUT', body: vehicleBody({ ...current, ...changes }) });
  return getDriverAccount();
}

export async function removeVehicle(id: string) {
  await backend<void>(`/api/vehicles/${id}`, { method: 'DELETE' });
  return getDriverAccount();
}

// ------------------------------------------------------------------ rotas (caronas publicadas)

const ROUTE_STATUS: Record<RideApi['status'], DriverRoute['status']> = {
  PLANNED: 'published',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'canceled',
};

export const toDriverRoute = (r: RideApi): DriverRoute => ({
  id: r.id,
  originCity: r.originCity,
  departurePoint: r.meetingPoint ?? r.originAddress ?? '',
  destinationCity: r.destinationCity,
  departureAt: fromBrazilLocal(r.departureDate),
  vehicleId: r.vehicleId,
  seats: r.totalSeats,
  seatsTaken: r.totalSeats - r.availableSeats,
  pricePerSeatCents: toCents(r.pricePerPassenger),
  acceptsPackages: r.type !== 'PASSENGER',
  status: ROUTE_STATUS[r.status],
  pricePerPackageCents: toCents(r.pricePerPackage),
  maxCargoKg: r.cargoDetails?.maxWeightKg ?? null,
  bookingsClosed: r.bookingsClosed,
  driverReceivesPerSeatCents: toCents(r.driverReceivesPerPassenger),
  private: r.visibility === 'PRIVATE',
});

export const listMyRides = (statuses: RideApi['status'][] = ['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']) =>
  backend<RideApi[]>('/api/rides/mine', { query: { status: statuses } });

export async function listDriverRoutes(): Promise<DriverRoute[]> {
  return (await listMyRides()).map(toDriverRoute);
}

/** UF do lugar (Mapbox); sem ela, tenta achar "- SP" no endereço */
export const stateOf = (place: { state?: string; address?: string }) =>
  place.state ?? /\b([A-Z]{2})\b/.exec(place.address ?? '')?.[1] ?? 'SP';

/**
 * Publica a carona com o caminho de verdade (Mapbox Directions): é ele que permite
 * achar passageiros e encomendas no meio do caminho.
 */
export async function publishRoute(route: Partial<NewDriverRoute> & { originState?: string; destinationState?: string }) {
  if (!route.origin || !route.destination || !route.departureAt || !route.vehicleId) {
    throw new ApiError('Preencha origem, destino, horário e veículo.', 400);
  }
  const directions = await getDrivingRoute(route.origin.coordinates, route.destination.coordinates).catch(() => null);
  const seats = route.seats ?? 0;
  const type = route.acceptsPackages ? (seats > 0 ? 'MIXED' : 'CARGO') : 'PASSENGER';
  const ride = await backend<RideApi>('/api/rides', {
    method: 'POST',
    body: {
      vehicleId: route.vehicleId,
      type,
      originCity: route.origin.city ?? route.origin.name,
      originState: route.originState ?? stateOf(route.origin),
      destinationCity: route.destination.city ?? route.destination.name,
      destinationState: route.destinationState ?? stateOf(route.destination),
      departureDate: toBrazilLocal(route.departureAt),
      pricePerPassenger: type === 'CARGO' ? null : toReais(route.pricePerSeatCents),
      pricePerPackage: type === 'PASSENGER' ? null : toReais(route.pricePerPackageCents ?? 0),
      totalSeats: type === 'CARGO' ? 0 : seats,
      cargoDetails: type === 'PASSENGER' ? null : { maxWeightKg: route.maxCargoKg ?? 30 },
      origin: { latitude: route.origin.coordinates[1], longitude: route.origin.coordinates[0], address: route.origin.address || route.origin.name },
      destination: {
        latitude: route.destination.coordinates[1],
        longitude: route.destination.coordinates[0],
        address: route.destination.address || route.destination.name,
      },
      route: directions?.geometry.coordinates.map(([lng, lat]) => ({ latitude: lat, longitude: lng })),
      meetingPoint: route.departurePoint || null,
    },
  });
  return toDriverRoute(ride);
}

export async function cancelRoute(id: string) {
  return toDriverRoute(await backend<RideApi>(`/api/rides/${id}/cancel`, { method: 'POST', body: {} }));
}

export const startRide = (id: string) => backend<RideApi>(`/api/rides/${id}/start`, { method: 'POST' }).then(toDriverRoute);
export const finishRide = (id: string) => backend<RideApi>(`/api/rides/${id}/finish`, { method: 'POST' }).then(toDriverRoute);
export const closeBookings = (id: string) => backend<RideApi>(`/api/rides/${id}/close-bookings`, { method: 'POST' }).then(toDriverRoute);
export const acceptAllRequests = (id: string) => backend<AcceptAllApi>(`/api/rides/${id}/requests/accept-all`, { method: 'POST' });
export const listRideBookings = (rideId: string) => backend<BookingApi[]>(`/api/rides/${rideId}/requests`);
export const listRideDeliveries = (rideId: string) => backend<DeliveryApi[]>(`/api/rides/${rideId}/deliveries`);
export const decideBaggageChange = (rideId: string, requestId: string, approve: boolean) =>
  backend<BookingApi>(`/api/rides/${rideId}/requests/${requestId}/baggage`, { method: 'PATCH', body: { decision: approve ? 'ACCEPT' : 'REJECT' } });
export const pickUpDelivery = (id: string, code: string) => backend<DeliveryApi>(`/api/deliveries/${id}/pickup`, { method: 'POST', body: { code } });
export const deliverDelivery = (id: string, code: string) => backend<DeliveryApi>(`/api/deliveries/${id}/deliver`, { method: 'POST', body: { code } });

// ------------------------------------------------------------------ pedidos e trabalhos

interface RideWork {
  ride: RideApi;
  bookings: BookingApi[];
  deliveries: DeliveryApi[];
}

/** Pedidos e encomendas de cada carona do motorista */
async function loadWork(statuses: RideApi['status'][]): Promise<RideWork[]> {
  const rides = await listMyRides(statuses);
  return Promise.all(
    rides.map(async (ride) => ({
      ride,
      bookings: ride.type === 'CARGO' ? [] : await listRideBookings(ride.id).catch(() => []),
      deliveries: ride.type === 'PASSENGER' ? [] : await listRideDeliveries(ride.id).catch(() => []),
    })),
  );
}

const when = (ride: RideApi): RegionRequest['when'] => {
  const at = fromBrazilLocal(ride.departureDate);
  return Date.parse(at) - Date.now() <= 60 * 60_000 ? { type: 'now' } : { type: 'scheduled', at };
};

const routeKm = (ride: RideApi) => (ride.routeDistanceMeters ?? 0) / 1000;
const net = (price: number | null, feePercent: number) => (price ? toCents(price * (1 - feePercent / 100)) : 0);

/** Pedidos esperando resposta nas minhas caronas (vagas, encomendas e mudanças de bagagem) */
export async function listRegionRequests(): Promise<RegionRequest[]> {
  const work = await loadWork(['PLANNED']);
  const out: RegionRequest[] = [];
  for (const { ride, bookings, deliveries } of work) {
    for (const b of bookings) {
      const isChange = b.status === 'CONFIRMED' && b.pendingBaggage.length > 0;
      if (b.status !== 'PENDING' && !isChange) continue;
      out.push({
        id: `ride:${ride.id}:${b.id}`,
        kind: 'ride',
        customerId: b.passengerSub,
        customerName: b.passengerName,
        customerRating: 0,
        origin: b.pickupAddress ?? ride.originCity,
        destination: b.dropoffAddress ?? ride.destinationCity,
        distanceKm: routeKm(ride),
        when: when(ride),
        earningsCents: net(b.price, ride.platformFeePercent),
        passengers: 1,
        status: 'open',
        rideId: ride.id,
        cargoSummary: isChange ? `Quer mudar a bagagem para: ${describeBaggage(b.pendingBaggage)}` : describeBaggage(b.baggage),
        segment: !b.fullRoute,
        baggageChange: isChange,
      });
    }
    for (const d of deliveries) {
      if (d.status !== 'PENDING') continue;
      out.push({
        id: `delivery:${ride.id}:${d.id}`,
        kind: 'delivery',
        customerId: d.senderSub,
        customerName: d.senderName ?? 'Remetente',
        customerRating: 0,
        origin: d.pickupAddress ?? ride.originCity,
        destination: d.dropoffAddress ?? ride.destinationCity,
        distanceKm: routeKm(ride),
        when: when(ride),
        earningsCents: toCents(d.driverReceives),
        packageSize: d.size.toLowerCase() as PackageSize,
        fragile: d.fragile,
        status: 'open',
        rideId: ride.id,
        cargoSummary: `${d.weightKg} kg · ${d.lengthCm}×${d.widthCm}×${d.heightCm} cm`,
        segment: !d.fullRoute,
      });
    }
  }
  return out;
}

export async function respondToRequest(id: string, action: 'accept' | 'reject') {
  const [kind, rideId, itemId] = id.split(':');
  if (kind === 'ride') {
    const booking = (await listRideBookings(rideId)).find((b) => b.id === itemId);
    if (booking?.status === 'CONFIRMED' && booking.pendingBaggage.length > 0) {
      await decideBaggageChange(rideId, itemId, action === 'accept');
    } else {
      await backend(`/api/rides/${rideId}/requests/${itemId}`, {
        method: 'PATCH',
        body: action === 'accept' ? { decision: 'ACCEPT' } : { decision: 'REJECT', reason: 'Recusado pelo motorista.' },
      });
    }
  } else {
    await backend(`/api/rides/${rideId}/deliveries/${itemId}`, {
      method: 'PATCH',
      body: action === 'accept' ? { decision: 'ACCEPT' } : { decision: 'REJECT', reason: 'Recusado pelo motorista.' },
    });
  }
  return { request: { id, status: action === 'accept' ? 'accepted' : 'rejected' } as RegionRequest };
}

// Avaliações de clientes ainda não existem no backend: ficam neste aparelho
const RATINGS_KEY = 'raiji.customerRatings';
const loadRatings = (): Record<string, DriverJob['customerRating']> => {
  try {
    return JSON.parse(localStorage.getItem(RATINGS_KEY) ?? '{}');
  } catch {
    return {};
  }
};

/** Corridas e encomendas aceitas (e concluídas) nas minhas caronas */
export async function listDriverJobs(): Promise<DriverJob[]> {
  const ratings = loadRatings();
  const work = await loadWork(['PLANNED', 'IN_PROGRESS', 'COMPLETED']);
  const jobs: DriverJob[] = [];
  for (const { ride, bookings, deliveries } of work) {
    const date = fromBrazilLocal(ride.departureDate);
    for (const b of bookings) {
      if (b.status !== 'CONFIRMED' && b.status !== 'COMPLETED') continue;
      const id = `ride:${ride.id}:${b.id}`;
      jobs.push({
        id,
        kind: 'ride',
        customerId: b.passengerSub,
        customerName: b.passengerName,
        origin: b.pickupAddress ?? ride.originCity,
        destination: b.dropoffAddress ?? ride.destinationCity,
        date,
        earningsCents: net(b.price, ride.platformFeePercent),
        status: b.status === 'COMPLETED' ? 'completed' : ride.status === 'IN_PROGRESS' ? 'in_progress' : 'accepted',
        customerRating: ratings[id],
        rideId: ride.id,
      });
    }
    for (const d of deliveries) {
      if (d.status === 'PENDING' || d.status === 'CANCELLED') continue;
      const id = `delivery:${ride.id}:${d.id}`;
      jobs.push({
        id,
        kind: 'delivery',
        customerId: d.senderSub,
        customerName: d.senderName ?? 'Remetente',
        origin: d.pickupAddress ?? ride.originCity,
        destination: d.dropoffAddress ?? ride.destinationCity,
        date,
        earningsCents: toCents(d.driverReceives),
        status: d.status === 'DELIVERED' ? 'completed' : d.status === 'IN_TRANSIT' ? 'in_progress' : 'accepted',
        customerRating: ratings[id],
        rideId: ride.id,
        deliveryStatus: d.status,
      });
    }
  }
  return jobs.sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
}

export async function rateCustomer(id: string, rating: RateDriverRequest): Promise<DriverJob> {
  const ratings = loadRatings();
  ratings[id] = { stars: rating.stars, tags: rating.tags ?? [], comment: rating.comment, ratedAt: new Date().toISOString() };
  try {
    localStorage.setItem(RATINGS_KEY, JSON.stringify(ratings));
  } catch {
    /* sem armazenamento */
  }
  const job = (await listDriverJobs()).find((j) => j.id === id);
  if (!job) throw new ApiError('Não encontrado.', 404);
  return job;
}

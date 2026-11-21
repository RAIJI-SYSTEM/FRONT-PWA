import type { RideApi } from '@/services/backend/types';
import type { LngLat } from '@/types/place';
import type { TripPoint } from './components/TripMap';

const coord = (lat: number | null | undefined, lng: number | null | undefined): LngLat | null =>
  lat == null || lng == null ? null : [lng, lat];

export const rideStart = (ride: RideApi) => coord(ride.originLatitude, ride.originLongitude);
export const rideEnd = (ride: RideApi) => coord(ride.destinationLatitude, ride.destinationLongitude);
export const pointOf = coord;

const same = (a: LngLat | null, b: LngLat | null) => !!a && !!b && Math.abs(a[0] - b[0]) < 1e-5 && Math.abs(a[1] - b[1]) < 1e-5;

/**
 * Pontos de uma vaga: embarque e desembarque do passageiro (sem trecho = os do motorista),
 * mais a saída e a chegada do motorista quando forem outros lugares.
 */
export function bookingPoints(ride: RideApi, pickup: LngLat | null, dropoff: LngLat | null) {
  const start = rideStart(ride);
  const end = rideEnd(ride);
  const embark = pickup ?? start;
  const leave = dropoff ?? end;
  const points: TripPoint[] = [];
  if (start && !same(start, embark)) points.push({ at: start, label: 'Saída do motorista', kind: 'driver' });
  if (end && !same(end, leave)) points.push({ at: end, label: 'Chegada do motorista', kind: 'driver' });
  if (embark) points.push({ at: embark, label: 'Embarque', kind: 'pickup' });
  if (leave) points.push({ at: leave, label: 'Desembarque', kind: 'dropoff' });
  return { points, embark };
}

/** Trajeto do backend ({latitude, longitude}) no formato do mapa */
export const routeLine = (route: { latitude: number; longitude: number }[] | undefined): LngLat[] =>
  (route ?? []).map((p) => [p.longitude, p.latitude]);

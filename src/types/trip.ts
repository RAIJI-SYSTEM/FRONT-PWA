export type TripStatus = 'scheduled' | 'driver_on_the_way' | 'in_progress' | 'finished' | 'canceled';

export interface Trip {
  kind: 'trip';
  id: string;
  status: TripStatus;
  origin: string;
  destination: string;
  scheduledAt: string; // ISO 8601
  driverName?: string;
  vehicle?: string;
}

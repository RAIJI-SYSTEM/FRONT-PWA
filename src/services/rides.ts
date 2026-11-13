import { backend } from './backend/client';
import type { BaggageItemApi, BookingApi, MyBookingApi, PriceBreakdownApi, RideApi } from './backend/types';

/** Pedidos de vaga e "minhas viagens" do passageiro (backend Raiji). */

export interface PlaceInput {
  latitude: number;
  longitude: number;
  address?: string;
}

export const requestSeat = (
  rideId: string,
  body: { passengerName: string; baggage: BaggageItemApi[]; pickup?: PlaceInput; dropoff?: PlaceInput },
) => backend<BookingApi>(`/api/rides/${rideId}/requests`, { method: 'POST', body });

export const listMyBookings = () => backend<MyBookingApi[]>('/api/rides/bookings/mine');

export const getRide = (rideId: string) => backend<{ ride: RideApi; route: { latitude: number; longitude: number }[] }>(`/api/rides/${rideId}`);

/** Troca a bagagem (vazia = sem bagagem). Depois do aceite, aumentar a carga espera o motorista aprovar. */
export const updateBaggage = (rideId: string, requestId: string, baggage: BaggageItemApi[]) =>
  backend<BookingApi>(`/api/rides/${rideId}/requests/${requestId}/baggage`, { method: 'PUT', body: { baggage } });

export const cancelBooking = (rideId: string, requestId: string, reason?: string) =>
  backend<unknown>(`/api/rides/${rideId}/requests/${requestId}`, { method: 'DELETE', body: { reason: reason ?? null } });

/** Quanto fica com a plataforma e quanto o motorista recebe (tela de publicar) */
export const previewPrice = (price: number) => backend<PriceBreakdownApi>('/api/rides/price-preview', { query: { price } });

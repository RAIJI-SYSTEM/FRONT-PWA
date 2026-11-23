import type { PackageDetails } from '@/types/delivery';
import type { Place } from '@/types/place';
import { backend, toBrazilLocal, toReais } from './backend/client';
import type { BoardApi, BoardKindApi, BoardOfferApi } from './backend/types';
import { stateOf } from './driverMode';

/**
 * Mural da região: pedidos para DEPOIS (mais de 1h) que os motoristas perto, ou com carona no
 * caminho, veem. O motorista oferece um valor e o dono do pedido escolhe.
 */
export const BOARD_MIN_MINUTES = 60;

const toBoardPlace = (p: Place) => ({
  city: p.city ?? p.name,
  state: stateOf(p),
  latitude: p.coordinates[1],
  longitude: p.coordinates[0],
  address: (p.address ? `${p.name}, ${p.address}` : p.name).slice(0, 255),
});

interface PublishInput {
  kind: BoardKindApi;
  origin: Place;
  destination: Place;
  /** ISO 8601 */
  at: string;
  details?: PackageDetails;
  companyId?: string | null;
}

export const publishOnBoard = ({ kind, origin, destination, at, details, companyId }: PublishInput) =>
  backend<BoardApi>('/api/board', {
    method: 'POST',
    body: {
      kind,
      origin: toBoardPlace(origin),
      destination: toBoardPlace(destination),
      desiredAt: toBrazilLocal(at),
      pkg: details && {
        size: details.size.toUpperCase(),
        description: details.description,
        weightKg: details.weightKg,
        fragile: details.fragile,
        declaredValue: details.declaredValueCents ? toReais(details.declaredValueCents) : null,
        recipientName: details.recipientName,
        recipientPhone: details.recipientPhone,
      },
      companyId: companyId ?? null,
      notes: details?.notes ?? null,
    },
  });

// Dono do pedido
export const listMyBoard = () => backend<BoardApi[]>('/api/board/mine');
export const getBoard = (id: string) => backend<BoardApi>(`/api/board/${id}`);
export const listBoardOffers = (id: string) => backend<BoardOfferApi[]>(`/api/board/${id}/offers`);
export const acceptBoardOffer = (id: string, offerId: string) =>
  backend<BoardApi>(`/api/board/${id}/offers/${offerId}/accept`, { method: 'POST' });
export const cancelBoard = (id: string) => backend<BoardApi>(`/api/board/${id}/cancel`, { method: 'POST' });

// Motorista
export const listBoardRegion = (position: { lat: number; lng: number } | null) =>
  backend<BoardApi[]>('/api/board/region', { query: { lat: position?.lat, lng: position?.lng } });
export const listBoardOffered = () => backend<BoardApi[]>('/api/board/offered');
export const offerOnBoard = (id: string, offer: { price: number; rideId?: string; vehicleId?: string; message?: string }) =>
  backend<BoardOfferApi>(`/api/board/${id}/offers`, { method: 'POST', body: offer });
export const withdrawBoardOffer = (id: string, offerId: string) =>
  backend<void>(`/api/board/${id}/offers/${offerId}`, { method: 'DELETE' });

import { backend, fromBrazilLocal, toBrazilLocal } from './backend/client';
import type { RideApi } from './backend/types';

/** Viagens publicadas que ainda aceitam pedidos (públicas, futuras, com reservas abertas) */
const isOpen = (ride: RideApi) =>
  ride.visibility === 'PUBLIC' && !ride.bookingsClosed && Date.parse(fromBrazilLocal(ride.departureDate)) > Date.now();

/**
 * Viagens publicadas saindo de uma cidade (e indo para outra, se informada), opcionalmente num dia
 * ("2026-11-21"). Busca pelo nome da cidade no backend.
 */
export async function searchTrips(from: string, to?: string, date?: string) {
  const start = date ? new Date(`${date}T00:00:00`) : new Date();
  const end = date ? new Date(`${date}T23:59:59`) : undefined;
  const page = await backend<{ content: RideApi[] }>('/api/rides', {
    query: {
      originCity: from,
      destinationCity: to || undefined,
      departureFrom: toBrazilLocal(start),
      departureTo: end ? toBrazilLocal(end) : undefined,
      size: 50,
    },
  });
  return page.content.filter(isOpen);
}

export interface DriverByCode {
  driverSub: string;
  driverName: string | null;
  code: string;
  rides: RideApi[];
}

/** Motorista pelo código de 8 dígitos, com as próximas viagens públicas dele */
export async function findDriverByCode(code: string): Promise<DriverByCode> {
  const found = await backend<DriverByCode>(`/api/rides/drivers/by-code/${code}`);
  return { ...found, rides: found.rides.filter(isOpen) };
}

/** Código do próprio motorista, para divulgar aos passageiros */
export const getMyDriverCode = () => backend<{ code: string }>('/api/rides/drivers/me/code');

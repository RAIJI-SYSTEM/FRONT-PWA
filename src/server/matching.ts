/**
 * SIMULAÇÃO compartilhada entre viagens e encomendas: sorteia motoristas fictícios
 * e define o preço mínimo. Em produção, isso é responsabilidade do backend real.
 */
import type { Place } from '@/types/place';
import type { RideOffer } from '@/types/ride';
import { distanceKm } from '@/utils/geo';

/** Tempo simulado até um motorista responder */
export const MATCHING_DELAY_MS = 12_000;
/** Chance simulada de ninguém aceitar */
const NO_DRIVER_CHANCE = 0.15;

const BASE_FARE_CENTS = 500;
const PER_KM_CENTS = 210;

const DRIVERS: Omit<RideOffer, 'id' | 'priceCents' | 'etaMinutes'>[] = [
  { driverName: 'Carlos Souza', driverRating: 4.9, vehicle: 'Onix prata · ABC1D23', providerType: 'mei' },
  { driverName: 'Ana Ribeiro', driverRating: 4.8, vehicle: 'HB20 branco · QWE4R56', providerType: 'autonomo' },
  { driverName: 'Transportes Lima', driverRating: 4.7, vehicle: 'Spin preta · RTY7U89', providerType: 'cnpj' },
  { driverName: 'Marcos Alves', driverRating: 4.6, vehicle: 'Corolla cinza · ZXC0V12', providerType: 'mei' },
];

export function isIntermunicipal(origin: Place, destination: Place) {
  return Boolean(origin.city && destination.city && origin.city !== destination.city);
}

interface MatchOptions {
  intermunicipal: boolean;
  /** Multiplicador do preço (ex.: tamanho da encomenda) */
  priceMultiplier?: number;
}

/** "Procurar motorista" + "Definir preço mínimo" (tarifa base + valor por km) */
export function matchDrivers(origin: Place, destination: Place, { intermunicipal, priceMultiplier = 1 }: MatchOptions) {
  if (Math.random() < NO_DRIVER_CHANCE) return [];

  // "Filtrar prestadores com CNPJ/MEI" quando a rota é intermunicipal
  const eligible = intermunicipal ? DRIVERS.filter((d) => d.providerType !== 'autonomo') : DRIVERS;
  const km = distanceKm(origin.coordinates, destination.coordinates);
  const minimum = Math.round((BASE_FARE_CENTS + km * PER_KM_CENTS) * priceMultiplier);

  return eligible
    .slice(0, 1 + Math.floor(Math.random() * eligible.length))
    .map(
      (driver, index): RideOffer => ({
        ...driver,
        id: crypto.randomUUID(),
        priceCents: minimum + index * 150,
        etaMinutes: 3 + Math.floor(Math.random() * 10),
      }),
    )
    .sort((a, b) => a.priceCents - b.priceCents);
}

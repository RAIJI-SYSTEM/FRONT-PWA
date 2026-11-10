/**
 * SIMULAÇÃO da busca de motoristas e viagens entre cidades.
 * Em produção: banco com índice por cidade (ou geográfico), código único por motorista
 * e viagens publicadas pelos próprios motoristas.
 */
import 'server-only';
import type { DriverProfile, DriverService, PersonType, PublicTrip } from '@/types/drivers';
import { DRIVER_CODE_LENGTH } from '@/types/drivers';
import { normalize } from '@/utils/text';
import { listPublishedTrips } from './driverMode';

const D = (p: DriverProfile) => p;

const DRIVERS: DriverProfile[] = [
  D({ id: 'carlos', code: '48213759', name: 'Carlos Souza', personType: 'pj', companyKind: 'MEI', vehicle: 'Onix prata · ABC1D23', rating: 4.9, tripsCount: 1284, city: 'São Paulo', servesCities: ['Guarulhos', 'Osasco'], services: ['rides', 'deliveries'], verified: true, memberSince: '2023-03-10' }),
  D({ id: 'ana', code: '73019462', name: 'Ana Ribeiro', personType: 'pf', vehicle: 'HB20 branco · QWE4R56', rating: 4.8, tripsCount: 642, city: 'São Paulo', servesCities: [], services: ['rides'], verified: true, memberSince: '2024-01-22' }),
  D({ id: 'lima', code: '15583020', name: 'Transportes Lima', personType: 'pj', companyKind: 'Empresa', vehicle: 'Spin preta · RTY7U89', rating: 4.7, tripsCount: 3910, city: 'São Paulo', servesCities: ['Campinas', 'Santos', 'Guarulhos'], services: ['rides', 'deliveries'], verified: true, memberSince: '2022-08-01' }),
  D({ id: 'marcos', code: '90274415', name: 'Marcos Alves', personType: 'pj', companyKind: 'MEI', vehicle: 'Corolla cinza · ZXC0V12', rating: 4.6, tripsCount: 517, city: 'Campinas', servesCities: ['São Paulo'], services: ['rides'], verified: true, memberSince: '2024-06-15' }),
  D({ id: 'rafa', code: '62841907', name: 'Rafael Costa', personType: 'pf', vehicle: 'Fiorino branca · JKL3M45', rating: 4.5, tripsCount: 230, city: 'Guarulhos', servesCities: ['São Paulo'], services: ['deliveries'], verified: false, memberSince: '2025-09-03' }),
  D({ id: 'julia', code: '30958216', name: 'Júlia Martins', personType: 'pf', vehicle: 'Kwid laranja · MNB7C89', rating: 4.95, tripsCount: 388, city: 'Santos', servesCities: ['São Paulo'], services: ['rides'], verified: true, memberSince: '2024-11-30' }),
  D({ id: 'rota', code: '84470531', name: 'Rota Sul Logística', personType: 'pj', companyKind: 'Empresa', vehicle: 'Master branca · VBN2X34', rating: 4.4, tripsCount: 5120, city: 'Rio de Janeiro', servesCities: ['São Paulo'], services: ['deliveries'], verified: true, memberSince: '2021-05-18' }),
  D({ id: 'pedro', code: '51729384', name: 'Pedro Henrique', personType: 'pf', vehicle: 'Gol vermelho · TYU6P78', rating: 4.3, tripsCount: 96, city: 'São Paulo', servesCities: [], services: ['rides', 'deliveries'], verified: false, memberSince: '2026-02-11' }),
];

const byId = (id: string) => DRIVERS.find((d) => d.id === id)!;

/** Saída daqui a N dias, no horário dado */
const inDays = (days: number, hour: number, minute = 0) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
};

const TRIPS: PublicTrip[] = [
  { id: 't1', originCity: 'São Paulo', destinationCity: 'Campinas', departurePoint: 'Metrô Barra Funda', departureAt: inDays(0, 18, 30), seatsAvailable: 2, pricePerSeatCents: 4500, acceptsPackages: true, driver: byId('marcos') },
  { id: 't2', originCity: 'São Paulo', destinationCity: 'Campinas', departurePoint: 'Av. Paulista, 1000', departureAt: inDays(1, 7), seatsAvailable: 3, pricePerSeatCents: 4200, acceptsPackages: false, driver: byId('lima') },
  { id: 't3', originCity: 'Campinas', destinationCity: 'São Paulo', departurePoint: 'Rodoviária de Campinas', departureAt: inDays(1, 17), seatsAvailable: 1, pricePerSeatCents: 4800, acceptsPackages: true, driver: byId('marcos') },
  { id: 't4', originCity: 'São Paulo', destinationCity: 'Santos', departurePoint: 'Metrô Jabaquara', departureAt: inDays(2, 8, 15), seatsAvailable: 3, pricePerSeatCents: 3900, acceptsPackages: true, driver: byId('julia') },
  { id: 't5', originCity: 'Santos', destinationCity: 'São Paulo', departurePoint: 'Praça da Independência', departureAt: inDays(3, 19), seatsAvailable: 2, pricePerSeatCents: 3900, acceptsPackages: false, driver: byId('julia') },
  { id: 't6', originCity: 'São Paulo', destinationCity: 'Rio de Janeiro', departurePoint: 'Rodoviária Tietê', departureAt: inDays(4, 6), seatsAvailable: 0, pricePerSeatCents: 12900, acceptsPackages: true, driver: byId('rota') },
  { id: 't7', originCity: 'São Paulo', destinationCity: 'Campinas', departurePoint: 'Shopping Eldorado', departureAt: inDays(5, 12), seatsAvailable: 4, pricePerSeatCents: 3800, acceptsPackages: true, driver: byId('lima') },
];

const sameCity = (a: string, b: string) => normalize(a) === normalize(b);

/** Motoristas com base na cidade ou que atendem nela */
export function listDriversInCity(city: string, filters: { personType?: PersonType; service?: DriverService }) {
  return DRIVERS.filter(
    (d) =>
      (sameCity(d.city, city) || d.servesCities.some((c) => sameCity(c, city))) &&
      (!filters.personType || d.personType === filters.personType) &&
      (!filters.service || d.services.includes(filters.service)),
  ).sort((a, b) => Number(sameCity(b.city, city)) - Number(sameCity(a.city, city)) || b.rating - a.rating);
}

type CodeLookup = { ok: true; driver: DriverProfile } | { ok: false; status: 400 | 404; error: string };

/** Aceita "4821-3759", "4821 3759" etc.: só os dígitos importam */
export function findDriverByCode(raw: string): CodeLookup {
  const code = raw.replace(/\D/g, '');
  if (code.length !== DRIVER_CODE_LENGTH) return { ok: false, status: 400, error: 'O código tem 8 dígitos.' };
  const driver = DRIVERS.find((d) => d.code === code);
  return driver ? { ok: true, driver } : { ok: false, status: 404, error: 'Nenhum motorista com esse código.' };
}

/** Viagens futuras entre duas cidades; `date` (AAAA-MM-DD) opcional filtra o dia */
export function searchTrips(from: string, to: string, date?: string) {
  const now = Date.now();
  // Viagens de exemplo + rotas publicadas no modo motorista
  return [...TRIPS, ...listPublishedTrips()].filter(
    (t) =>
      sameCity(t.originCity, from) &&
      sameCity(t.destinationCity, to) &&
      Date.parse(t.departureAt) > now &&
      (!date || t.departureAt.slice(0, 10) === date || new Date(t.departureAt).toLocaleDateString('sv-SE') === date),
  ).sort((a, b) => Date.parse(a.departureAt) - Date.parse(b.departureAt));
}

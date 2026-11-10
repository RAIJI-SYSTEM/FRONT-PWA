/** Pessoa física (autônomo) ou jurídica (MEI ou empresa) */
export type PersonType = 'pf' | 'pj';

export type DriverService = 'rides' | 'deliveries';

export interface DriverProfile {
  id: string;
  /** Código amigável de 8 dígitos, para encontrar o motorista (ex.: "48213759") */
  code: string;
  name: string;
  personType: PersonType;
  /** Pessoa jurídica: "MEI" ou "Empresa" */
  companyKind?: 'MEI' | 'Empresa';
  vehicle: string;
  rating: number;
  tripsCount: number;
  /** Cidade-base */
  city: string;
  /** Cidades onde também atende */
  servesCities: string[];
  services: DriverService[];
  verified: boolean;
  memberSince: string; // ISO 8601
}

/** Viagem publicada por um motorista entre duas cidades, com lugares à venda */
export interface PublicTrip {
  id: string;
  originCity: string;
  destinationCity: string;
  /** Ponto de encontro/saída */
  departurePoint: string;
  departureAt: string; // ISO 8601
  seatsAvailable: number;
  /** Preço por lugar, em centavos */
  pricePerSeatCents: number;
  /** Aceita levar encomendas no porta-malas */
  acceptsPackages: boolean;
  driver: DriverProfile;
}

/** "48213759" → "4821-3759" (mais fácil de ler e ditar) */
export const formatDriverCode = (code: string) => (code.length === 8 ? `${code.slice(0, 4)}-${code.slice(4)}` : code);

export const DRIVER_CODE_LENGTH = 8;

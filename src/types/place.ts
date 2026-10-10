/** Longitude e latitude, nessa ordem (padrão do Mapbox/GeoJSON) */
export type LngLat = [number, number];

export interface Place {
  id: string;
  name: string;
  address: string;
  /** Município, usado para saber se a rota é intermunicipal */
  city?: string;
  coordinates: LngLat;
}

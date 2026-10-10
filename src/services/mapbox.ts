import type { LngLat, Place } from '@/types/place';

export const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? '';

interface GeocodingFeature {
  id: string;
  geometry: { coordinates: LngLat };
  properties: {
    name: string;
    full_address?: string;
    place_formatted?: string;
    context?: { place?: { name: string } };
  };
}

/** Autocomplete de endereços (Mapbox Geocoding API v6), limitado ao Brasil */
export async function searchPlaces(query: string, proximity?: LngLat, signal?: AbortSignal): Promise<Place[]> {
  if (!MAPBOX_TOKEN || query.trim().length < 3) return [];

  const params = new URLSearchParams({
    q: query,
    access_token: MAPBOX_TOKEN,
    country: 'br',
    language: 'pt',
    autocomplete: 'true',
    limit: '6',
  });
  if (proximity) params.set('proximity', proximity.join(','));

  const response = await fetch(`https://api.mapbox.com/search/geocode/v6/forward?${params}`, { signal });
  if (!response.ok) throw new Error('Falha ao buscar endereços.');
  const data: { features: GeocodingFeature[] } = await response.json();

  return data.features.map(toPlace);
}

/** Endereço do ponto escolhido no mapa (Mapbox Geocoding API v6, busca reversa) */
export async function reverseGeocode([lng, lat]: LngLat, signal?: AbortSignal): Promise<Place> {
  const fallback: Place = { id: `${lng},${lat}`, name: 'Local no mapa', address: '', coordinates: [lng, lat] };
  if (!MAPBOX_TOKEN) return fallback;

  const params = new URLSearchParams({
    longitude: String(lng),
    latitude: String(lat),
    access_token: MAPBOX_TOKEN,
    language: 'pt',
    types: 'address,street,neighborhood,place',
    limit: '1',
  });
  const response = await fetch(`https://api.mapbox.com/search/geocode/v6/reverse?${params}`, { signal });
  if (!response.ok) return fallback;
  const data: { features: GeocodingFeature[] } = await response.json();
  const feature = data.features[0];
  // Mantém a coordenada exata do pino, não a do endereço encontrado
  return feature ? { ...toPlace(feature), coordinates: [lng, lat] } : fallback;
}

function toPlace({ id, geometry, properties }: GeocodingFeature): Place {
  return {
    id,
    name: properties.name,
    address: properties.place_formatted ?? properties.full_address ?? '',
    city: properties.context?.place?.name,
    coordinates: geometry.coordinates,
  };
}

export interface DrivingRoute {
  geometry: { type: 'LineString'; coordinates: LngLat[] };
  distanceMeters: number;
  durationSeconds: number;
}

/** Trajeto de carro entre dois pontos (Mapbox Directions API) para desenhar no mapa */
export async function getDrivingRoute(from: LngLat, to: LngLat, signal?: AbortSignal): Promise<DrivingRoute | null> {
  if (!MAPBOX_TOKEN) return null;

  const coordinates = `${from.join(',')};${to.join(',')}`;
  const params = new URLSearchParams({ access_token: MAPBOX_TOKEN, geometries: 'geojson', overview: 'full' });
  const response = await fetch(`https://api.mapbox.com/directions/v5/mapbox/driving/${coordinates}?${params}`, { signal });
  if (!response.ok) return null;

  const data = await response.json();
  const route = data.routes?.[0];
  return route ? { geometry: route.geometry, distanceMeters: route.distance, durationSeconds: route.duration } : null;
}

'use client';

import 'mapbox-gl/dist/mapbox-gl.css';
import { useEffect, useRef, useState } from 'react';
import type { Map as MapboxMap, Marker } from 'mapbox-gl';
import { MapPinOff, Navigation } from 'lucide-react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useColorScheme } from '@mui/material/styles';
import { MAPBOX_TOKEN } from '@/services/mapbox';
import type { LngLat } from '@/types/place';

const STYLES = { light: 'mapbox://styles/mapbox/streets-v12', dark: 'mapbox://styles/mapbox/dark-v11' };
const ROUTE_SOURCE = 'trip-route';
const DRIVER_COLOR = '#64748B';
const DROPOFF_COLOR = '#0F172A';

/** Um ponto marcado no mapa: saída/chegada do motorista ou embarque/desembarque de alguém */
export interface TripPoint {
  at: LngLat;
  label: string;
  kind: 'driver' | 'pickup' | 'dropoff';
}

const primaryColor = () =>
  getComputedStyle(document.documentElement).getPropertyValue('--mui-palette-primary-main').trim() || '#EF6C00';

const colorOf = (kind: TripPoint['kind']) => (kind === 'pickup' ? primaryColor() : kind === 'dropoff' ? DROPOFF_COLOR : DRIVER_COLOR);

/** Marcador com o nome do ponto ("Embarque", "Saída do motorista"...) */
function markerElement(point: TripPoint) {
  const el = document.createElement('div');
  const color = colorOf(point.kind);
  const small = point.kind === 'driver';
  el.style.cssText = 'display:flex;flex-direction:column;align-items:center;transform:translateY(-50%);pointer-events:none';
  const label = document.createElement('div');
  label.textContent = point.label;
  label.style.cssText = `background:${color};color:#fff;font:600 11px/1.2 Outfit,system-ui,sans-serif;padding:3px 8px;border-radius:999px;white-space:nowrap;box-shadow:0 1px 4px rgba(0,0,0,.3);margin-bottom:3px;${small ? 'opacity:.85' : ''}`;
  const dot = document.createElement('div');
  const size = small ? 10 : 14;
  dot.style.cssText = `width:${size}px;height:${size}px;border-radius:50%;background:${color};border:3px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.35)`;
  el.append(label, dot);
  return el;
}

/** Link de navegação (Google Maps abre no app do celular, se instalado) */
export const directionsUrl = ([lng, lat]: LngLat) => `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

interface TripMapProps {
  /** Linha do trajeto do motorista */
  route?: LngLat[];
  points: TripPoint[];
  height?: number;
  /** Mostra "Como chegar" até este ponto (ex.: o embarque) */
  navigateTo?: { at: LngLat; label: string };
}

/**
 * Mapa compacto das telas de detalhe: o trajeto do motorista e os pontos exatos de embarque
 * e desembarque. Dá para aproximar e arrastar; com dois dedos no celular, para não prender a
 * rolagem da página.
 */
export default function TripMap({ route, points, height = 220, navigateTo }: TripMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapboxMap | null>(null);
  const mapboxRef = useRef<typeof import('mapbox-gl').default | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const [ready, setReady] = useState(false);
  const { mode, systemMode } = useColorScheme();
  const scheme: keyof typeof STYLES = (mode === 'system' ? systemMode : mode) === 'dark' ? 'dark' : 'light';
  const schemeRef = useRef(scheme);

  useEffect(() => {
    if (!MAPBOX_TOKEN || !containerRef.current) return;
    let canceled = false;
    import('mapbox-gl').then(({ default: mapboxgl }) => {
      if (canceled || !containerRef.current) return;
      mapboxRef.current = mapboxgl;
      const map = new mapboxgl.Map({
        container: containerRef.current,
        accessToken: MAPBOX_TOKEN,
        style: STYLES[schemeRef.current],
        center: [-46.6333, -23.5505],
        zoom: 10,
        cooperativeGestures: true,
        dragRotate: false,
        pitchWithRotate: false,
        attributionControl: false,
      });
      map.addControl(new mapboxgl.AttributionControl({ compact: true }));
      map.on('style.load', () => setReady(true));
      mapRef.current = map;
    });
    return () => {
      canceled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (schemeRef.current === scheme) return;
    schemeRef.current = scheme;
    if (!mapRef.current) return;
    setReady(false);
    mapRef.current.setStyle(STYLES[scheme]);
  }, [scheme]);

  // Comparação por conteúdo: as telas recriam os arrays a cada renderização
  const pointsKey = JSON.stringify(points);
  const routeKey = JSON.stringify(route ?? []);

  useEffect(() => {
    const map = mapRef.current;
    const mapboxgl = mapboxRef.current;
    if (!map || !mapboxgl || !ready) return;
    const pts: TripPoint[] = JSON.parse(pointsKey);
    const line: LngLat[] = JSON.parse(routeKey);

    markersRef.current.forEach((m) => m.remove());
    // Motorista embaixo; embarque/desembarque por cima
    markersRef.current = [...pts]
      .sort((a, b) => (a.kind === 'driver' ? -1 : 0) - (b.kind === 'driver' ? -1 : 0))
      .map((p) => new mapboxgl.Marker({ element: markerElement(p), anchor: 'bottom' }).setLngLat(p.at).addTo(map));

    const data = { type: 'Feature' as const, properties: {}, geometry: { type: 'LineString' as const, coordinates: line } };
    const source = map.getSource(ROUTE_SOURCE) as import('mapbox-gl').GeoJSONSource | undefined;
    if (source) source.setData(data);
    else {
      map.addSource(ROUTE_SOURCE, { type: 'geojson', data });
      map.addLayer({
        id: ROUTE_SOURCE,
        type: 'line',
        source: ROUTE_SOURCE,
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: { 'line-color': primaryColor(), 'line-width': 4, 'line-opacity': 0.75 },
      });
    }

    const all = [...line, ...pts.map((p) => p.at)];
    if (all.length === 0) return;
    const bounds = new mapboxgl.LngLatBounds(all[0], all[0]);
    all.forEach((p) => bounds.extend(p));
    map.fitBounds(bounds, { padding: { top: 48, bottom: 24, left: 32, right: 32 }, maxZoom: 15, duration: 0 });
  }, [pointsKey, routeKey, ready]);

  return (
    <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
      <Box sx={{ position: 'relative', height }}>
        {MAPBOX_TOKEN ? (
          <Box ref={containerRef} sx={{ position: 'absolute', inset: 0 }} />
        ) : (
          <Stack sx={{ position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center', color: 'text.secondary', bgcolor: 'action.hover' }}>
            <MapPinOff size={28} />
            <Typography variant="caption">Mapa indisponível</Typography>
          </Stack>
        )}
      </Box>
      {navigateTo && (
        <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', gap: 1, px: 2, py: 1.25 }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="caption" color="text.secondary">
              Embarque
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
              {navigateTo.label}
            </Typography>
          </Box>
          <Button
            component="a"
            href={directionsUrl(navigateTo.at)}
            target="_blank"
            rel="noopener noreferrer"
            size="small"
            variant="outlined"
            startIcon={<Navigation size={16} />}
            sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 600, flexShrink: 0 }}
          >
            Como chegar
          </Button>
        </Stack>
      )}
    </Paper>
  );
}

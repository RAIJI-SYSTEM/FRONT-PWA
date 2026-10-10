'use client';

import 'mapbox-gl/dist/mapbox-gl.css';
import { useEffect, useRef, useState } from 'react';
import type { GeoJSONSource, Map as MapboxMap, Marker } from 'mapbox-gl';
import { LocateFixed, MapPin, MapPinOff, Minus, Plus } from 'lucide-react';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { useColorScheme } from '@mui/material/styles';
import { MAPBOX_TOKEN } from '@/services/mapbox';
import type { LngLat } from '@/types/place';

const DEFAULT_CENTER: LngLat = [-46.6333, -23.5505]; // São Paulo
const STYLES = {
  light: 'mapbox://styles/mapbox/streets-v12',
  dark: 'mapbox://styles/mapbox/dark-v11',
};
type Scheme = keyof typeof STYLES;
const ROUTE_LAYER = 'route';
const ORIGIN_COLOR = '#64748B';

export type PickTarget = 'origin' | 'destination';

export interface MapPadding {
  top: number;
  bottom: number;
}

interface RideMapProps {
  origin?: LngLat;
  destination?: LngLat;
  route?: LngLat[];
  /** Ponto sendo escolhido pelo pino central. `null` = modo revisão (mostra os dois pontos e a rota). */
  picking: PickTarget | null;
  /** Centraliza o mapa num ponto; mude o `key` para repetir o mesmo ponto */
  focus?: { point: LngLat; key: number };
  /** Espaço ocupado pelos painéis por cima do mapa; o "centro" do mapa fica entre eles */
  padding: MapPadding;
  /** O usuário começou a arrastar o mapa */
  onPickStart?: () => void;
  /** O usuário soltou o mapa: coordenada sob o pino */
  onPick?: (point: LngLat) => void;
  /** Mostra o botão "Minha localização" */
  onLocate?: () => void;
}

const primaryColor = () =>
  getComputedStyle(document.documentElement).getPropertyValue('--mui-palette-primary-main').trim() || '#EF6C00';

export default function RideMap({
  origin,
  destination,
  route,
  picking,
  focus,
  padding,
  onPickStart,
  onPick,
  onLocate,
}: RideMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapboxMap | null>(null);
  const mapboxRef = useRef<typeof import('mapbox-gl').default | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const [styleReady, setStyleReady] = useState(false);
  const [dragging, setDragging] = useState(false);

  // Callbacks e estado mais recentes, lidos pelos eventos do mapa (registrados uma única vez)
  const callbacksRef = useRef({ onPickStart, onPick, picking });
  useEffect(() => {
    callbacksRef.current = { onPickStart, onPick, picking };
  });

  const { mode, systemMode } = useColorScheme();
  const scheme: Scheme = (mode === 'system' ? systemMode : mode) === 'dark' ? 'dark' : 'light';
  const schemeRef = useRef<Scheme>(scheme);

  // Cria o mapa uma única vez (mapbox-gl só roda no navegador, por isso o import dinâmico)
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
        center: DEFAULT_CENTER,
        zoom: 15,
        pitchWithRotate: false,
        dragRotate: false,
      });
      map.touchZoomRotate.disableRotation();
      map.on('style.load', () => setStyleReady(true));

      // Só movimentos feitos pelo usuário escolhem um ponto; flyTo/fitBounds do app são ignorados
      let userMoving = false;
      const startUserMove = () => {
        if (!callbacksRef.current.picking) return;
        userMoving = true;
        setDragging(true);
        callbacksRef.current.onPickStart?.();
      };
      // originalEvent só existe em movimentos do usuário: arrastar, pinça, duplo toque,
      // toque duplo + arrastar (zoom com um dedo), roda do mouse e setas do teclado
      map.on('movestart', (e) => 'originalEvent' in e && e.originalEvent && startUserMove());
      map.on('moveend', () => {
        if (!userMoving) return;
        userMoving = false;
        setDragging(false);
        const { lng, lat } = map.getCenter();
        callbacksRef.current.onPick?.([lng, lat]);
      });

      mapRef.current = map;
    });

    return () => {
      canceled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  // Tema claro/escuro
  useEffect(() => {
    if (schemeRef.current === scheme) return;
    schemeRef.current = scheme;
    const map = mapRef.current;
    if (!map) return;
    setStyleReady(false);
    map.setStyle(STYLES[scheme]);
  }, [scheme]);

  /** Área útil entre os painéis: o centro dela é onde fica o pino */
  const pickPadding = { top: padding.top, bottom: padding.bottom, left: 0, right: 0 };

  // Modo escolha: ajusta a área útil com animação curta (um setPadding direto "pula" o mapa
  // e interrompe animações em andamento). No modo revisão quem cuida é o enquadramento abaixo.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !styleReady || !picking || map.isMoving()) return;
    map.easeTo({ padding: { top: padding.top, bottom: padding.bottom, left: 0, right: 0 }, duration: 250 });
  }, [padding.top, padding.bottom, picking, styleReady]);

  // Centralizar num ponto pedido pela tela (endereço digitado, localização do usuário...)
  useEffect(() => {
    if (!focus || !styleReady) return;
    // O padding vai junto na animação, para o ponto parar exatamente sob o pino
    mapRef.current?.flyTo({ center: focus.point, zoom: 16, duration: 900, padding: pickPadding });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- só reage a um novo pedido de foco
  }, [focus, styleReady]);

  // Marcadores e rota
  useEffect(() => {
    const map = mapRef.current;
    const mapboxgl = mapboxRef.current;
    if (!map || !mapboxgl || !styleReady) return;

    const color = primaryColor();
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];
    // O ponto que está sendo escolhido é representado pelo pino central, não por um marcador
    if (origin && picking !== 'origin') {
      markersRef.current.push(new mapboxgl.Marker({ color: ORIGIN_COLOR }).setLngLat(origin).addTo(map));
    }
    if (destination && picking !== 'destination') {
      markersRef.current.push(new mapboxgl.Marker({ color }).setLngLat(destination).addTo(map));
    }

    const data = {
      type: 'Feature' as const,
      properties: {},
      geometry: { type: 'LineString' as const, coordinates: picking ? [] : (route ?? []) },
    };
    const source = map.getSource(ROUTE_LAYER) as GeoJSONSource | undefined;
    if (source) {
      source.setData(data);
    } else {
      map.addSource(ROUTE_LAYER, { type: 'geojson', data });
      map.addLayer({
        id: ROUTE_LAYER,
        type: 'line',
        source: ROUTE_LAYER,
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: { 'line-color': color, 'line-width': 5 },
      });
    }

  }, [origin, destination, route, picking, styleReady]);

  // Revisão: enquadra a viagem inteira na área entre os painéis (e reenquadra se eles mudarem de tamanho)
  useEffect(() => {
    const map = mapRef.current;
    const mapboxgl = mapboxRef.current;
    if (!map || !mapboxgl || !styleReady || picking || !origin || !destination) return;

    const points = route?.length ? route : [origin, destination];
    const bounds = new mapboxgl.LngLatBounds(points[0], points[0]);
    points.forEach((point) => bounds.extend(point));
    // Padding explícito substitui o do mapa; 72px à direita deixam livres os botões de zoom
    map.fitBounds(bounds, {
      padding: { top: padding.top + 32, bottom: padding.bottom + 32, left: 32, right: 72 },
      maxZoom: 16,
      duration: 900,
    });
  }, [origin, destination, route, picking, padding.top, padding.bottom, styleReady]);

  if (!MAPBOX_TOKEN) {
    return (
      <Box sx={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', bgcolor: 'action.hover', color: 'text.secondary' }}>
        <Box sx={{ textAlign: 'center', px: 3 }}>
          <MapPinOff size={32} />
          <Typography variant="body2" sx={{ mt: 1 }}>
            Mapa indisponível: defina NEXT_PUBLIC_MAPBOX_TOKEN no .env.local
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        position: 'absolute',
        inset: 0,
        // Logo e créditos do Mapbox (obrigatórios) ficam visíveis acima do painel inferior
        '& .mapboxgl-ctrl-bottom-left, & .mapboxgl-ctrl-bottom-right': { bottom: `${padding.bottom}px` },
      }}
    >
      <Box ref={containerRef} sx={{ position: 'absolute', inset: 0 }} />

      {/* Controles acessíveis: zoom sem precisar de dois dedos, e atalho para a localização */}
      <Box
        sx={{
          position: 'absolute',
          right: 12,
          top: padding.top,
          bottom: padding.bottom,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: 1.5,
          pointerEvents: 'none',
          '& > *': { pointerEvents: 'auto' },
        }}
      >
        <Paper elevation={4} sx={{ borderRadius: 999, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <Tooltip title="Aproximar" placement="left">
            <IconButton aria-label="Aproximar o mapa" onClick={() => mapRef.current?.zoomIn({ duration: 300 })} sx={{ width: 48, height: 48 }}>
              <Plus size={22} />
            </IconButton>
          </Tooltip>
          <Divider />
          <Tooltip title="Afastar" placement="left">
            <IconButton aria-label="Afastar o mapa" onClick={() => mapRef.current?.zoomOut({ duration: 300 })} sx={{ width: 48, height: 48 }}>
              <Minus size={22} />
            </IconButton>
          </Tooltip>
        </Paper>
        {onLocate && (
          <Paper elevation={4} sx={{ borderRadius: '50%' }}>
            <Tooltip title="Minha localização" placement="left">
              <IconButton aria-label="Usar minha localização" onClick={onLocate} sx={{ width: 48, height: 48, color: 'primary.main' }}>
                <LocateFixed size={22} />
              </IconButton>
            </Tooltip>
          </Paper>
        )}
      </Box>

      {picking && (
        <Box
          aria-hidden
          sx={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: padding.top,
            bottom: padding.bottom,
            display: 'grid',
            placeItems: 'center',
            pointerEvents: 'none',
          }}
        >
          {/* Sombra no chão: marca o ponto exato */}
          <Box
            sx={{
              position: 'absolute',
              width: dragging ? 14 : 8,
              height: dragging ? 6 : 4,
              borderRadius: '50%',
              bgcolor: 'rgba(0 0 0 / 0.35)',
              transition: 'all 150ms',
            }}
          />
          {/* Pino tipo "estaca": a ponta fica no centro e ele levanta enquanto o mapa se move */}
          <Box
            sx={{
              position: 'absolute',
              color: picking === 'origin' ? ORIGIN_COLOR : 'primary.main',
              transform: `translateY(${dragging ? -30 : -20}px)`,
              transition: 'transform 150ms',
              filter: 'drop-shadow(0 4px 6px rgba(0 0 0 / 0.3))',
              '& svg': { fill: 'currentColor', stroke: 'var(--mui-palette-background-paper)' },
            }}
          >
            <MapPin size={44} strokeWidth={1.5} />
          </Box>
        </Box>
      )}
    </Box>
  );
}

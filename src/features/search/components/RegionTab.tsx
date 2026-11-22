'use client';

import { useEffect, useState } from 'react';
import { MapPin, Route } from 'lucide-react';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import PlaceAutocomplete from '@/features/ride/components/PlaceAutocomplete';
import { useQuery } from '@/hooks/useQuery';
import { searchTrips } from '@/services/drivers';
import { reverseGeocode, searchCities } from '@/services/mapbox';
import type { Place } from '@/types/place';
import ResultState from './ResultState';
import TripCard from './TripCard';

const DEFAULT_CITY = 'São Paulo';

/** Viagens publicadas saindo da cidade do usuário (descoberta pela localização, ou escolhida) */
export default function RegionTab() {
  const [city, setCity] = useState(DEFAULT_CITY);
  const [changingCity, setChangingCity] = useState(false);

  // Descobre a cidade pela localização (se o usuário permitir); senão fica a padrão
  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      async ({ coords }) => {
        const place = await reverseGeocode([coords.longitude, coords.latitude]).catch(() => null);
        if (place?.city) setCity(place.city);
      },
      () => undefined,
      { maximumAge: 10 * 60_000, timeout: 10_000 },
    );
  }, []);

  const query = useQuery(`region:${city}`, () => searchTrips(city));
  const rides = query.data ?? [];

  const chooseCity = (place: Place | null) => {
    if (!place) return;
    setCity(place.name);
    setChangingCity(false);
  };

  return (
    <Stack spacing={2}>
      {changingCity ? (
        <PlaceAutocomplete
          label="Cidade"
          value={null}
          onChange={chooseCity}
          icon={<MapPin size={18} />}
          search={searchCities}
          noOptionsText="Digite pelo menos 3 letras da cidade"
          size="medium"
        />
      ) : (
        <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', minWidth: 0 }}>
            <MapPin size={20} style={{ flexShrink: 0 }} color="var(--mui-palette-primary-main)" />
            <Typography sx={{ fontWeight: 700 }} noWrap>
              Saindo de {city}
            </Typography>
          </Stack>
          <Button size="small" onClick={() => setChangingCity(true)} sx={{ textTransform: 'none', fontWeight: 600, flexShrink: 0 }}>
            Trocar cidade
          </Button>
        </Stack>
      )}

      <ResultState
        loading={query.loading}
        error={query.error}
        empty={rides.length === 0}
        emptyIcon={Route}
        emptyTitle="Nenhuma viagem saindo daqui"
        emptyDescription={`Ainda não há viagens publicadas saindo de ${city}. Tente outra cidade ou a aba "Entre cidades".`}
      >
        <Stack spacing={1.5}>
          {rides.map((ride) => (
            <TripCard key={ride.id} ride={ride} />
          ))}
        </Stack>
      </ResultState>
    </Stack>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { MapPin, UserSearch } from 'lucide-react';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import PlaceAutocomplete from '@/features/ride/components/PlaceAutocomplete';
import { useQuery } from '@/hooks/useQuery';
import { listDriversInCity } from '@/services/drivers';
import { reverseGeocode, searchCities } from '@/services/mapbox';
import type { DriverService, PersonType } from '@/types/drivers';
import type { Place } from '@/types/place';
import DriverCard from './DriverCard';
import FilterChips from './FilterChips';
import ResultState from './ResultState';

const DEFAULT_CITY = 'São Paulo';

type PersonFilter = 'all' | PersonType;
type ServiceFilter = 'all' | DriverService;

/** Motoristas (pessoa física ou jurídica) que atuam na cidade do usuário */
export default function RegionTab() {
  const [city, setCity] = useState(DEFAULT_CITY);
  const [changingCity, setChangingCity] = useState(false);
  const [person, setPerson] = useState<PersonFilter>('all');
  const [service, setService] = useState<ServiceFilter>('all');

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

  const query = useQuery(`${city}|${person}|${service}`, () =>
    listDriversInCity(city, {
      personType: person === 'all' ? undefined : person,
      service: service === 'all' ? undefined : service,
    }),
  );
  const drivers = query.data ?? [];

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
              Motoristas em {city}
            </Typography>
          </Stack>
          <Button size="small" onClick={() => setChangingCity(true)} sx={{ textTransform: 'none', fontWeight: 600, flexShrink: 0 }}>
            Trocar cidade
          </Button>
        </Stack>
      )}

      <Stack spacing={1}>
        <FilterChips
          label="Tipo de motorista"
          options={[
            { value: 'all', label: 'Todos' },
            { value: 'pf', label: 'Pessoa física' },
            { value: 'pj', label: 'Pessoa jurídica' },
          ]}
          value={person}
          onChange={setPerson}
        />
        <FilterChips
          label="Serviço"
          options={[
            { value: 'all', label: 'Todos os serviços' },
            { value: 'rides', label: 'Corridas' },
            { value: 'deliveries', label: 'Encomendas' },
          ]}
          value={service}
          onChange={setService}
        />
      </Stack>

      <ResultState
        loading={query.loading}
        error={query.error}
        empty={drivers.length === 0}
        emptyIcon={UserSearch}
        emptyTitle="Nenhum motorista encontrado"
        emptyDescription="Tente outro filtro ou outra cidade."
      >
        <Typography variant="body2" color="text.secondary" aria-live="polite">
          {drivers.length} motorista{drivers.length === 1 ? '' : 's'}
        </Typography>
        <Stack spacing={1.5}>
          {drivers.map((driver) => (
            <DriverCard key={driver.id} driver={driver} />
          ))}
        </Stack>
      </ResultState>
    </Stack>
  );
}

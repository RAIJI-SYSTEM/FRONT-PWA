'use client';

import { useState } from 'react';
import { ArrowUpDown, CircleDot, MapPin, Route, Search } from 'lucide-react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import PlaceAutocomplete from '@/features/ride/components/PlaceAutocomplete';
import { useQuery } from '@/hooks/useQuery';
import { searchTrips } from '@/services/drivers';
import { searchCities } from '@/services/mapbox';
import type { Place } from '@/types/place';
import FilterChips from './FilterChips';
import ResultState from './ResultState';
import TripCard from './TripCard';

type DayFilter = 'any' | 'today' | 'tomorrow' | 'pick';

/** "2026-10-13" no fuso do usuário */
const localDate = (offsetDays: number) => {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toLocaleDateString('sv-SE');
};

interface Submitted {
  from: string;
  to: string;
  date?: string;
}

/** Viagens publicadas por motoristas entre duas cidades */
export default function CitiesTab() {
  const [from, setFrom] = useState<Place | null>(null);
  const [to, setTo] = useState<Place | null>(null);
  const [day, setDay] = useState<DayFilter>('any');
  const [pickedDate, setPickedDate] = useState('');
  const [submitted, setSubmitted] = useState<Submitted | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const query = useQuery(submitted ? JSON.stringify(submitted) : null, () =>
    searchTrips(submitted!.from, submitted!.to, submitted!.date),
  );
  const trips = query.data ?? [];

  const swap = () => {
    setFrom(to);
    setTo(from);
  };

  const search = () => {
    if (!from || !to) return setFormError('Escolha as duas cidades.');
    if (from.name === to.name) return setFormError('As cidades precisam ser diferentes.');
    if (day === 'pick' && !pickedDate) return setFormError('Escolha a data.');
    setFormError(null);
    const date = day === 'today' ? localDate(0) : day === 'tomorrow' ? localDate(1) : day === 'pick' ? pickedDate : undefined;
    setSubmitted({ from: from.name, to: to.name, date });
  };

  return (
    <Stack spacing={2.5}>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
        <Stack spacing={1.5} sx={{ flex: 1, minWidth: 0 }}>
          <PlaceAutocomplete
            label="Saindo de (cidade)"
            value={from}
            onChange={setFrom}
            icon={<CircleDot size={18} />}
            search={searchCities}
            noOptionsText="Digite pelo menos 3 letras da cidade"
            size="medium"
          />
          <PlaceAutocomplete
            label="Indo para (cidade)"
            value={to}
            onChange={setTo}
            icon={<MapPin size={18} />}
            search={searchCities}
            noOptionsText="Digite pelo menos 3 letras da cidade"
            size="medium"
          />
        </Stack>
        <IconButton onClick={swap} aria-label="Inverter cidades" sx={{ border: 1, borderColor: 'divider', flexShrink: 0 }}>
          <ArrowUpDown size={20} />
        </IconButton>
      </Stack>

      <Box>
        <FilterChips
          label="Quando"
          options={[
            { value: 'any', label: 'Qualquer dia' },
            { value: 'today', label: 'Hoje' },
            { value: 'tomorrow', label: 'Amanhã' },
            { value: 'pick', label: 'Escolher data' },
          ]}
          value={day}
          onChange={setDay}
        />
        {day === 'pick' && (
          <TextField
            type="date"
            label="Data da viagem"
            value={pickedDate}
            onChange={(e) => setPickedDate(e.target.value)}
            fullWidth
            sx={{ mt: 1.5 }}
            slotProps={{ inputLabel: { shrink: true } }}
          />
        )}
      </Box>

      {formError && (
        <Typography color="error" variant="body2" role="alert">
          {formError}
        </Typography>
      )}

      <Button
        variant="contained"
        onClick={search}
        startIcon={<Search size={20} />}
        sx={{ height: 52, borderRadius: 999, textTransform: 'none', fontWeight: 600, fontSize: '1rem', boxShadow: 3 }}
      >
        Buscar viagens
      </Button>

      {submitted && (
        <ResultState
          loading={query.loading}
          error={query.error}
          empty={trips.length === 0}
          emptyIcon={Route}
          emptyTitle="Nenhuma viagem encontrada"
          emptyDescription={`Ainda não há viagens publicadas de ${submitted.from} para ${submitted.to}${submitted.date ? ' nessa data' : ''}.`}
        >
          <Typography variant="body2" color="text.secondary" aria-live="polite">
            {trips.length} viage{trips.length === 1 ? 'm' : 'ns'} de {submitted.from} para {submitted.to}
          </Typography>
          <Stack spacing={1.5}>
            {trips.map((trip) => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </Stack>
        </ResultState>
      )}
    </Stack>
  );
}

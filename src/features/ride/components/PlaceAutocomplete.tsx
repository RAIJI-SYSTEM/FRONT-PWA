'use client';

import { useRef, useState, type ReactNode } from 'react';
import Autocomplete from '@mui/material/Autocomplete';
import InputAdornment from '@mui/material/InputAdornment';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { MapPin } from 'lucide-react';
import { searchPlaces } from '@/services/mapbox';
import type { LngLat, Place } from '@/types/place';

const DEBOUNCE_MS = 300;

interface PlaceAutocompleteProps {
  label: string;
  value: Place | null;
  onChange: (place: Place | null) => void;
  icon: ReactNode;
  /** Prioriza resultados perto deste ponto (ex.: localização do usuário) */
  proximity?: LngLat;
  error?: string;
  /** Campo cujo ponto está sendo escolhido no mapa (fica destacado) */
  active?: boolean;
  onFocus?: () => void;
  /** Outra busca no lugar da de endereços (ex.: só cidades) */
  search?: (query: string, signal: AbortSignal) => Promise<Place[]>;
  noOptionsText?: string;
  size?: 'small' | 'medium';
}

export default function PlaceAutocomplete({
  label,
  value,
  onChange,
  icon,
  proximity,
  error,
  active,
  onFocus,
  search,
  noOptionsText = 'Digite pelo menos 3 letras do endereço',
  size = 'small',
}: PlaceAutocompleteProps) {
  const [options, setOptions] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const abortRef = useRef<AbortController>(undefined);

  // Busca com debounce: espera o usuário parar de digitar e cancela a requisição anterior
  const handleInputChange = (query: string) => {
    clearTimeout(timerRef.current);
    abortRef.current?.abort();
    if (query.trim().length < 3) {
      setOptions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    timerRef.current = setTimeout(async () => {
      const controller = new AbortController();
      abortRef.current = controller;
      try {
        setOptions(await (search ? search(query, controller.signal) : searchPlaces(query, proximity, controller.signal)));
      } catch {
        if (!controller.signal.aborted) setOptions([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, DEBOUNCE_MS);
  };

  return (
    <Autocomplete
      size={size}
      value={value}
      options={value ? [value, ...options.filter((o) => o.id !== value.id)] : options}
      loading={loading}
      // A filtragem já é feita pelo Mapbox
      filterOptions={(x) => x}
      getOptionLabel={(place) => place.name}
      // Lugares diferentes podem ter o mesmo nome (ex.: dois "Sítio Riacho de Santana");
      // sem isso o MUI usa o nome como key e o React reclama de keys duplicadas
      getOptionKey={(place) => place.id}
      isOptionEqualToValue={(a, b) => a.id === b.id}
      onChange={(_, place) => onChange(place)}
      onInputChange={(_, query, reason) => reason === 'input' && handleInputChange(query)}
      noOptionsText={noOptionsText}
      loadingText="Buscando endereços…"
      renderOption={({ key, ...props }, place) => (
        <li key={key} {...props}>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', minWidth: 0 }}>
            <MapPin size={18} style={{ flexShrink: 0 }} />
            <span style={{ minWidth: 0 }}>
              <Typography noWrap>{place.name}</Typography>
              <Typography variant="body2" color="text.secondary" noWrap>
                {place.address}
              </Typography>
            </span>
          </Stack>
        </li>
      )}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          error={Boolean(error)}
          helperText={error}
          onFocus={onFocus}
          sx={
            active
              ? { '& .MuiOutlinedInput-notchedOutline': { borderColor: 'primary.main', borderWidth: 2 } }
              : undefined
          }
          slotProps={{
            ...params.slotProps,
            input: {
              ...params.slotProps.input,
              startAdornment: <InputAdornment position="start">{icon}</InputAdornment>,
            },
          }}
        />
      )}
    />
  );
}

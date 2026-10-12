'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import RoutePicker from '@/features/map/components/RoutePicker';
import { createRideSearch } from '@/services/rideSearch';
import type { Place } from '@/types/place';
import type { Departure } from '@/types/ride';
import DepartureSelector, { type DepartureMode } from './DepartureSelector';

/** Antecedência mínima para agendar uma carona */
const MIN_SCHEDULE_MINUTES = 15;

interface NewRideScreenProps {
  initialMode?: DepartureMode;
}

/** "Informar rota" do BPMN de viagens: escolhe a rota no mapa e quando viajar */
export default function NewRideScreen({ initialMode = 'now' }: NewRideScreenProps) {
  const router = useRouter();
  const [mode, setMode] = useState<DepartureMode>(initialMode);
  const [scheduledAt, setScheduledAt] = useState('');
  const [scheduleError, setScheduleError] = useState<string>();
  const [apiError, setApiError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (origin: Place, destination: Place) => {
    let departure: Departure = { type: 'now' };
    if (mode === 'scheduled') {
      const time = Date.parse(scheduledAt);
      if (Number.isNaN(time)) return setScheduleError('Escolha a data e o horário.');
      if (time < Date.now() + MIN_SCHEDULE_MINUTES * 60_000)
        return setScheduleError(`Agende com pelo menos ${MIN_SCHEDULE_MINUTES} minutos de antecedência.`);
      departure = { type: 'scheduled', at: new Date(time).toISOString() };
    }
    setScheduleError(undefined);

    setApiError(null);
    setSubmitting(true);
    try {
      const search = await createRideSearch({ origin, destination, departure });
      router.push(`/viagem/busca/${search.id}`);
    } catch (error) {
      setApiError(error instanceof Error ? error.message : 'Não foi possível iniciar a busca.');
      setSubmitting(false);
    }
  };

  return (
    <RoutePicker
      title="Nova viagem"
      backHref="/homepage"
      onSubmit={handleSubmit}
      error={apiError}
      renderReview={() => (
        <>
          <DepartureSelector
            mode={mode}
            onModeChange={setMode}
            scheduledAt={scheduledAt}
            onScheduledAtChange={setScheduledAt}
            error={scheduleError}
          />
          <Button
            type="submit"
            variant="contained"
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : <Search size={20} />}
            sx={{ height: 52, borderRadius: 999, fontSize: '1rem', fontWeight: 600, textTransform: 'none', boxShadow: 3 }}
          >
            {mode === 'now' ? 'Procurar motorista' : 'Publicar carona'}
          </Button>
        </>
      )}
    />
  );
}

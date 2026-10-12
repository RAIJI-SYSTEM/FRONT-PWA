'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import RoutePicker from '@/features/map/components/RoutePicker';
import { createDelivery } from '@/services/deliveries';
import type { Place } from '@/types/place';

const LABELS = {
  origin: 'Coletar em',
  destination: 'Entregar em',
  originStep: 'Local de coleta',
  destinationStep: 'Local de entrega',
};

/** "Escolher rota da viagem" + "Enviar origem e destino" do BPMN de encomendas */
export default function NewDeliveryScreen() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (origin: Place, destination: Place) => {
    setError(null);
    setSubmitting(true);
    try {
      // O sistema verifica se a rota é válida antes de pedir os dados do produto
      const delivery = await createDelivery(origin, destination);
      router.push(`/encomenda/${delivery.id}/produto`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível verificar a rota.');
      setSubmitting(false);
    }
  };

  return (
    <RoutePicker
      title="Enviar encomenda"
      backHref="/homepage"
      labels={LABELS}
      onSubmit={handleSubmit}
      error={error}
      renderReview={() => (
        <>
          <Typography variant="body2" color="text.secondary">
            Em seguida você informa o tamanho do pacote e quem vai receber.
          </Typography>
          <Button
            type="submit"
            variant="contained"
            disabled={submitting}
            endIcon={submitting ? <CircularProgress size={20} color="inherit" /> : <ArrowRight size={20} />}
            sx={{ height: 52, borderRadius: 999, fontSize: '1rem', fontWeight: 600, textTransform: 'none', boxShadow: 3 }}
          >
            Continuar
          </Button>
        </>
      )}
    />
  );
}

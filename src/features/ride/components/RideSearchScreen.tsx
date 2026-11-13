'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CalendarCheck, SearchX } from 'lucide-react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import StatusScreen from '@/components/StatusScreen';
import { cancelRideSearch } from '@/services/rideSearch';
import type { RideOffer } from '@/types/ride';
import { formatDate, formatTime } from '@/utils/formatDate';
import { useRideSearch } from '../hooks/useRideSearch';
import OfferList from './OfferList';
import SearchingView from './SearchingView';

const pillButton = { height: 52, borderRadius: 999, textTransform: 'none', fontWeight: 600 } as const;

/** Acompanha a busca do início ao fim: espera → resultados / sem resultados / publicada no mural */
export default function RideSearchScreen({ searchId }: { searchId: string }) {
  const router = useRouter();
  const { search, error, setSearch } = useRideSearch(searchId);
  const [canceling, setCanceling] = useState(false);

  const handleCancel = async () => {
    setCanceling(true);
    try {
      setSearch(await cancelRideSearch(searchId));
      router.push('/homepage');
    } catch {
      setCanceling(false);
    }
  };

  const handleContinue = (offer: RideOffer) =>
    router.push(`/viagem/pedido?busca=${encodeURIComponent(searchId)}&carona=${encodeURIComponent(offer.id)}`);

  if (!search) {
    return error ? (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    ) : (
      <Stack sx={{ alignItems: 'center', py: 8 }}>
        <CircularProgress />
      </Stack>
    );
  }

  switch (search.status) {
    case 'searching':
      return (
        <SearchingView
          originName={search.origin.name}
          destinationName={search.destination.name}
          startedAt={search.createdAt}
          onCancel={handleCancel}
          canceling={canceling}
        />
      );

    case 'results':
      return <OfferList offers={search.offers} onContinue={handleContinue} />;

    case 'published': {
      const at = search.departure.type === 'scheduled' ? search.departure.at : search.createdAt;
      return (
        <StatusScreen
          icon={CalendarCheck}
          title="Carona publicada no mural"
          description={`Sua carona para ${formatDate(at)} às ${formatTime(at)} está visível para os motoristas. Avisaremos quando alguém aceitar.`}
          actions={
            <>
              <Button component={Link} href="/homepage" variant="contained" sx={pillButton}>
                Voltar ao início
              </Button>
              <Button onClick={handleCancel} disabled={canceling} color="inherit" sx={pillButton}>
                Cancelar publicação
              </Button>
            </>
          }
        />
      );
    }

    case 'no_results':
    case 'canceled':
      return (
        <StatusScreen
          icon={SearchX}
          tone="error"
          title={search.status === 'canceled' ? 'Busca cancelada' : 'Nenhuma carona nesse caminho'}
          description={
            search.status === 'canceled'
              ? 'Você cancelou esta busca.'
              : search.departure.type === 'now'
                ? 'Nenhum motorista sai na próxima hora passando por esse caminho. Tente outro horário ou agende a carona.'
                : 'Nenhum motorista publicou carona passando por esse caminho nesse horário. Tente outro horário.'
          }
          actions={
            <>
              <Button component={Link} href="/viagem/nova" variant="contained" sx={pillButton}>
                Tentar novamente
              </Button>
              <Button component={Link} href="/viagem/nova?quando=agendar" color="inherit" sx={pillButton}>
                Agendar carona
              </Button>
            </>
          }
        />
      );
  }
}

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CalendarCheck, PackageCheck, PackageSearch, SearchX } from 'lucide-react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import StatusScreen from '@/components/StatusScreen';
import { paymentPaths } from '@/features/payment/paths';
import OfferList from '@/features/ride/components/OfferList';
import SearchingView from '@/features/ride/components/SearchingView';
import { cancelDelivery } from '@/services/deliveries';
import type { RideOffer } from '@/types/ride';
import { formatDate, formatTime } from '@/utils/formatDate';
import { useDelivery } from '../hooks/useDelivery';
import DeliveryKeyword from './DeliveryKeyword';

const pillButton = { height: 52, borderRadius: 999, textTransform: 'none', fontWeight: 600 } as const;

/**
 * Acompanha a entrega: procurando motorista (com anúncios) → opções de viagem →
 * pagamento → palavra-chave. Também cobre mural, sem motoristas e cancelamento.
 */
export default function DeliveryScreen({ deliveryId }: { deliveryId: string }) {
  const router = useRouter();
  const { delivery, error, setDelivery } = useDelivery(deliveryId);
  const [canceling, setCanceling] = useState(false);

  const handleCancel = async () => {
    setCanceling(true);
    try {
      setDelivery(await cancelDelivery(deliveryId));
      router.push('/homepage');
    } catch {
      setCanceling(false);
    }
  };

  const handleContinue = (offer: RideOffer) => router.push(paymentPaths.delivery.checkout(deliveryId, offer.id));

  if (!delivery) {
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

  switch (delivery.status) {
    case 'awaiting_details':
      return (
        <StatusScreen
          icon={PackageSearch}
          title="Faltam os dados do pacote"
          description="Informe o tamanho do pacote e quem vai receber para procurarmos um motorista."
          actions={
            <Button component={Link} href={`/encomenda/${deliveryId}/produto`} variant="contained" sx={pillButton}>
              Informar dados do pacote
            </Button>
          }
        />
      );

    case 'searching':
      return (
        <SearchingView
          title="Procurando quem leve seu pacote"
          icon={PackageSearch}
          originName={delivery.origin.name}
          destinationName={delivery.destination.name}
          startedAt={delivery.createdAt}
          onCancel={handleCancel}
          canceling={canceling}
        />
      );

    case 'results':
      return <OfferList offers={delivery.offers} onContinue={handleContinue} noun={['opção de entrega', 'opções de entrega']} />;

    case 'published': {
      const at = delivery.departure?.type === 'scheduled' ? delivery.departure.at : delivery.createdAt;
      return (
        <StatusScreen
          icon={CalendarCheck}
          title="Publicada no mural da região"
          description={`Sua coleta para ${formatDate(at)} às ${formatTime(at)} está visível para os motoristas da região. Avisaremos quando alguém aceitar.`}
          actions={
            <>
              <Button component={Link} href="/homepage" variant="contained" sx={pillButton}>
                Voltar ao início
              </Button>
              <Button onClick={handleCancel} disabled={canceling} color="inherit" sx={pillButton}>
                Cancelar entrega
              </Button>
            </>
          }
        />
      );
    }

    case 'paid':
      return (
        <StatusScreen
          icon={PackageCheck}
          tone="success"
          title="Entrega confirmada"
          description="O motorista vai buscar o pacote no local de coleta."
          actions={
            <Button component={Link} href="/homepage" variant="contained" sx={pillButton}>
              Voltar ao início
            </Button>
          }
        >
          {delivery.keyword && (
            <DeliveryKeyword keyword={delivery.keyword} recipientName={delivery.details?.recipientName} />
          )}
        </StatusScreen>
      );

    case 'no_results':
    case 'canceled':
      return (
        <StatusScreen
          icon={SearchX}
          tone="error"
          title={delivery.status === 'canceled' ? 'Entrega cancelada' : 'Nenhum motorista disponível'}
          description={
            delivery.status === 'canceled'
              ? 'Você cancelou esta entrega.'
              : 'Não encontramos motoristas para essa rota agora. Tente de novo em alguns minutos ou agende a coleta.'
          }
          actions={
            <Button component={Link} href="/encomenda/nova" variant="contained" sx={pillButton}>
              Nova encomenda
            </Button>
          }
        />
      );
  }
}

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CalendarCheck, Hourglass, KeyRound, PackageCheck, PackageSearch, SearchX } from 'lucide-react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import StatusScreen from '@/components/StatusScreen';
import OfferList from '@/features/ride/components/OfferList';
import SearchingView from '@/features/ride/components/SearchingView';
import type { CompanyApi } from '@/services/backend/types';
import { listMyCompanies } from '@/services/companies';
import { cancelDelivery, requestDeliverySpace } from '@/services/deliveries';
import type { RideOffer } from '@/types/ride';
import { formatDate, formatTime } from '@/utils/formatDate';
import { useDelivery } from '../hooks/useDelivery';
import DeliveryKeyword from './DeliveryKeyword';
import { routes } from '@/utils/routes';

const pillButton = { height: 52, borderRadius: 999, textTransform: 'none', fontWeight: 600 } as const;

/**
 * Acompanha a entrega: procurando motorista (com anúncios) → opções de viagem →
 * pagamento → palavra-chave. Também cobre mural, sem motoristas e cancelamento.
 */
export default function DeliveryScreen({ deliveryId }: { deliveryId: string }) {
  const router = useRouter();
  const { delivery, error, setDelivery } = useDelivery(deliveryId);
  const [canceling, setCanceling] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [companies, setCompanies] = useState<CompanyApi[]>([]);
  const [senderCompany, setSenderCompany] = useState('');

  // Quem participa de empresas pode enviar em nome dela (os gestores acompanham juntos)
  useEffect(() => {
    listMyCompanies().then(setCompanies).catch(() => setCompanies([]));
  }, []);

  const handleCancel = async () => {
    setCanceling(true);
    try {
      setDelivery(await cancelDelivery(deliveryId));
      router.push('/homepage');
    } catch {
      setCanceling(false);
    }
  };

  const handleContinue = async (offer: RideOffer) => {
    setRequestError(null);
    setRequesting(true);
    try {
      setDelivery(await requestDeliverySpace(deliveryId, offer.id, senderCompany || null));
    } catch (err) {
      setRequestError(err instanceof Error ? err.message : 'Não foi possível pedir o espaço.');
    } finally {
      setRequesting(false);
    }
  };

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
            <Button component={Link} href={routes.deliveryDetails(deliveryId)} variant="contained" sx={pillButton}>
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
      return (
        <Stack spacing={2}>
          {companies.length > 0 && (
            <TextField select label="Enviar como" value={senderCompany} onChange={(e) => setSenderCompany(e.target.value)}>
              <MenuItem value="">Eu (pessoa física)</MenuItem>
              {companies.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.displayName} · {c.cnpjFormatted}
                </MenuItem>
              ))}
            </TextField>
          )}
          {requestError && <Alert severity="error">{requestError}</Alert>}
          {requesting && <CircularProgress size={24} sx={{ alignSelf: 'center' }} />}
          <OfferList
            offers={delivery.offers}
            onContinue={requesting ? () => undefined : handleContinue}
            noun={['carona que leva encomendas', 'caronas que levam encomendas']}
            actionLabel="Pedir espaço nesta carona"
          />
        </Stack>
      );

    case 'requested':
      return (
        <StatusScreen
          icon={Hourglass}
          title="Pedido enviado ao motorista"
          description="O motorista confere o tamanho e o peso e aceita ou recusa. Avisaremos você. Guarde os códigos abaixo."
          actions={
            <>
              <Button component={Link} href="/encomendas" variant="contained" sx={pillButton}>
                Ver minhas encomendas
              </Button>
              <Button onClick={handleCancel} disabled={canceling} color="inherit" sx={pillButton}>
                Cancelar pedido
              </Button>
            </>
          }
        >
          {delivery.pickupCode && (
            <Paper variant="outlined" sx={{ width: '100%', maxWidth: 420, p: 2.5, borderRadius: 3, textAlign: 'center' }}>
              <Stack direction="row" spacing={1} sx={{ justifyContent: 'center', alignItems: 'center', color: 'text.secondary' }}>
                <KeyRound size={16} />
                <Typography variant="body2">Código de coleta (mostre ao motorista)</Typography>
              </Stack>
              <Typography sx={{ fontWeight: 800, fontSize: '2rem', letterSpacing: 6 }}>{delivery.pickupCode}</Typography>
            </Paper>
          )}
          {delivery.keyword && <DeliveryKeyword keyword={delivery.keyword} recipientName={delivery.details?.recipientName} />}
        </StatusScreen>
      );

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
          title={delivery.status === 'canceled' ? 'Entrega cancelada' : 'Nenhuma carona leva encomendas nesse caminho'}
          description={
            delivery.status === 'canceled'
              ? 'Você cancelou esta entrega.'
              : 'Nenhum motorista publicou carona aceitando encomendas por esse caminho nesse horário. Tente outro horário.'
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

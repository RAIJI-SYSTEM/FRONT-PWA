'use client';

import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';
import Link from 'next/link';
import { Gift, Package, Wallet, type LucideIcon } from 'lucide-react';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;

interface AdSlotProps {
  /** ID do bloco de anúncio no AdSense (data-ad-slot). Sem ele, mostra anúncios da própria Raiji. */
  adSlotId?: string;
  minHeight?: number;
}

/**
 * Espaço de anúncio para telas de espera.
 * - Com NEXT_PUBLIC_ADSENSE_CLIENT e `adSlotId`: exibe o Google AdSense.
 * - Sem configuração: exibe "house ads" (promoções do próprio app), que também servem
 *   para vender espaço diretamente a anunciantes.
 */
export default function AdSlot({ adSlotId, minHeight = 120 }: AdSlotProps) {
  return (
    <Box component="aside" aria-label="Publicidade" sx={{ width: '100%' }}>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.75, letterSpacing: 0.5 }}>
        Publicidade
      </Typography>
      {ADSENSE_CLIENT && adSlotId ? (
        <AdSenseUnit client={ADSENSE_CLIENT} slot={adSlotId} minHeight={minHeight} />
      ) : (
        <HouseAd minHeight={minHeight} />
      )}
    </Box>
  );
}

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

function AdSenseUnit({ client, slot, minHeight }: { client: string; slot: string; minHeight: number }) {
  const pushed = useRef(false);

  useEffect(() => {
    // Em apps de página única o anúncio precisa ser "empurrado" manualmente após montar
    if (pushed.current) return;
    pushed.current = true;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // bloqueador de anúncios ou script ainda não carregado: o espaço fica vazio
    }
  }, []);

  return (
    <>
      <Script
        id="adsense"
        async
        strategy="afterInteractive"
        crossOrigin="anonymous"
        src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}`}
      />
      <ins
        className="adsbygoogle"
        style={{ display: 'block', minHeight }}
        data-ad-client={client}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </>
  );
}

interface HouseAdContent {
  icon: LucideIcon;
  title: string;
  description: string;
  href: string;
}

const HOUSE_ADS: HouseAdContent[] = [
  { icon: Gift, title: 'Indique e ganhe R$ 10', description: 'Seu amigo viaja, vocês dois ganham crédito.', href: '/perfil' },
  { icon: Package, title: 'Precisa enviar algo?', description: 'Encomendas entregues no mesmo dia na sua cidade.', href: '/encomenda/nova' },
  { icon: Wallet, title: 'Pague com Pix', description: 'Aprovação na hora, sem precisar de cartão.', href: '/carteira' },
];

const ROTATE_MS = 8000;

function HouseAd({ minHeight }: { minHeight: number }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setIndex((i) => (i + 1) % HOUSE_ADS.length), ROTATE_MS);
    return () => clearInterval(timer);
  }, []);

  const { icon: Icon, title, description, href } = HOUSE_ADS[index];

  return (
    <ButtonBase
      component={Link}
      href={href}
      sx={{
        width: '100%',
        minHeight,
        p: 2.5,
        gap: 2,
        justifyContent: 'flex-start',
        textAlign: 'left',
        borderRadius: 3,
        border: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper',
        position: 'relative',
        overflow: 'hidden',
        backgroundImage:
          'linear-gradient(315deg, rgba(var(--mui-palette-primary-mainChannel) / 0.14) 0%, transparent 60%)',
      }}
    >
      <Box
        sx={{
          flexShrink: 0,
          width: 56,
          height: 56,
          borderRadius: 3,
          display: 'grid',
          placeItems: 'center',
          color: 'primary.contrastText',
          bgcolor: 'primary.main',
        }}
      >
        <Icon size={26} />
      </Box>
      <Stack spacing={0.5}>
        <Typography sx={{ fontWeight: 700 }}>{title}</Typography>
        <Typography variant="body2" color="text.secondary">
          {description}
        </Typography>
      </Stack>
    </ButtonBase>
  );
}

'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import useScrollTrigger from '@mui/material/useScrollTrigger';

interface FlowTopBarProps {
  title: string;
  /** Para onde o botão voltar leva. Sem isso, volta no histórico do navegador. */
  backHref?: string;
}

/**
 * Barra simples das telas de fluxo (nova viagem, busca, pagamento), como o "Tracking Shipment" da referência.
 * Fica parada no topo: só o conteúdo abaixo dela rola.
 */
export default function FlowTopBar({ title, backHref }: FlowTopBarProps) {
  const router = useRouter();
  const scrolled = useScrollTrigger({ disableHysteresis: true, threshold: 4 });

  return (
    <Stack
      component="header"
      direction="row"
      spacing={2}
      sx={{
        position: 'sticky',
        top: 0,
        zIndex: 'appBar',
        alignItems: 'center',
        py: { xs: 1.5, sm: 2.5 },
        // Ocupa a largura toda da coluna (anula o respiro lateral do layout)
        mx: { xs: -2, sm: -3 },
        px: { xs: 2, sm: 3 },
        // Como o cabeçalho principal: transparente no topo; ao rolar, fundo com desfoque
        bgcolor: scrolled ? 'rgba(var(--mui-palette-background-defaultChannel) / 0.85)' : 'transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        borderBottom: 1,
        borderColor: scrolled ? 'divider' : 'transparent',
        transition: 'background-color 200ms, border-color 200ms',
      }}
    >
      <IconButton
        aria-label="Voltar"
        onClick={() => (backHref ? router.push(backHref) : router.back())}
        sx={{ bgcolor: 'background.paper', boxShadow: 1, '&:hover': { bgcolor: 'background.paper' } }}
      >
        <ArrowLeft size={20} />
      </IconButton>
      <Typography component="h1" variant="h6" sx={{ fontWeight: 600 }}>
        {title}
      </Typography>
    </Stack>
  );
}

'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

interface FlowTopBarProps {
  title: string;
  /** Para onde o botão voltar leva. Sem isso, volta no histórico do navegador. */
  backHref?: string;
}

/** Barra simples das telas de fluxo (nova viagem, busca, pagamento), como o "Tracking Shipment" da referência */
export default function FlowTopBar({ title, backHref }: FlowTopBarProps) {
  const router = useRouter();

  return (
    <Stack component="header" direction="row" spacing={2} sx={{ alignItems: 'center', py: { xs: 1.5, sm: 2.5 } }}>
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

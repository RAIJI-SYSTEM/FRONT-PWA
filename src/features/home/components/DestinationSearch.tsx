'use client';

import Link from 'next/link';
import ButtonBase from '@mui/material/ButtonBase';
import Typography from '@mui/material/Typography';
import { Search } from 'lucide-react';

/**
 * Atalho para a busca de destino. Por enquanto apenas leva para a tela de nova viagem,
 * onde a busca de endereços com o Mapbox será feita.
 */
export default function DestinationSearch() {
  return (
    <ButtonBase
      component={Link}
      href="/viagem/nova"
      sx={{
        width: '100%',
        justifyContent: 'flex-start',
        gap: 1.5,
        px: 2.5,
        height: { xs: 52, sm: 60 },
        borderRadius: 999,
        bgcolor: 'background.paper',
        color: 'text.secondary',
        border: 1,
        borderColor: 'divider',
        boxShadow: 1,
      }}
    >
      <Search size={20} />
      <Typography sx={{ fontSize: { xs: '0.9375rem', sm: '1rem' } }}>Para onde vamos?</Typography>
    </ButtonBase>
  );
}

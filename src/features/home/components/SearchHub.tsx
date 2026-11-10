'use client';

import Link from 'next/link';
import { Search } from 'lucide-react';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Typography from '@mui/material/Typography';

/**
 * Barra de busca da página inicial: abre a busca de motoristas na região, por código
 * e de viagens entre cidades (as três abas ficam na tela /buscar).
 */
export default function SearchHub() {
  return (
    <Box component="section" aria-label="Buscar">
      <ButtonBase
        component={Link}
        href="/buscar?modo=regiao"
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
        <Typography sx={{ fontSize: { xs: '0.9375rem', sm: '1rem' } }}>Motoristas, códigos ou viagens</Typography>
      </ButtonBase>
    </Box>
  );
}

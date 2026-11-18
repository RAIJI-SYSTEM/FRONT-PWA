'use client';

import Link from 'next/link';
import { IdCard, Repeat, Settings } from 'lucide-react';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import OptionList, { type MenuOption } from '@/features/more/components/OptionList';

const DRIVER_OPTIONS: MenuOption[] = [
  { label: 'Perfil de motorista', description: 'CNH e veículos', href: '/motorista/perfil', icon: IdCard },
];

const APP_OPTIONS: MenuOption[] = [
  { label: 'Configurações', description: 'Tema e notificações', href: '/configuracoes?modo=motorista', icon: Settings },
];

/** "Mais" do modo motorista: perfil (CNH e veículos), configurações e volta ao modo passageiro (rotas, pedidos e fretes estão no menu) */
export default function DriverMoreScreen() {
  return (
    <Stack spacing={3}>
      <Typography component="h1" variant="h5" sx={{ fontWeight: 800 }}>
        Mais
      </Typography>
      <OptionList title="Motorista" options={DRIVER_OPTIONS} />
      <OptionList title="App" options={APP_OPTIONS} />
      <Button
        component={Link}
        href="/homepage"
        variant="outlined"
        color="inherit"
        startIcon={<Repeat size={18} />}
        sx={{ height: 52, borderRadius: 999, textTransform: 'none', fontWeight: 600, borderColor: 'divider' }}
      >
        Voltar ao modo passageiro
      </Button>
    </Stack>
  );
}

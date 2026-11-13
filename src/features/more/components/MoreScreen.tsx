'use client';

import Link from 'next/link';
import { Building2, CarFront, ChevronRight, FileText, Gift, LogOut, Repeat, Settings, User } from 'lucide-react';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import AdSlot from '@/components/AdSlot';
import OptionList, { type MenuOption } from './OptionList';

const ACCOUNT_OPTIONS: MenuOption[] = [
  { label: 'Perfil', description: 'Nome, foto, telefone e e-mail', href: '/perfil', icon: User },
  { label: 'Empresa', description: 'CNPJ, gestores e fretes', href: '/empresa', icon: Building2 },
  { label: 'Recompensas', description: 'Seus cupons e missões', href: '/recompensas', icon: Gift, badge: 'Ganhe R$ 15' },
  { label: 'Configurações', description: 'Tema e notificações', href: '/configuracoes', icon: Settings },
];

const LEGAL_OPTIONS: MenuOption[] = [
  { label: 'Termos de uso', description: 'Regras de uso da plataforma', href: '/termos', icon: FileText },
];

interface MoreScreenProps {
  userName: string;
  userDetail: string;
  avatarSrc?: string;
}

/** "Mais": atalhos da conta, recompensas, termos e um espaço de publicidade */
export default function MoreScreen({ userName, userDetail, avatarSrc }: MoreScreenProps) {
  return (
    <Stack spacing={3}>
      {/* Cartão do perfil */}
      <ButtonBase
        component={Link}
        href="/perfil"
        sx={{
          width: '100%',
          justifyContent: 'flex-start',
          gap: 2,
          p: 2.5,
          borderRadius: 3,
          textAlign: 'left',
          color: 'primary.contrastText',
          background: 'linear-gradient(135deg, var(--mui-palette-primary-light) 0%, var(--mui-palette-primary-main) 100%)',
          boxShadow: 3,
        }}
      >
        <Avatar
          src={avatarSrc}
          alt={userName}
          sx={{ width: 60, height: 60, bgcolor: 'background.paper', color: 'primary.main', fontWeight: 700, fontSize: '1.5rem' }}
        >
          {userName.charAt(0).toUpperCase()}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontWeight: 700, fontSize: '1.25rem' }} noWrap>
            {userName}
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.85 }} noWrap>
            {userDetail}
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5 }}>
            Ver e editar perfil
          </Typography>
        </Box>
        <ChevronRight size={22} style={{ flexShrink: 0 }} />
      </ButtonBase>

      {/* Mesma conta, outro modo: quem ainda não é motorista cai no cadastro (CNH + veículo) */}
      <ButtonBase
        component={Link}
        href="/motorista"
        sx={{
          width: '100%',
          justifyContent: 'flex-start',
          gap: 2,
          p: 2,
          borderRadius: 3,
          textAlign: 'left',
          border: 2,
          borderColor: 'primary.main',
          bgcolor: 'rgba(var(--mui-palette-primary-mainChannel) / 0.08)',
        }}
      >
        <Box
          sx={{
            width: 48,
            height: 48,
            flexShrink: 0,
            borderRadius: 2,
            display: 'grid',
            placeItems: 'center',
            color: 'primary.contrastText',
            bgcolor: 'primary.main',
          }}
        >
          <CarFront size={24} />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontWeight: 800 }}>Modo motorista</Typography>
          <Typography variant="body2" color="text.secondary">
            Publique rotas e aceite corridas e encomendas da sua região.
          </Typography>
        </Box>
        <Repeat size={20} style={{ flexShrink: 0 }} color="var(--mui-palette-primary-main)" />
      </ButtonBase>

      <OptionList title="Conta" options={ACCOUNT_OPTIONS} />

      <AdSlot adSlotId={process.env.NEXT_PUBLIC_ADSENSE_SLOT_MORE} />

      <OptionList title="Informações" options={LEGAL_OPTIONS} />

      <ButtonBase
        component={Link}
        href="/login"
        sx={{
          gap: 1,
          py: 1.75,
          borderRadius: 999,
          border: 1,
          borderColor: 'divider',
          color: 'error.main',
          fontWeight: 600,
          typography: 'body1',
        }}
      >
        <LogOut size={20} /> Sair da conta
      </ButtonBase>

      <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
        Raiji · versão {process.env.NEXT_PUBLIC_APP_VERSION ?? '0.1.0'}
      </Typography>
    </Stack>
  );
}

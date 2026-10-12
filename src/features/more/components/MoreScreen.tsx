'use client';

import Link from 'next/link';
import { ChevronRight, FileText, Gift, LogOut, Settings, User, type LucideIcon } from 'lucide-react';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import AdSlot from '@/components/AdSlot';

interface MenuOption {
  label: string;
  description: string;
  href: string;
  icon: LucideIcon;
  /** Destaque à direita, ex.: saldo de recompensas */
  badge?: string;
}

const ACCOUNT_OPTIONS: MenuOption[] = [
  { label: 'Perfil', description: 'Nome, foto, telefone e e-mail', href: '/perfil', icon: User },
  { label: 'Recompensas', description: 'Seus cupons e missões', href: '/recompensas', icon: Gift, badge: 'Ganhe R$ 15' },
  { label: 'Configurações', description: 'Notificações, tema e privacidade', href: '/configuracoes', icon: Settings },
];

const LEGAL_OPTIONS: MenuOption[] = [
  { label: 'Termos de uso', description: 'Regras de uso da plataforma', href: '/termos', icon: FileText },
];

function OptionList({ title, options }: { title: string; options: MenuOption[] }) {
  return (
    <Box component="section" aria-labelledby={`more-${title}`}>
      <Typography
        id={`more-${title}`}
        variant="overline"
        color="text.secondary"
        sx={{ display: 'block', px: 1, mb: 0.5, fontWeight: 700, letterSpacing: 1 }}
      >
        {title}
      </Typography>
      <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <List disablePadding>
          {options.map(({ label, description, href, icon: Icon, badge }, index) => (
            <Box key={href}>
              {index > 0 && <Divider component="li" sx={{ ml: 9 }} />}
              <ListItemButton component={Link} href={href} sx={{ gap: 2, py: 1.5, px: 2 }}>
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    flexShrink: 0,
                    borderRadius: 2,
                    display: 'grid',
                    placeItems: 'center',
                    color: 'primary.main',
                    bgcolor: 'rgba(var(--mui-palette-primary-mainChannel) / 0.12)',
                  }}
                >
                  <Icon size={22} />
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 600 }}>{label}</Typography>
                  <Typography variant="body2" color="text.secondary" noWrap>
                    {description}
                  </Typography>
                </Box>
                {badge && <Chip label={badge} size="small" color="primary" sx={{ fontWeight: 700 }} />}
                <ChevronRight size={20} style={{ flexShrink: 0, opacity: 0.6 }} />
              </ListItemButton>
            </Box>
          ))}
        </List>
      </Paper>
    </Box>
  );
}

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

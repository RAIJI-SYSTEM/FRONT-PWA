'use client';

import AppBar from '@mui/material/AppBar';
import Avatar from '@mui/material/Avatar';
import Badge from '@mui/material/Badge';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import useScrollTrigger from '@mui/material/useScrollTrigger';
import { useUnreadMessages } from '@/features/messages/hooks/useUnreadMessages';
import { useEffect, useRef, type ReactNode } from 'react';
import Link from 'next/link';
import { Bell, MapPin, MessageCircle } from 'lucide-react';

export interface HeaderProps {
  userName?: string;
  avatarSrc?: string;
  location?: string;
  notificationsCount?: number;
  onNotificationsClick?: () => void;
  /** Mensagens não lidas. Se não for passado, é consultado na API de conversas. */
  messagesCount?: number;
}

interface HeaderIconButtonProps {
  label: string;
  count: number;
  icon: ReactNode;
  onClick?: () => void;
  /** Se informado, o botão vira um link */
  href?: string;
}

/** Botão redondo do topo com bolinha de "tem novidade" */
const iconButtonSx = {
  width: { xs: 44, sm: 52 },
  height: { xs: 44, sm: 52 },
  bgcolor: 'background.paper',
  color: 'text.primary',
  boxShadow: 1,
  '&:hover': { bgcolor: 'background.paper' },
};

function HeaderIconButton({ label, count, icon, onClick, href }: HeaderIconButtonProps) {
  const ariaLabel = count > 0 ? `${label} (${count} não lidas)` : label;
  const content = (
    <Badge color="primary" variant="dot" invisible={count === 0}>
      {icon}
    </Badge>
  );

  return href ? (
    <IconButton component={Link} href={href} aria-label={ariaLabel} sx={iconButtonSx}>
      {content}
    </IconButton>
  ) : (
    <IconButton aria-label={ariaLabel} onClick={onClick} sx={iconButtonSx}>
      {content}
    </IconButton>
  );
}

export default function Header({
  userName = 'Usuário',
  avatarSrc,
  location,
  notificationsCount = 0,
  onNotificationsClick,
  messagesCount,
}: HeaderProps) {
  const unreadMessages = useUnreadMessages();
  const headerRef = useRef<HTMLElement>(null);
  // Depois de rolar um pouco, o cabeçalho ganha linha e sombra para se separar do conteúdo
  const scrolled = useScrollTrigger({ disableHysteresis: true, threshold: 4 });

  // Publica a altura do cabeçalho numa variável CSS: elementos fixos da página (ex.: busca e
  // filtros) usam `top: var(--app-header-height)` para encaixar logo abaixo dele
  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;
    const root = document.documentElement;
    const observer = new ResizeObserver(() => root.style.setProperty('--app-header-height', `${header.offsetHeight}px`));
    observer.observe(header);
    return () => {
      observer.disconnect();
      root.style.removeProperty('--app-header-height');
    };
  }, []);
  return (
    <AppBar
      ref={headerRef}
      position="sticky"
      elevation={0}
      color="transparent"
      sx={{
        top: 0,
        color: 'text.primary',
        // Fica sempre visível ao rolar. No topo é transparente (mostra o degradê do layout);
        // depois de rolar, ganha fundo levemente transparente com desfoque
        bgcolor: scrolled ? 'rgba(var(--mui-palette-background-defaultChannel) / 0.85)' : 'transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        borderBottom: 1,
        borderColor: scrolled ? 'divider' : 'transparent',
        boxShadow: scrolled ? '0 4px 16px rgba(0 0 0 / 0.08)' : 'none',
        transition: 'background-color 200ms, border-color 200ms, box-shadow 200ms',
      }}
    >
      <Container maxWidth="md" disableGutters>
        <Toolbar sx={{ justifyContent: 'space-between', gap: 2, py: { xs: 1.5, sm: 2.5 }, px: { xs: 2, sm: 3 } }}>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', minWidth: 0 }}>
            <Avatar
              src={avatarSrc}
              alt={userName}
              sx={{
                width: { xs: 48, sm: 56 },
                height: { xs: 48, sm: 56 },
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                border: 2,
                borderColor: 'background.paper',
              }}
            >
              {userName.charAt(0).toUpperCase()}
            </Avatar>

            <Box sx={{ minWidth: 0 }}>
              <Typography
                component="p"
                noWrap
                sx={{ fontWeight: 600, fontSize: { xs: '1.0625rem', sm: '1.25rem' }, lineHeight: 1.3 }}
              >
                Olá, {userName}
              </Typography>
              {location && (
                <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', color: 'text.secondary' }}>
                  <MapPin size={14} />
                  <Typography variant="body2" noWrap>
                    {location}
                  </Typography>
                </Stack>
              )}
            </Box>
          </Stack>

          <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
            <HeaderIconButton
              label="Mensagens"
              count={messagesCount ?? unreadMessages}
              icon={<MessageCircle size={20} />}
              href="/mensagens"
            />
            <HeaderIconButton
              label="Notificações"
              count={notificationsCount}
              icon={<Bell size={20} />}
              onClick={onNotificationsClick}
            />
          </Stack>
        </Toolbar>
      </Container>
    </AppBar>
  );
}

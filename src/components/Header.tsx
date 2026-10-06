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
import { Bell, MapPin } from 'lucide-react';

export interface HeaderProps {
  userName?: string;
  avatarSrc?: string;
  location?: string;
  notificationsCount?: number;
  onNotificationsClick?: () => void;
}

export default function Header({
  userName = 'Usuário',
  avatarSrc,
  location,
  notificationsCount = 0,
  onNotificationsClick,
}: HeaderProps) {
  return (
    <AppBar position="static" elevation={0} color="transparent" sx={{ color: 'text.primary' }}>
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

          <IconButton
            aria-label={`Notificações (${notificationsCount})`}
            onClick={onNotificationsClick}
            sx={{
              width: { xs: 44, sm: 52 },
              height: { xs: 44, sm: 52 },
              bgcolor: 'background.paper',
              color: 'text.primary',
              boxShadow: 1,
              '&:hover': { bgcolor: 'background.paper' },
            }}
          >
            <Badge color="primary" variant="dot" invisible={notificationsCount === 0}>
              <Bell size={20} />
            </Badge>
          </IconButton>
        </Toolbar>
      </Container>
    </AppBar>
  );
}

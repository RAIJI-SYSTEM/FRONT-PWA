'use client';

import AppBar from '@mui/material/AppBar';
import Avatar from '@mui/material/Avatar';
import Badge from '@mui/material/Badge';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import { NotificationsIcon, WalletIcon } from './icons';

export interface HeaderProps {
  userName?: string;
  avatarSrc?: string;
  balance?: number;
  currency?: string;
  notificationsCount?: number;
  onTopUp?: () => void;
  onNotificationsClick?: () => void;
}

export default function Header({
  userName = 'Usuário',
  avatarSrc,
  balance = 0,
  currency = '$',
  notificationsCount = 0,
  onTopUp,
  onNotificationsClick,
}: HeaderProps) {
  const [integer, cents] = balance.toFixed(2).split('.');

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        bgcolor: 'background.default',
        color: 'text.primary',
        borderBottom: 1,
        borderColor: 'divider',
      }}
    >
      <Container maxWidth="md" disableGutters>
        <Toolbar
          sx={{
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 2,
            py: { xs: 1.5, sm: 2 },
            px: { xs: 2, sm: 3 },
          }}
        >
          <Stack direction="row" component={'div'}>
            <Avatar src={avatarSrc} aria-label={`imagem de ${userName}`} />
            <Stack direction="column">
              <Typography variant='h6' component={'p'} >{userName} </Typography>
              <Typography variant='body2' component={'p'} >{`${currency}${integer}.${cents}`} </Typography>
            </Stack>
          </Stack>

          <Stack direction="row" spacing={1}>
            <IconButton
              color="inherit"
              onClick={onNotificationsClick}
              aria-label={`Notificações (${notificationsCount})`}
              sx={{ backgroundColor: 'orange' }}
            >
              <Badge badgeContent={notificationsCount} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
            <Button
              variant="contained"
              color="primary"
              onClick={onTopUp}
              startIcon={<WalletIcon />}
            >
              Adicionar Fundos
            </Button>
          </Stack>
        </Toolbar>
      </Container>
    </AppBar>
  );
}

'use client';

import { Fragment, useState } from 'react';
import Link from 'next/link';
import { BellOff, CheckCheck, Settings, X } from 'lucide-react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import ButtonBase from '@mui/material/ButtonBase';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import StatusScreen from '@/components/StatusScreen';
import FilterChips from '@/features/search/components/FilterChips';
import { usePolling } from '@/hooks/usePolling';
import { deleteNotification, listNotifications, markNotificationsRead } from '@/services/notifications';
import type { AppMode } from '@/types/message';
import type { AppNotification, NotificationCategory } from '@/types/notification';
import { formatDayLabel, formatMessageTime } from '@/utils/formatDate';
import { NOTIFICATION_CATEGORIES } from '../categories';

type Filter = 'all' | 'unread' | NotificationCategory;

const POLL_INTERVAL_MS = 20_000;
const keepPolling = () => true;

/** Uma notificação: toque abre o destino (e marca como lida); o X apaga */
function NotificationRow({ notification, onOpen, onDelete }: { notification: AppNotification; onOpen: () => void; onDelete: () => void }) {
  const { icon: Icon, label } = NOTIFICATION_CATEGORIES[notification.category];
  const unread = !notification.read;

  const content = (
    <Stack direction="row" spacing={1.5} sx={{ alignItems: 'flex-start', width: '100%', textAlign: 'left' }}>
      <Box
        aria-hidden
        sx={{
          width: 40,
          height: 40,
          flexShrink: 0,
          borderRadius: '50%',
          display: 'grid',
          placeItems: 'center',
          color: unread ? 'primary.contrastText' : 'primary.main',
          bgcolor: unread ? 'primary.main' : 'rgba(var(--mui-palette-primary-mainChannel) / 0.12)',
        }}
      >
        <Icon size={20} />
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'baseline', justifyContent: 'space-between' }}>
          <Typography sx={{ fontWeight: unread ? 800 : 600 }}>{notification.title}</Typography>
          <Typography variant="caption" sx={{ flexShrink: 0, color: unread ? 'primary.main' : 'text.secondary', fontWeight: unread ? 700 : 400 }}>
            {formatMessageTime(notification.createdAt)}
          </Typography>
        </Stack>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
        >
          {notification.body}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {label}
          {unread && ' · não lida'}
        </Typography>
      </Box>
    </Stack>
  );

  return (
    <Stack direction="row" sx={{ alignItems: 'flex-start', bgcolor: unread ? 'rgba(var(--mui-palette-primary-mainChannel) / 0.06)' : 'transparent' }}>
      {notification.href ? (
        <ButtonBase component={Link} href={notification.href} onClick={onOpen} sx={{ flex: 1, minWidth: 0, p: 2, justifyContent: 'flex-start' }}>
          {content}
        </ButtonBase>
      ) : (
        <ButtonBase onClick={onOpen} sx={{ flex: 1, minWidth: 0, p: 2, justifyContent: 'flex-start' }}>
          {content}
        </ButtonBase>
      )}
      {/* Fora da área de toque principal: apagar não abre a notificação */}
      <IconButton size="small" aria-label={`Apagar notificação: ${notification.title}`} onClick={onDelete} sx={{ mt: 1.5, mr: 0.5, color: 'text.secondary' }}>
        <X size={16} />
      </IconButton>
    </Stack>
  );
}

/** Notificações do modo (passageiro ou motorista), agrupadas por dia */
export default function NotificationsScreen({ mode = 'passenger' }: { mode?: AppMode }) {
  const { data: notifications, error, setData } = usePolling(`notifications-${mode}`, () => listNotifications(mode), keepPolling, POLL_INTERVAL_MS);
  const [filter, setFilter] = useState<Filter>('all');
  const [actionError, setActionError] = useState<string | null>(null);

  if (!notifications) {
    return error ? (
      <Alert severity="error">{error}</Alert>
    ) : (
      <Stack sx={{ alignItems: 'center', py: 8 }}>
        <CircularProgress />
      </Stack>
    );
  }

  const unreadCount = notifications.filter((n) => !n.read).length;
  const presentCategories = (Object.keys(NOTIFICATION_CATEGORIES) as NotificationCategory[]).filter((c) => notifications.some((n) => n.category === c));
  const visible = notifications.filter((n) => filter === 'all' || (filter === 'unread' ? !n.read : n.category === filter));

  // Atualiza na hora (otimista) e confirma no servidor
  const open = (notification: AppNotification) => {
    if (notification.read) return;
    setData((prev) => prev?.map((n) => (n.id === notification.id ? { ...n, read: true } : n)) ?? prev);
    markNotificationsRead(mode, [notification.id]).catch(() => undefined);
  };

  const markAll = async () => {
    setActionError(null);
    try {
      setData(await markNotificationsRead(mode));
    } catch {
      setActionError('Não foi possível marcar como lidas.');
    }
  };

  const remove = async (notification: AppNotification) => {
    setActionError(null);
    const previous = notifications;
    setData((prev) => prev?.filter((n) => n.id !== notification.id) ?? prev);
    try {
      await deleteNotification(mode, notification.id);
    } catch {
      setData(previous);
      setActionError('Não foi possível apagar a notificação.');
    }
  };

  // Onde começa cada dia (comparando com a notificação anterior)
  const rows = visible.map((notification, index) => {
    const day = formatDayLabel(notification.createdAt);
    return { notification, day, newDay: index === 0 || formatDayLabel(visible[index - 1].createdAt) !== day };
  });

  return (
    <Stack spacing={2}>
      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="body2" color="text.secondary" aria-live="polite">
          {unreadCount > 0 ? `${unreadCount} não lida${unreadCount === 1 ? '' : 's'}` : 'Tudo em dia'}
        </Typography>
        <Button size="small" onClick={markAll} disabled={unreadCount === 0} startIcon={<CheckCheck size={16} />} sx={{ textTransform: 'none', fontWeight: 600 }}>
          Marcar todas como lidas
        </Button>
      </Stack>

      <FilterChips
        label="Filtrar notificações"
        options={[
          { value: 'all', label: 'Todas' },
          { value: 'unread', label: `Não lidas · ${unreadCount}` },
          ...presentCategories.map((c) => ({ value: c, label: NOTIFICATION_CATEGORIES[c].label })),
        ]}
        value={filter}
        onChange={setFilter}
      />

      {actionError && (
        <Alert severity="error" onClose={() => setActionError(null)}>
          {actionError}
        </Alert>
      )}

      {visible.length === 0 ? (
        <StatusScreen
          icon={BellOff}
          title={filter === 'unread' ? 'Nenhuma notificação não lida' : 'Nenhuma notificação por aqui'}
          description="Avisos sobre suas viagens, encomendas e pagamentos aparecem aqui."
        />
      ) : (
        <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
          {rows.map(({ notification, day, newDay }, index) => {
            return (
              <Fragment key={notification.id}>
                {newDay ? (
                  <Typography
                    component="h2"
                    variant="overline"
                    color="text.secondary"
                    sx={{ display: 'block', px: 2, pt: index === 0 ? 1.5 : 2, pb: 0.5, fontWeight: 700, letterSpacing: 1, borderTop: index === 0 ? 0 : 1, borderColor: 'divider' }}
                  >
                    {day}
                  </Typography>
                ) : (
                  <Divider sx={{ ml: 9 }} />
                )}
                <NotificationRow notification={notification} onOpen={() => open(notification)} onDelete={() => remove(notification)} />
              </Fragment>
            );
          })}
        </Paper>
      )}

      <Button
        component={Link}
        href={mode === 'driver' ? '/configuracoes?modo=motorista#notificacoes' : '/configuracoes#notificacoes'}
        color="inherit"
        startIcon={<Settings size={18} />}
        sx={{ alignSelf: 'center', textTransform: 'none', fontWeight: 600 }}
      >
        Escolher quais notificações receber
      </Button>
    </Stack>
  );
}

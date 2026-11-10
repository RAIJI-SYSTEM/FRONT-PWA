'use client';

import { useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Typography from '@mui/material/Typography';
import { NOTIFICATION_CATEGORIES } from '@/features/notifications/categories';
import { usePolling } from '@/hooks/usePolling';
import { getNotificationPreferences, updateNotificationPreferences } from '@/services/notifications';
import type { AppMode } from '@/types/message';
import type { NotificationCategory, NotificationPreferences } from '@/types/notification';

const loadOnce = () => false;
const TOGGLEABLE: (keyof NotificationPreferences)[] = ['trips', 'deliveries', 'payments', 'messages', 'promotions'];

/** Liga/desliga cada tipo de notificação. "Conta" (segurança e documentos) fica sempre ativa. */
export default function NotificationSettings({ mode }: { mode: AppMode }) {
  const { data: prefs, error, setData } = usePolling(`notification-prefs-${mode}`, () => getNotificationPreferences(mode), loadOnce);
  const [saveError, setSaveError] = useState<string | null>(null);

  if (error) return <Alert severity="error">{error}</Alert>;
  if (!prefs) return <Skeleton variant="rounded" height={320} sx={{ borderRadius: 3 }} />;

  const toggle = async (key: keyof NotificationPreferences, value: boolean) => {
    setSaveError(null);
    const previous = prefs;
    setData({ ...prefs, [key]: value }); // muda na hora; desfaz se o servidor recusar
    try {
      setData(await updateNotificationPreferences(mode, { [key]: value }));
    } catch {
      setData(previous);
      setSaveError('Não foi possível salvar. Tente de novo.');
    }
  };

  const rows: { key: NotificationCategory; checked: boolean; locked: boolean }[] = [
    ...TOGGLEABLE.map((key) => ({ key, checked: prefs[key], locked: false })),
    { key: 'account', checked: true, locked: true },
  ];

  return (
    <Stack spacing={1.5}>
      {saveError && <Alert severity="error">{saveError}</Alert>}
      <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
        {rows.map(({ key, checked, locked }, index) => {
          const { label, description, icon: Icon } = NOTIFICATION_CATEGORIES[key];
          return (
            <Box key={key}>
              {index > 0 && <Divider sx={{ ml: 8 }} />}
              <Stack component="label" direction="row" spacing={1.5} sx={{ alignItems: 'center', p: 1.75, cursor: locked ? 'default' : 'pointer' }}>
                <Box sx={{ width: 40, height: 40, flexShrink: 0, borderRadius: 2, display: 'grid', placeItems: 'center', color: 'primary.main', bgcolor: 'rgba(var(--mui-palette-primary-mainChannel) / 0.12)' }}>
                  <Icon size={20} />
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 700 }}>{label}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {description}
                  </Typography>
                </Box>
                <Switch
                  checked={checked}
                  disabled={locked}
                  onChange={(e) => toggle(key as keyof NotificationPreferences, e.target.checked)}
                  slotProps={{ input: { 'aria-label': `Notificações de ${label.toLowerCase()}` } }}
                />
              </Stack>
            </Box>
          );
        })}
      </Paper>
    </Stack>
  );
}

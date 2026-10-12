'use client';

import { useState } from 'react';
import { MessageCircleOff } from 'lucide-react';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import List from '@mui/material/List';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import StatusScreen from '@/components/StatusScreen';
import { usePolling } from '@/hooks/usePolling';
import { listConversations } from '@/services/messages';
import type { ConversationKind } from '@/types/message';
import ConversationListItem from './ConversationListItem';

type Filter = 'all' | ConversationKind;

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'Todas' },
  { value: 'driver', label: 'Motoristas' },
  { value: 'group', label: 'Grupos' },
];

const POLL_INTERVAL_MS = 10_000;
const keepPolling = () => true;

/** Caixa de entrada: conversas diretas com motoristas e grupos de viagens compartilhadas */
export default function InboxScreen() {
  const [filter, setFilter] = useState<Filter>('all');
  const { data: conversations, error } = usePolling('inbox', listConversations, keepPolling, POLL_INTERVAL_MS);

  if (!conversations) {
    return error ? (
      <Alert severity="error">{error}</Alert>
    ) : (
      <Stack sx={{ alignItems: 'center', py: 8 }}>
        <CircularProgress />
      </Stack>
    );
  }

  const visible = filter === 'all' ? conversations : conversations.filter((c) => c.kind === filter);
  const unreadByFilter = (value: Filter) =>
    conversations.filter((c) => (value === 'all' || c.kind === value) && c.unreadCount > 0).length;

  return (
    <Stack spacing={2}>
      <Tabs
        value={filter}
        onChange={(_, value: Filter) => setFilter(value)}
        variant="fullWidth"
        aria-label="Filtrar conversas"
        sx={{
          minHeight: 44,
          p: 0.5,
          borderRadius: 999,
          bgcolor: 'background.paper',
          border: 1,
          borderColor: 'divider',
          '& .MuiTabs-indicator': { height: '100%', borderRadius: 999, zIndex: 0 },
          '& .MuiTab-root': { minHeight: 36, zIndex: 1, textTransform: 'none', fontWeight: 600, borderRadius: 999 },
          '& .MuiTab-root.Mui-selected': { color: 'primary.contrastText' },
        }}
      >
        {FILTERS.map(({ value, label }) => {
          const unread = unreadByFilter(value);
          return <Tab key={value} value={value} label={unread > 0 ? `${label} (${unread})` : label} />;
        })}
      </Tabs>

      {visible.length === 0 ? (
        <StatusScreen
          icon={MessageCircleOff}
          title="Nenhuma conversa por aqui"
          description={
            filter === 'group'
              ? 'Quando você dividir uma corrida com outras pessoas, o grupo da viagem aparece aqui.'
              : 'Quando um motorista aceitar sua corrida ou encomenda, vocês podem conversar por aqui.'
          }
        />
      ) : (
        <Paper variant="outlined" sx={{ borderRadius: 3, p: 0.5 }}>
          <List disablePadding aria-label="Conversas">
            {visible.map((conversation) => (
              <ConversationListItem key={conversation.id} conversation={conversation} />
            ))}
          </List>
        </Paper>
      )}
    </Stack>
  );
}

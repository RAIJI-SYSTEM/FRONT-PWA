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
import FilterChips from '@/features/search/components/FilterChips';
import type { AppMode, ConversationKind, ConversationSummary } from '@/types/message';
import ConversationListItem from './ConversationListItem';

/** "clients" (modo motorista) junta passageiros pessoa física e empresas (pessoa jurídica) */
type Filter = 'all' | 'clients' | ConversationKind;
type PersonFilter = 'all' | 'pf' | 'pj';
type ServiceFilter = 'all' | 'ride' | 'delivery';

/** Abas de cada modo: o passageiro conversa com motoristas; o motorista, com clientes e grupos */
const FILTERS: Record<AppMode, { value: Filter; label: string }[]> = {
  passenger: [
    { value: 'all', label: 'Todas' },
    { value: 'driver', label: 'Motoristas' },
    { value: 'group', label: 'Grupos' },
  ],
  driver: [
    { value: 'all', label: 'Todas' },
    { value: 'clients', label: 'Clientes' },
    { value: 'group', label: 'Grupos' },
  ],
};

const isClient = (c: ConversationSummary) => c.kind === 'passenger' || c.kind === 'company';

const matchesFilter = (c: ConversationSummary, filter: Filter) =>
  filter === 'all' || (filter === 'clients' ? isClient(c) : c.kind === filter);

/** Pessoa jurídica = empresa; pessoa física = passageiro */
const matchesPerson = (c: ConversationSummary, person: PersonFilter) =>
  person === 'all' || (person === 'pj' ? c.kind === 'company' : c.kind === 'passenger');

/** Pelo tipo da viagem ligada à conversa */
const matchesService = (c: ConversationSummary, service: ServiceFilter) => service === 'all' || c.context?.kind === service;

const EMPTY_DESCRIPTION: Record<AppMode, Partial<Record<Filter, string>> & { all: string }> = {
  passenger: {
    all: 'Quando um motorista aceitar sua corrida ou encomenda, vocês podem conversar por aqui.',
    group: 'Quando você dividir uma corrida com outras pessoas, o grupo da viagem aparece aqui.',
  },
  driver: {
    all: 'Quando você aceitar uma corrida ou encomenda, a conversa com o cliente aparece aqui.',
    clients: 'Nenhum cliente com esses filtros. Tente outro tipo de pessoa ou de viagem.',
    group: 'Os passageiros das suas rotas publicadas conversam com você em grupo por aqui.',
  },
};

const POLL_INTERVAL_MS = 10_000;
const keepPolling = () => true;

/**
 * Caixa de entrada de cada modo. Passageiro: motoristas e grupos de viagem.
 * Motorista: clientes (pessoa física ou jurídica, de caronas ou encomendas) e grupos das suas rotas.
 */
export default function InboxScreen({ mode = 'passenger' }: { mode?: AppMode }) {
  const [filter, setFilter] = useState<Filter>('all');
  const [person, setPerson] = useState<PersonFilter>('all');
  const [service, setService] = useState<ServiceFilter>('all');
  const { data: conversations, error } = usePolling(`inbox-${mode}`, () => listConversations(mode), keepPolling, POLL_INTERVAL_MS);
  const filters = FILTERS[mode];

  if (!conversations) {
    return error ? (
      <Alert severity="error">{error}</Alert>
    ) : (
      <Stack sx={{ alignItems: 'center', py: 8 }}>
        <CircularProgress />
      </Stack>
    );
  }

  // Os filtros de pessoa e de viagem só valem dentro de "Clientes"
  const inClients = filter === 'clients';
  const visible = conversations.filter(
    (c) => matchesFilter(c, filter) && (!inClients || (matchesPerson(c, person) && matchesService(c, service))),
  );
  const unreadByFilter = (value: Filter) => conversations.filter((c) => matchesFilter(c, value) && c.unreadCount > 0).length;
  const clients = conversations.filter(isClient);

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
        {filters.map(({ value, label }) => {
          const unread = unreadByFilter(value);
          return <Tab key={value} value={value} label={unread > 0 ? `${label} (${unread})` : label} />;
        })}
      </Tabs>

      {inClients && (
        <Stack spacing={1}>
          <FilterChips
            label="Tipo de cliente"
            options={[
              { value: 'all', label: 'Todos' },
              { value: 'pf', label: `Pessoa física · ${clients.filter((c) => matchesPerson(c, 'pf')).length}` },
              { value: 'pj', label: `Pessoa jurídica · ${clients.filter((c) => matchesPerson(c, 'pj')).length}` },
            ]}
            value={person}
            onChange={setPerson}
          />
          <FilterChips
            label="Tipo de viagem"
            options={[
              { value: 'all', label: 'Todas as viagens' },
              { value: 'ride', label: `Caronas · ${clients.filter((c) => matchesService(c, 'ride')).length}` },
              { value: 'delivery', label: `Encomendas · ${clients.filter((c) => matchesService(c, 'delivery')).length}` },
            ]}
            value={service}
            onChange={setService}
          />
        </Stack>
      )}

      {visible.length === 0 ? (
        <StatusScreen
          icon={MessageCircleOff}
          title="Nenhuma conversa por aqui"
          description={EMPTY_DESCRIPTION[mode][filter] ?? EMPTY_DESCRIPTION[mode].all}
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

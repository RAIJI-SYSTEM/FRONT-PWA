'use client';

import Link from 'next/link';
import { Car, Package } from 'lucide-react';
import Box from '@mui/material/Box';
import ListItemButton from '@mui/material/ListItemButton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { ME_ID, SYSTEM_ID, type ConversationSummary } from '@/types/message';
import { formatMessageTime } from '@/utils/formatDate';
import { describeMessage } from '../describe';
import ConversationAvatar from './ConversationAvatar';
import { routes } from '@/utils/routes';

/** Prévia da última mensagem: "Você: ...", "Ana: ..." (em grupos) ou só o texto */
function preview(conversation: ConversationSummary) {
  const last = conversation.lastMessage;
  if (!last) return 'Nenhuma mensagem ainda';
  const content = describeMessage(last); // "Foto", "Mensagem de voz (0:04)", nome do documento...
  if (last.senderId === ME_ID) return `Você: ${content}`;
  // Conversa direta (motorista, passageiro ou empresa): não precisa dizer quem mandou
  if (last.senderId === SYSTEM_ID || conversation.kind !== 'group') return content;
  const sender = conversation.participants.find((p) => p.id === last.senderId);
  return `${sender?.name.split(' ')[0] ?? 'Alguém'}: ${content}`;
}

export default function ConversationListItem({ conversation }: { conversation: ConversationSummary }) {
  const unread = conversation.unreadCount > 0;
  const ContextIcon = conversation.context?.kind === 'delivery' ? Package : Car;

  return (
    <ListItemButton
      component={Link}
      href={routes.conversation(conversation.id)}
      sx={{ gap: 1.5, py: 1.5, px: 2, borderRadius: 3, alignItems: 'center' }}
    >
      <ConversationAvatar conversation={conversation} />

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'baseline', justifyContent: 'space-between' }}>
          <Typography sx={{ fontWeight: unread ? 800 : 700 }} noWrap>
            {conversation.title}
          </Typography>
          {conversation.lastMessage && (
            <Typography
              variant="caption"
              sx={{ flexShrink: 0, color: unread ? 'primary.main' : 'text.secondary', fontWeight: unread ? 700 : 400 }}
            >
              {formatMessageTime(conversation.lastMessage.sentAt)}
            </Typography>
          )}
        </Stack>

        {conversation.context && (
          <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', color: 'text.secondary', minWidth: 0 }}>
            <ContextIcon size={13} style={{ flexShrink: 0 }} />
            <Typography variant="caption" sx={{ flexShrink: 0 }}>
              {conversation.context.label} ·
            </Typography>
            {/* Grupo: mostra a rota inteira. Só a origem encolhe com "…", para o destino nunca sumir */}
            {conversation.kind === 'group' && (
              <Typography variant="caption" noWrap sx={{ minWidth: 24 }}>
                {conversation.context.origin}
              </Typography>
            )}
            <Typography variant="caption" noWrap sx={{ flexShrink: conversation.kind === 'group' ? 0 : 1 }}>
              {conversation.kind === 'group' && '→ '}
              {conversation.context.destination}
            </Typography>
          </Stack>
        )}

        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography
            variant="body2"
            noWrap
            sx={{ color: unread ? 'text.primary' : 'text.secondary', fontWeight: unread ? 600 : 400 }}
          >
            {preview(conversation)}
          </Typography>
          {unread && (
            <Box
              aria-label={`${conversation.unreadCount} não lidas`}
              sx={{
                flexShrink: 0,
                minWidth: 22,
                height: 22,
                px: 0.75,
                borderRadius: 999,
                display: 'grid',
                placeItems: 'center',
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                fontSize: '0.75rem',
                fontWeight: 700,
              }}
            >
              {conversation.unreadCount}
            </Box>
          )}
        </Stack>
      </Box>
    </ListItemButton>
  );
}

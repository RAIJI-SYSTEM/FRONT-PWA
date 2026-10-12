'use client';

import { Fragment, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Car, ChevronRight, Package } from 'lucide-react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Container from '@mui/material/Container';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { usePolling } from '@/hooks/usePolling';
import { getConversation, sendMessage } from '@/services/messages';
import { ME_ID, SYSTEM_ID, type Attachment, type ChatMessage, type Conversation } from '@/types/message';
import { formatDayLabel } from '@/utils/formatDate';
import ChatComposer, { type OutgoingMessage } from './ChatComposer';
import ConversationAvatar from './ConversationAvatar';
import MessageBubble from './MessageBubble';

const POLL_INTERVAL_MS = 2500;
const keepPolling = () => true;

/** Respostas prontas para a conversa com o motorista */
const QUICK_REPLIES = ['Já estou no local', 'Estou descendo', 'Pode me esperar 2 min?', 'Obrigado!'];

interface PendingMessage {
  key: number;
  text: string;
  attachments: Attachment[];
  sentAt: string;
}

let pendingSeq = 0;
/** Mensagem exibida como "Enviando…" até o servidor confirmar */
const createPending = ({ text, attachments }: OutgoingMessage): PendingMessage => ({
  key: ++pendingSeq,
  text,
  attachments,
  sentAt: new Date().toISOString(),
});

function TypingIndicator({ name }: { name: string }) {
  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: 'center', color: 'text.secondary' }} aria-live="polite">
      <Box
        sx={{
          display: 'flex',
          gap: 0.5,
          px: 1.5,
          py: 1.25,
          borderRadius: 3,
          bgcolor: 'background.paper',
          border: 1,
          borderColor: 'divider',
          '@keyframes blink': { '0%, 80%, 100%': { opacity: 0.25 }, '40%': { opacity: 1 } },
          '& span': {
            width: 6,
            height: 6,
            borderRadius: '50%',
            bgcolor: 'text.secondary',
            animation: 'blink 1.2s infinite',
            '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
          },
        }}
      >
        <span />
        <span style={{ animationDelay: '0.2s' }} />
        <span style={{ animationDelay: '0.4s' }} />
      </Box>
      <Typography variant="caption">{name.split(' ')[0]} está digitando…</Typography>
    </Stack>
  );
}

function ContextCard({ conversation }: { conversation: Conversation }) {
  const context = conversation.context;
  if (!context) return null;
  const Icon = context.kind === 'delivery' ? Package : Car;
  return (
    <ButtonBase
      component={Link}
      href={context.href}
      sx={{
        width: '100%',
        justifyContent: 'flex-start',
        gap: 1.5,
        p: 1.5,
        borderRadius: 3,
        textAlign: 'left',
        border: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper',
      }}
    >
      <Box
        sx={{
          width: 40,
          height: 40,
          flexShrink: 0,
          borderRadius: 2,
          display: 'grid',
          placeItems: 'center',
          color: 'primary.main',
          bgcolor: 'rgba(var(--mui-palette-primary-mainChannel) / 0.12)',
        }}
      >
        <Icon size={20} />
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="caption" color="text.secondary">
          {context.label}
        </Typography>
        <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
          {context.origin} → {context.destination}
        </Typography>
      </Box>
      <ChevronRight size={18} />
    </ButtonBase>
  );
}

/** Conversa com o motorista ou com o grupo da viagem compartilhada */
export default function ChatScreen({ conversationId }: { conversationId: string }) {
  const { data: conversation, error, setData } = usePolling(conversationId, getConversation, keepPolling, POLL_INTERVAL_MS);
  const [pending, setPending] = useState<PendingMessage[]>([]);
  const [sendError, setSendError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const messageCount = (conversation?.messages.length ?? 0) + pending.length;

  // Rola para a última mensagem quando chega ou sai uma nova
  useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTo({ top: list.scrollHeight, behavior: 'smooth' });
  }, [messageCount, conversation?.typing]);

  const send = async (outgoing: OutgoingMessage) => {
    setSendError(null);
    // Mostra a mensagem na hora ("Enviando…"), antes da resposta do servidor
    const item = createPending(outgoing);
    setPending((prev) => [...prev, item]);
    try {
      const sent = await sendMessage(conversationId, {
        text: outgoing.text,
        attachmentIds: outgoing.attachments.map((a) => a.id),
      });
      // A consulta periódica pode já ter trazido a mensagem: evita duplicar
      setData((prev) =>
        prev && !prev.messages.some((m) => m.id === sent.id) ? { ...prev, messages: [...prev.messages, sent] } : prev,
      );
    } catch (err) {
      setSendError(err instanceof Error ? err.message : 'Não foi possível enviar.');
    } finally {
      setPending((prev) => prev.filter((p) => p.key !== item.key));
    }
  };

  if (!conversation) {
    return (
      <Box sx={{ pt: 2 }}>
        {error ? (
          <Alert severity="error">{error}</Alert>
        ) : (
          <Stack sx={{ alignItems: 'center', py: 8 }}>
            <CircularProgress />
          </Stack>
        )}
      </Box>
    );
  }

  const isGroup = conversation.kind === 'group';
  const participant = (id: string) => conversation.participants.find((p) => p.id === id);

  const renderMessage = (message: ChatMessage, index: number) => {
    const previous = conversation.messages[index - 1];
    const newDay = !previous || new Date(previous.sentAt).toDateString() !== new Date(message.sentAt).toDateString();

    return (
      <Fragment key={message.id}>
        {newDay && (
          <Chip label={formatDayLabel(message.sentAt)} size="small" sx={{ alignSelf: 'center', fontWeight: 600, my: 1 }} />
        )}
        {message.senderId === SYSTEM_ID ? (
          <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'center', textAlign: 'center', px: 2 }}>
            {message.text}
          </Typography>
        ) : (
          <MessageBubble
            message={message}
            mine={message.senderId === ME_ID}
            sender={isGroup && message.senderId !== ME_ID ? participant(message.senderId) : undefined}
            // Nome e avatar só na primeira mensagem de uma sequência da mesma pessoa
            showSender={newDay || previous?.senderId !== message.senderId}
          />
        )}
      </Fragment>
    );
  };

  return (
    // Tela cheia: cabeçalho fixo, mensagens roláveis e campo de texto sempre visível
    <Box sx={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
      <Box component="header" sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.default' }}>
        <Container maxWidth="sm" sx={{ px: { xs: 1.5, sm: 3 } }}>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', py: 1.25 }}>
            <IconButton component={Link} href="/mensagens" aria-label="Voltar para as conversas">
              <ArrowLeft size={20} />
            </IconButton>
            <ConversationAvatar conversation={conversation} size={40} />
            <Box sx={{ minWidth: 0 }}>
              <Typography component="h1" sx={{ fontWeight: 700 }} noWrap>
                {conversation.title}
              </Typography>
              <Typography variant="caption" color={conversation.typing ? 'primary.main' : 'text.secondary'} noWrap sx={{ display: 'block' }}>
                {conversation.typing
                  ? 'digitando…'
                  : isGroup
                    ? conversation.participants.map((p) => p.name.split(' ')[0]).join(', ')
                    : conversation.subtitle}
              </Typography>
            </Box>
          </Stack>
        </Container>
      </Box>

      <Box ref={listRef} sx={{ flex: 1, overflowY: 'auto' }}>
        <Container maxWidth="sm" sx={{ px: { xs: 1.5, sm: 3 }, py: 2 }}>
          <Stack spacing={1} role="log" aria-label="Mensagens" aria-live="polite">
            <ContextCard conversation={conversation} />
            {conversation.messages.map(renderMessage)}
            {pending.map((p) => (
              <MessageBubble key={p.key} message={p} mine sending />
            ))}
            {conversation.typing && <TypingIndicator name={conversation.typing} />}
          </Stack>
        </Container>
      </Box>

      <Box sx={{ borderTop: 1, borderColor: 'divider', bgcolor: 'background.default', pb: 'env(safe-area-inset-bottom)' }}>
        <Container maxWidth="sm" sx={{ px: { xs: 1.5, sm: 3 }, py: 1.25 }}>
          {sendError && (
            <Alert severity="error" sx={{ mb: 1 }} onClose={() => setSendError(null)}>
              {sendError}
            </Alert>
          )}
          <ChatComposer
            placeholder={isGroup ? 'Mensagem para o grupo' : `Mensagem para ${conversation.title.split(' ')[0]}`}
            quickReplies={isGroup ? undefined : QUICK_REPLIES}
            onSend={send}
          />
        </Container>
      </Box>
    </Box>
  );
}

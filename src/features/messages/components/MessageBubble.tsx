import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { ChatMessage, Participant } from '@/types/message';
import { formatTime } from '@/utils/formatDate';
import { participantNameSx } from '../participantColor';
import MessageAttachments from './attachments/MessageAttachments';
import { ParticipantAvatar } from './ConversationAvatar';

interface MessageBubbleProps {
  message: Pick<ChatMessage, 'text' | 'sentAt' | 'attachments'>;
  mine: boolean;
  /** Grupos: mostra nome e avatar de quem enviou (só na primeira de uma sequência) */
  sender?: Participant;
  showSender?: boolean;
  sending?: boolean;
}

export default function MessageBubble({ message, mine, sender, showSender, sending }: MessageBubbleProps) {
  const attachments = message.attachments ?? [];
  // Foto sem legenda: balão mais "justo", com a imagem quase encostando na borda
  const imageOnly = !message.text && attachments.length > 0 && attachments.every((a) => a.type === 'image');

  return (
    <Stack direction="row" spacing={1} sx={{ justifyContent: mine ? 'flex-end' : 'flex-start', alignItems: 'flex-end' }}>
      {/* Espaço do avatar mantém as mensagens do grupo alinhadas */}
      {sender && (
        <Box sx={{ width: 32, flexShrink: 0 }}>{showSender && <ParticipantAvatar participant={sender} size={32} />}</Box>
      )}

      <Box
        sx={{
          maxWidth: '78%',
          px: imageOnly ? 0.5 : 1.75,
          py: imageOnly ? 0.5 : 1,
          borderRadius: 3,
          // "Rabinho" do balão no canto de quem fala
          borderBottomRightRadius: mine ? 6 : undefined,
          borderBottomLeftRadius: mine ? undefined : 6,
          bgcolor: mine ? 'primary.main' : 'background.paper',
          color: mine ? 'primary.contrastText' : 'text.primary',
          border: mine ? 0 : 1,
          borderColor: 'divider',
          opacity: sending ? 0.7 : 1,
        }}
      >
        {sender && showSender && (
          <Typography
            variant="caption"
            sx={{ display: 'block', fontWeight: 700, px: imageOnly ? 1 : 0, ...participantNameSx(sender.id) }}
          >
            {sender.name}
            {sender.role === 'driver' && ' · motorista'}
          </Typography>
        )}
        {attachments.length > 0 && (
          <Box sx={{ mb: message.text ? 0.75 : 0, mt: sender && showSender ? 0.5 : 0 }}>
            <MessageAttachments attachments={attachments} mine={mine} />
          </Box>
        )}
        {message.text && <Typography sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{message.text}</Typography>}
        <Typography variant="caption" sx={{ display: 'block', textAlign: 'right', opacity: 0.75, mt: 0.25, px: imageOnly ? 1 : 0 }}>
          {sending ? 'Enviando…' : formatTime(message.sentAt)}
        </Typography>
      </Box>
    </Stack>
  );
}

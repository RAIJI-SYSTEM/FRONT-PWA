import { Users } from 'lucide-react';
import Avatar from '@mui/material/Avatar';
import AvatarGroup from '@mui/material/AvatarGroup';
import Badge from '@mui/material/Badge';
import { ME_ID, type ConversationSummary, type Participant } from '@/types/message';
import { participantColor } from '../participantColor';

export function ParticipantAvatar({ participant, size = 40 }: { participant: Participant; size?: number }) {
  return (
    <Avatar
      // Empresas com avatar quadrado, para diferenciar de pessoas
      variant={participant.role === 'company' ? 'rounded' : 'circular'}
      sx={{ width: size, height: size, bgcolor: participantColor(participant.id), color: '#fff', fontWeight: 700, fontSize: size * 0.42, borderRadius: participant.role === 'company' ? 1 : undefined }}
    >
      {participant.name.charAt(0)}
    </Avatar>
  );
}

/** Motorista: avatar dele. Grupo: dois rostos sobrepostos + ícone de grupo. */
export default function ConversationAvatar({ conversation, size = 52 }: { conversation: ConversationSummary; size?: number }) {
  const others = conversation.participants.filter((p) => p.id !== ME_ID);

  if (conversation.kind !== 'group') {
    return <ParticipantAvatar participant={others[0]} size={size} />;
  }

  return (
    <Badge
      overlap="circular"
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      badgeContent={
        <Avatar sx={{ width: 20, height: 20, bgcolor: 'primary.main', color: 'primary.contrastText', border: 2, borderColor: 'background.paper' }}>
          <Users size={11} />
        </Avatar>
      }
    >
      <AvatarGroup
        max={2}
        spacing={size * 0.45}
        sx={{ width: size, height: size, alignItems: 'center', '& .MuiAvatar-root': { borderWidth: 2 } }}
      >
        {others.slice(0, 2).map((p) => (
          <ParticipantAvatar key={p.id} participant={p} size={size * 0.7} />
        ))}
      </AvatarGroup>
    </Badge>
  );
}

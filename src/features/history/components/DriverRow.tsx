'use client';

import Link from 'next/link';
import { MessageCircle, Star } from 'lucide-react';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Rating from '@mui/material/Rating';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { participantColor } from '@/features/messages/participantColor';
import type { DriverRating, HistoryDriver } from '@/types/history';

interface DriverRowProps {
  driver: HistoryDriver;
  rating?: DriverRating;
  /** Terminou (pode avaliar) */
  finished: boolean;
  /** Em andamento/agendada (pode conversar) */
  active: boolean;
  onRate: () => void;
}

/** Motorista + ação do momento: avaliar, ver a nota dada ou mandar mensagem */
export default function DriverRow({ driver, rating, finished, active, onRate }: DriverRowProps) {
  return (
    <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
      <Avatar sx={{ width: 36, height: 36, bgcolor: participantColor(driver.id), color: '#fff', fontWeight: 700, fontSize: '0.95rem' }}>
        {driver.name.charAt(0)}
      </Avatar>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
          {driver.name}
        </Typography>
        <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
          {driver.vehicle}
        </Typography>
      </Box>

      {rating ? (
        <Stack sx={{ alignItems: 'flex-end', flexShrink: 0 }}>
          <Rating
            value={rating.stars}
            readOnly
            size="small"
            icon={<Star size={16} fill="currentColor" />}
            emptyIcon={<Star size={16} />}
            sx={{ color: 'primary.main' }}
            aria-label={`Você deu ${rating.stars} de 5 estrelas`}
          />
          <Typography variant="caption" color="text.secondary">
            Sua avaliação
          </Typography>
        </Stack>
      ) : finished ? (
        <Button
          size="small"
          variant="contained"
          onClick={onRate}
          startIcon={<Star size={16} />}
          sx={{ flexShrink: 0, borderRadius: 999, textTransform: 'none', fontWeight: 600 }}
        >
          Avaliar
        </Button>
      ) : active ? (
        <Button
          size="small"
          variant="outlined"
          component={Link}
          href="/mensagens"
          startIcon={<MessageCircle size={16} />}
          sx={{ flexShrink: 0, borderRadius: 999, textTransform: 'none', fontWeight: 600 }}
        >
          Mensagem
        </Button>
      ) : null}
    </Stack>
  );
}

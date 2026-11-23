'use client';

import Link from 'next/link';
import { ChevronRight, Megaphone } from 'lucide-react';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { usePolling } from '@/hooks/usePolling';
import type { BoardKindApi } from '@/services/backend/types';
import { listMyBoard } from '@/services/board';
import { routes } from '@/utils/routes';
import { boardWhen } from '../boardLabels';

const keepPolling = () => true;

/** "No mural": meus pedidos abertos, esperando oferta ou com oferta para escolher */
export default function MyBoardSection({ kind }: { kind: BoardKindApi }) {
  const { data } = usePolling('my-board', listMyBoard, keepPolling, 20_000);
  const open = (data ?? []).filter((r) => r.kind === kind && r.status === 'OPEN');
  if (open.length === 0) return null;

  return (
    <Box component="section" aria-labelledby="board-title">
      <Typography id="board-title" component="h2" sx={{ fontWeight: 700, mb: 1 }}>
        No mural
      </Typography>
      <Stack spacing={1}>
        {open.map((r) => (
          <ButtonBase
            key={r.id}
            component={Link}
            href={routes.board(r.id)}
            sx={{ p: 1.5, gap: 1.5, borderRadius: 3, border: 1, borderColor: 'divider', bgcolor: 'background.paper', textAlign: 'left', justifyContent: 'flex-start' }}
          >
            <Megaphone size={20} style={{ flexShrink: 0 }} color="var(--mui-palette-primary-main)" />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="body2" sx={{ fontWeight: 700 }} noWrap>
                {r.description ? `${r.description} · ` : ''}
                {r.originCity} → {r.destinationCity}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {boardWhen(r)}
              </Typography>
            </Box>
            <Chip
              size="small"
              color={r.pendingOffers > 0 ? 'primary' : 'default'}
              label={r.pendingOffers === 0 ? 'Sem ofertas' : r.pendingOffers === 1 ? '1 oferta' : `${r.pendingOffers} ofertas`}
            />
            <ChevronRight size={18} style={{ flexShrink: 0 }} />
          </ButtonBase>
        ))}
      </Stack>
    </Box>
  );
}

import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import RouteSummary from '@/features/activities/components/RouteSummary';

interface HistoryCardProps {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  status: { label: string; color: 'default' | 'primary' | 'secondary' | 'success' };
  origin: string;
  destination: string;
  /** Linha de detalhes (preço, distância, etiquetas...) */
  details: ReactNode;
  /** Motorista e ação (avaliar/mensagem) */
  footer: ReactNode;
  muted?: boolean;
}

/** Estrutura comum dos cartões de corrida e de encomenda */
export default function HistoryCard({ icon: Icon, title, subtitle, status, origin, destination, details, footer, muted }: HistoryCardProps) {
  return (
    <Paper variant="outlined" component="article" sx={{ p: 2, borderRadius: 3, opacity: muted ? 0.75 : 1 }}>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mb: 1.5 }}>
        <Box
          aria-hidden
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
          <Typography sx={{ fontWeight: 700 }} noWrap>
            {title}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
            {subtitle}
          </Typography>
        </Box>
        <Chip label={status.label} color={status.color} size="small" sx={{ fontWeight: 600, flexShrink: 0 }} />
      </Stack>

      <RouteSummary origin={origin} destination={destination} />

      <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1, alignItems: 'center', mt: 1.5 }}>
        {details}
      </Stack>

      <Divider sx={{ my: 1.5 }} />
      {footer}
    </Paper>
  );
}

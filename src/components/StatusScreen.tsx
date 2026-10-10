import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

type Tone = 'success' | 'error' | 'info';

interface StatusScreenProps {
  icon: LucideIcon;
  title: string;
  description?: ReactNode;
  tone?: Tone;
  /** Botões de ação (ex.: "Tentar novamente", "Voltar ao início") */
  actions?: ReactNode;
  children?: ReactNode;
}

const toneColor: Record<Tone, string> = {
  success: 'success',
  error: 'error',
  info: 'primary',
};

/** Tela de resultado de um passo do fluxo: busca encerrada, pagamento recusado, passagem adquirida... */
export default function StatusScreen({ icon: Icon, title, description, tone = 'info', actions, children }: StatusScreenProps) {
  const color = toneColor[tone];

  return (
    <Stack spacing={3} sx={{ alignItems: 'center', textAlign: 'center', py: { xs: 4, sm: 6 } }}>
      <Box
        aria-hidden
        sx={{
          width: 96,
          height: 96,
          borderRadius: '50%',
          display: 'grid',
          placeItems: 'center',
          color: `${color}.main`,
          bgcolor: `rgba(var(--mui-palette-${color}-mainChannel) / 0.12)`,
          boxShadow: `0 0 0 12px rgba(var(--mui-palette-${color}-mainChannel) / 0.06)`,
        }}
      >
        <Icon size={44} strokeWidth={1.75} />
      </Box>

      <Box sx={{ maxWidth: 420 }}>
        <Typography component="h2" variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
          {title}
        </Typography>
        {description && <Typography color="text.secondary">{description}</Typography>}
      </Box>

      {children}

      {actions && (
        <Stack spacing={1.5} sx={{ width: '100%', maxWidth: 420 }}>
          {actions}
        </Stack>
      )}
    </Stack>
  );
}

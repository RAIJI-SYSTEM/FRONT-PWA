'use client';

import type { LucideIcon } from 'lucide-react';
import { CalendarClock, Car, Package } from 'lucide-react';
import Link from 'next/link';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Typography from '@mui/material/Typography';

interface QuickAction {
  label: string;
  description: string;
  href: string;
  icon: LucideIcon;
  highlighted?: boolean;
}

const actions: QuickAction[] = [
  { label: 'Viajar agora', description: 'Motorista em minutos', href: '/viagem/nova', icon: Car, highlighted: true },
  { label: 'Agendar', description: 'Viaje mais tarde', href: '/viagem/agendar', icon: CalendarClock },
  { label: 'Encomendas', description: 'Envie um pacote', href: '/encomenda/nova', icon: Package },
];

export default function QuickActions() {
  return (
    <Box
      component="section"
      aria-label="Ações rápidas"
      // Quebra para a próxima linha quando os botões não cabem lado a lado
      sx={{ display: 'flex', flexWrap: 'wrap', gap: { xs: 1.5, sm: 2 } }}
    >
      {actions.map(({ label, description, href, icon: Icon, highlighted }) => (
        <ButtonBase
          key={href}
          component={Link}
          href={href}
          sx={{
            flex: '1 1 220px',
            justifyContent: 'flex-start',
            gap: 1.5,
            px: 2,
            py: 1.5,
            minHeight: 72,
            borderRadius: 3,
            textAlign: 'left',
            border: 1,
            borderColor: highlighted ? 'transparent' : 'divider',
            bgcolor: 'background.paper',
            color: highlighted ? 'primary.contrastText' : 'text.primary',
            background: highlighted
              ? 'linear-gradient(135deg, var(--mui-palette-primary-light) 0%, var(--mui-palette-primary-main) 100%)'
              : undefined,
            boxShadow: highlighted ? 3 : 0,
          }}
        >
          <Box
            sx={{
              flexShrink: 0,
              width: 44,
              height: 44,
              borderRadius: 2,
              display: 'grid',
              placeItems: 'center',
              color: highlighted ? 'primary.main' : 'primary.contrastText',
              bgcolor: highlighted ? 'background.paper' : 'primary.main',
            }}
          >
            <Icon size={20} />
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 600, lineHeight: 1.2 }}>
              {label}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                mt: 0.25,
                color: highlighted ? 'inherit' : 'text.secondary',
                opacity: highlighted ? 0.85 : 1,
              }}
            >
              {description}
            </Typography>
          </Box>
        </ButtonBase>
      ))}
    </Box>
  );
}

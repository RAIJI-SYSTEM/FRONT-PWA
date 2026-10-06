'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { CarIcon, DocumentIcon, HomeIcon, PersonIcon } from './icons';

export interface FooterItem {
  label: string;
  href: string;
  icon: ReactNode;
}

const defaultItems: FooterItem[] = [
  { label: 'Início', href: '/', icon: <HomeIcon /> },
  { label: 'Extrato', href: '/extrato', icon: <DocumentIcon /> },
  { label: 'Viagens', href: '/viagens', icon: <CarIcon /> },
  { label: 'Perfil', href: '/perfil', icon: <PersonIcon /> },
];

export interface FooterProps {
  items?: FooterItem[];
}

export default function Footer({ items = defaultItems }: FooterProps) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Box
      component="nav"
      aria-label="Navegação principal"
      sx={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 'appBar',
        display: 'flex',
        justifyContent: 'center',
        px: 2,
        pb: 'calc(16px + env(safe-area-inset-bottom))',
        pointerEvents: 'none',
      }}
    >
      <Paper
        elevation={6}
        sx={{
          pointerEvents: 'auto',
          display: 'flex',
          alignItems: 'center',
          gap: { xs: 1, sm: 1.5 },
          p: { xs: 0.75, sm: 1 },
          borderRadius: 999,
          border: 1,
          borderColor: 'divider',
          maxWidth: '100%',
        }}
      >
        {items.map((item) => {
          const active = isActive(item.href);

          return (
            <ButtonBase
              key={item.href}
              component={Link}
              href={item.href}
              aria-label={item.label}
              aria-current={active ? 'page' : undefined}
              sx={{
                height: { xs: 48, sm: 56 },
                minWidth: { xs: 48, sm: 56 },
                px: active ? { xs: 2.5, sm: 3 } : 0,
                gap: 1,
                borderRadius: 999,
                border: 1,
                borderColor: active ? 'primary.main' : 'divider',
                bgcolor: active ? 'primary.main' : 'transparent',
                color: active ? 'primary.contrastText' : 'text.primary',
                transition: (theme) =>
                  theme.transitions.create(['background-color', 'padding', 'color'], {
                    duration: theme.transitions.duration.short,
                  }),
                '&:hover': {
                  bgcolor: active ? 'primary.dark' : 'action.hover',
                },
              }}
            >
              {item.icon}
              {active && (
                <Typography component="span" sx={{ fontWeight: 600, fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                  {item.label}
                </Typography>
              )}
            </ButtonBase>
          );
        })}
      </Paper>
    </Box>
  );
}

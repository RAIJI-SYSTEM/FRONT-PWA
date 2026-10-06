'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import Paper from '@mui/material/Paper';
import { History, House, User, Wallet } from 'lucide-react';

export interface FooterItem {
  label: string;
  href: string;
  icon: ReactNode;
}

const defaultItems: FooterItem[] = [
  { label: 'Início', href: '/homepage', icon: <House size={22} /> },
  { label: 'Histórico', href: '/historico', icon: <History size={22} /> },
  { label: 'Carteira', href: '/carteira', icon: <Wallet size={22} /> },
  { label: 'Perfil', href: '/perfil', icon: <User size={22} /> },
];

export interface FooterProps {
  items?: FooterItem[];
}

export default function Footer({ items = defaultItems }: FooterProps) {
  const pathname = usePathname();
  const activeHref = items.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))?.href;

  return (
    <Paper
      component="nav"
      aria-label="Navegação principal"
      elevation={8}
      sx={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: { xs: 0, sm: 16 },
        mx: 'auto',
        width: { xs: '100%', sm: 'calc(100% - 48px)' },
        maxWidth: { sm: 852 }, // largura do Container "md" menos o gutter
        zIndex: 'appBar',
        overflow: 'hidden',
        borderRadius: { xs: '24px 24px 0 0', sm: 6 },
        pb: { xs: 'env(safe-area-inset-bottom)', sm: 0 },
      }}
    >
      <BottomNavigation showLabels value={activeHref ?? false} sx={{ height: { xs: 68, sm: 76 }, bgcolor: 'transparent' }}>
        {items.map((item) => (
          <BottomNavigationAction
            key={item.href}
            component={Link}
            href={item.href}
            value={item.href}
            label={item.label}
            icon={item.icon}
            sx={{
              gap: 0.5,
              color: 'text.secondary',
              '&.Mui-selected': { color: 'primary.main' },
              '& .MuiBottomNavigationAction-label, & .MuiBottomNavigationAction-label.Mui-selected': {
                fontWeight: 600,
                fontSize: { xs: '0.75rem', sm: '0.8125rem' },
              },
            }}
          />
        ))}
      </BottomNavigation>
    </Paper>
  );
}

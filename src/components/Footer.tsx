'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import Paper from '@mui/material/Paper';
import { Car, Ellipsis, House, Package } from 'lucide-react';

export interface FooterItem {
  label: string;
  href: string;
  icon: ReactNode;
  /** Outras páginas que também deixam este item ativo (ex.: telas abertas a partir do "Mais") */
  also?: string[];
}

const defaultItems: FooterItem[] = [
  { label: 'Início', href: '/homepage', icon: <House size={22} /> },
  { label: 'Encomendas', href: '/encomendas', icon: <Package size={22} /> },
  { label: 'Corridas', href: '/corridas', icon: <Car size={22} /> },
  { label: 'Mais', href: '/mais', icon: <Ellipsis size={22} /> },
];

/** Menu do modo motorista (perfil e rotas ficam dentro do "Mais") */
const driverItems: FooterItem[] = [
  { label: 'Início', href: '/motorista', icon: <House size={22} /> },
  { label: 'Viagens', href: '/motorista/viagens', icon: <Car size={22} /> },
  { label: 'Encomendas', href: '/motorista/encomendas', icon: <Package size={22} /> },
  { label: 'Mais', href: '/motorista/mais', icon: <Ellipsis size={22} />, also: ['/motorista/perfil', '/motorista/rotas'] },
];

const matches = (pathname: string, path: string) => pathname === path || pathname.startsWith(`${path}/`);

export interface FooterProps {
  items?: FooterItem[];
  /** Atalho para os menus prontos: passageiro (padrão) ou motorista */
  mode?: 'passenger' | 'driver';
}

export default function Footer({ mode = 'passenger', items = mode === 'driver' ? driverItems : defaultItems }: FooterProps) {
  const pathname = usePathname();
  // Vence o item cujo caminho que combina é o mais específico ("/motorista/perfil" ativa "Mais", não "Início")
  const activeHref = items
    .map((item) => ({ href: item.href, length: Math.max(-1, ...[item.href, ...(item.also ?? [])].filter((p) => matches(pathname, p)).map((p) => p.length)) }))
    .filter((item) => item.length >= 0)
    .sort((a, b) => b.length - a.length)[0]?.href;

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

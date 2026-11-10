'use client';

import Link from 'next/link';
import { ChevronRight, type LucideIcon } from 'lucide-react';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';

export interface MenuOption {
  label: string;
  description: string;
  href: string;
  icon: LucideIcon;
  /** Destaque à direita, ex.: saldo de recompensas */
  badge?: string;
}

/** Lista de opções com ícone, título, descrição e seta (telas "Mais" do passageiro e do motorista) */
export default function OptionList({ title, options }: { title: string; options: MenuOption[] }) {
  return (
    <Box component="section" aria-labelledby={`more-${title}`}>
      <Typography
        id={`more-${title}`}
        variant="overline"
        color="text.secondary"
        sx={{ display: 'block', px: 1, mb: 0.5, fontWeight: 700, letterSpacing: 1 }}
      >
        {title}
      </Typography>
      <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <List disablePadding>
          {options.map(({ label, description, href, icon: Icon, badge }, index) => (
            <Box key={href}>
              {index > 0 && <Divider component="li" sx={{ ml: 9 }} />}
              <ListItemButton component={Link} href={href} sx={{ gap: 2, py: 1.5, px: 2 }}>
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    flexShrink: 0,
                    borderRadius: 2,
                    display: 'grid',
                    placeItems: 'center',
                    color: 'primary.main',
                    bgcolor: 'rgba(var(--mui-palette-primary-mainChannel) / 0.12)',
                  }}
                >
                  <Icon size={22} />
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 600 }}>{label}</Typography>
                  <Typography variant="body2" color="text.secondary" noWrap>
                    {description}
                  </Typography>
                </Box>
                {badge && <Chip label={badge} size="small" color="primary" sx={{ fontWeight: 700 }} />}
                <ChevronRight size={20} style={{ flexShrink: 0, opacity: 0.6 }} />
              </ListItemButton>
            </Box>
          ))}
        </List>
      </Paper>
    </Box>
  );
}

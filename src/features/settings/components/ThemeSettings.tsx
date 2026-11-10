'use client';

import { Check, Moon, SunMoon, Sun, type LucideIcon } from 'lucide-react';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useColorScheme } from '@mui/material/styles';

type Mode = 'light' | 'dark' | 'system';

/** Cores fixas da miniatura (mostram como cada tema fica, independente do tema atual) */
const PREVIEW = {
  light: { page: '#F8FAFC', card: '#FFFFFF', line: '#E2E8F0', accent: '#EF6C00' },
  dark: { page: '#0F172A', card: '#1E293B', line: '#334155', accent: '#FF9800' },
};

const OPTIONS: { value: Mode; label: string; description: string; icon: LucideIcon }[] = [
  { value: 'light', label: 'Claro', description: 'Fundo claro, ideal durante o dia', icon: Sun },
  { value: 'dark', label: 'Escuro', description: 'Fundo escuro, cansa menos a vista à noite', icon: Moon },
  { value: 'system', label: 'Seguir o sistema', description: 'Muda junto com o tema do celular', icon: SunMoon },
];

/** Miniatura de uma tela no tema (o "sistema" mostra metade claro, metade escuro) */
function ThemePreview({ mode }: { mode: Mode }) {
  const half = (scheme: 'light' | 'dark') => {
    const c = PREVIEW[scheme];
    return (
      <Box sx={{ flex: 1, bgcolor: c.page, p: 0.75, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
        <Box sx={{ height: 6, width: '60%', borderRadius: 1, bgcolor: c.accent }} />
        <Box sx={{ flex: 1, borderRadius: 1, bgcolor: c.card, border: `1px solid ${c.line}` }} />
      </Box>
    );
  };
  return (
    <Box aria-hidden sx={{ width: 64, height: 52, flexShrink: 0, borderRadius: 2, overflow: 'hidden', display: 'flex', border: 1, borderColor: 'divider' }}>
      {mode === 'system' ? (
        <>
          {half('light')}
          {half('dark')}
        </>
      ) : (
        half(mode)
      )}
    </Box>
  );
}

/** Escolha entre tema claro, escuro ou o do sistema (salvo no aparelho pelo MUI) */
export default function ThemeSettings() {
  // `mode` só existe no navegador: antes disso (servidor) mostramos um esqueleto
  const { mode, systemMode, setMode } = useColorScheme();

  return (
    <Stack spacing={1.5} role="radiogroup" aria-label="Tema do aplicativo">
      {OPTIONS.map(({ value, label, description, icon: Icon }) => {
        if (!mode) return <Skeleton key={value} variant="rounded" height={84} sx={{ borderRadius: 3 }} />;
        const selected = mode === value;
        const current = value === 'system' && systemMode ? ` · agora ${systemMode === 'dark' ? 'escuro' : 'claro'}` : '';

        return (
          <ButtonBase
            key={value}
            role="radio"
            aria-checked={selected}
            onClick={() => setMode(value)}
            sx={{
              width: '100%',
              justifyContent: 'flex-start',
              gap: 2,
              p: 1.75,
              borderRadius: 3,
              textAlign: 'left',
              border: 2,
              borderColor: selected ? 'primary.main' : 'divider',
              bgcolor: selected ? 'rgba(var(--mui-palette-primary-mainChannel) / 0.08)' : 'background.paper',
              transition: 'border-color 150ms, background-color 150ms',
            }}
          >
            <ThemePreview mode={value} />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
                <Icon size={18} />
                <Typography sx={{ fontWeight: 700 }}>{label}</Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary">
                {description}
                {current}
              </Typography>
            </Box>
            <Box
              aria-hidden
              sx={{
                width: 24,
                height: 24,
                flexShrink: 0,
                borderRadius: '50%',
                display: 'grid',
                placeItems: 'center',
                border: 2,
                borderColor: selected ? 'primary.main' : 'divider',
                bgcolor: selected ? 'primary.main' : 'transparent',
                color: 'primary.contrastText',
              }}
            >
              {selected && <Check size={14} strokeWidth={3} />}
            </Box>
          </ButtonBase>
        );
      })}
    </Stack>
  );
}

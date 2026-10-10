'use client';

import type { Appearance } from '@stripe/stripe-js';
import { useColorScheme, useTheme } from '@mui/material/styles';

/**
 * Traduz o tema do MUI para a aparência do Stripe.
 * Os campos do Stripe ficam num iframe e não enxergam as variáveis CSS do app,
 * por isso passamos as cores concretas do esquema (claro/escuro) atual.
 */
export function useStripeAppearance(): Appearance {
  const theme = useTheme();
  const { mode, systemMode } = useColorScheme();
  const scheme = (mode === 'system' ? systemMode : mode) === 'dark' ? 'dark' : 'light';
  const palette = theme.colorSchemes[scheme]?.palette ?? theme.palette;

  return {
    theme: scheme === 'dark' ? 'night' : 'stripe',
    variables: {
      colorPrimary: palette.primary.main,
      colorBackground: palette.background.paper,
      colorText: palette.text.primary,
      colorTextSecondary: palette.text.secondary,
      colorDanger: palette.error.main,
      fontFamily: 'Outfit, system-ui, sans-serif',
      borderRadius: `${theme.shape.borderRadius}px`,
    },
    rules: {
      '.Input': { border: `1px solid ${palette.divider}`, boxShadow: 'none' },
      '.Tab': { border: `1px solid ${palette.divider}`, boxShadow: 'none' },
      '.Tab--selected': { borderColor: palette.primary.main },
    },
  };
}

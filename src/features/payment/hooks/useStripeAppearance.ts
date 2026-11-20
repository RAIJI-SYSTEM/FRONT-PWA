'use client';

import type { Appearance, StripeElementsOptions } from '@stripe/stripe-js';
import { useColorScheme, useTheme } from '@mui/material/styles';

/**
 * A fonte do app (Outfit) dentro do iframe do Stripe: o iframe não enxerga a fonte carregada
 * pela página, então ela é informada aqui (Google Fonts).
 */
export const STRIPE_FONTS: StripeElementsOptions['fonts'] = [
  { cssSrc: 'https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap' },
];

/**
 * Traduz o tema do MUI para a aparência do Stripe, para os campos de pagamento parecerem os
 * campos do app (mesmas cores, fonte, altura, borda e foco) no modo claro e no escuro.
 * Os campos do Stripe ficam num iframe e não enxergam as variáveis CSS do app,
 * por isso passamos as cores concretas do esquema (claro/escuro) atual.
 */
export function useStripeAppearance(): Appearance {
  const theme = useTheme();
  const { mode, systemMode } = useColorScheme();
  const scheme = (mode === 'system' ? systemMode : mode) === 'dark' ? 'dark' : 'light';
  const palette = theme.colorSchemes[scheme]?.palette ?? theme.palette;
  // Mesma borda dos TextField "outlined" do MUI (23% da cor do texto sobre o fundo)
  const inputBorder = scheme === 'dark' ? 'rgba(255, 255, 255, 0.23)' : 'rgba(0, 0, 0, 0.23)';

  return {
    theme: scheme === 'dark' ? 'night' : 'stripe',
    labels: 'floating',
    variables: {
      colorPrimary: palette.primary.main,
      colorBackground: palette.background.paper,
      colorText: palette.text.primary,
      colorTextSecondary: palette.text.secondary,
      colorTextPlaceholder: palette.text.secondary,
      colorDanger: palette.error.main,
      colorIcon: palette.text.secondary,
      fontFamily: 'Outfit, system-ui, sans-serif',
      fontSizeBase: '16px',
      borderRadius: `${theme.shape.borderRadius}px`,
      focusBoxShadow: `0 0 0 1px ${palette.primary.main}`,
      focusOutline: 'none',
    },
    rules: {
      // Borda dos campos do app (a altura vem do rótulo flutuante, como no TextField do MUI)
      '.Input': { border: `1px solid ${inputBorder}`, boxShadow: 'none' },
      // Foco como no MUI: borda de 2px na cor principal
      '.Input:focus': { borderColor: palette.primary.main, boxShadow: `0 0 0 1px ${palette.primary.main}` },
      '.Input--invalid': { borderColor: palette.error.main, boxShadow: `0 0 0 1px ${palette.error.main}` },
      '.Label': { color: palette.text.secondary, fontWeight: '500' },
      '.Tab': { border: `1px solid ${inputBorder}`, boxShadow: 'none', padding: '14px' },
      '.Tab--selected, .Tab--selected:hover, .Tab--selected:focus': {
        borderColor: palette.primary.main,
        boxShadow: `0 0 0 1px ${palette.primary.main}`,
        color: palette.text.primary,
      },
      '.TabIcon--selected, .TabLabel--selected': { color: palette.primary.main, fill: palette.primary.main },
    },
  };
}

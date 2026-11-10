'use client';

import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  // Ativar cssVariables é crucial no Next.js App Router para evitar 
  // erros de hidratação e flickering ao alternar entre claro/escuro.
  cssVariables: {
    // Tema aplicado por classe no <html> ("light"/"dark"): permite o usuário escolher
    // claro, escuro ou seguir o sistema (tela Mais → Configurações)
    colorSchemeSelector: 'class',
  },
  
  colorSchemes: {
    // ==========================================
    // TEMA CLARO: "Dia de Viagem"
    // ==========================================
    light: {
      palette: {
        primary: {
          main: '#EF6C00', // Laranja "Pôr do Sol" - Vibrante e enérgico
          light: '#FF9D3F',
          dark: '#B53D00',
          contrastText: '#FFFFFF',
        },
        secondary: {
          main: '#455A64', // Cinza "Asfalto Seco" - Traz seriedade e contraste
          light: '#718792',
          dark: '#1C313A',
          contrastText: '#FFFFFF',
        },
        background: {
          default: '#F8FAFC', // "Neblina Matinal" - Um branco levemente acinzentado para não cansar a vista
          paper: '#FFFFFF',   // Cards brancos e limpos
        },
        text: {
          primary: '#1E293B', // Texto super escuro (mas não 100% preto, para leitura suave)
          secondary: '#64748B',
        },
        divider: '#E2E8F0',
      },
    },

    // ==========================================
    // TEMA ESCURO: "Viagem Noturna"
    // ==========================================
    dark: {
      palette: {
        primary: {
          main: '#FF9800', // Laranja "Luz de Poste/Seta" - Mais luminoso para leitura noturna
          light: '#FFC947',
          dark: '#C66900',
          contrastText: '#121212', // Texto escuro dentro do botão laranja para máximo contraste
        },
        secondary: {
          main: '#90A4AE', // Cinza "Asfalto Molhado Refletindo Luz"
          light: '#C1D5E0',
          dark: '#62757F',
          contrastText: '#121212',
        },
        background: {
          default: '#0F172A', // "Céu Noturno / Meia-noite" - Azul muito profundo (melhor que preto puro)
          paper: '#1E293B',   // "Painel do Carro" - Fundo dos cards e menus
        },
        text: {
          primary: '#F8FAFC', // Texto quase branco
          secondary: '#94A3B8',
        },
        divider: '#334155',
      },
    },
  },

  // Configurações globais de componentes
  typography: {
    fontFamily: 'var(--font-outfit), sans-serif',
  },
  
  shape: {
    borderRadius: 12,
  },

  components: {
    MuiCssBaseline: {
      styleOverrides: {
        // Sem o efeito de "esticar"/brilho ao puxar além do início ou do fim da página
        // (Android): no app, cabeçalho e menu ficam parados
        'html, body': { overscrollBehavior: 'none' },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        // Fundo sólido nos campos, para o autofill ter uma cor para "imitar"
        root: {
          backgroundColor: 'var(--mui-palette-background-paper)',
        },
        // O navegador pinta o fundo dos campos preenchidos automaticamente (azul no Firefox,
        // amarelo no Chrome). Não dá para trocar esse fundo, mas uma sombra interna cobre ele.
        input: {
          '&:-webkit-autofill, &:autofill': {
            boxShadow: '0 0 0 100px var(--mui-palette-background-paper) inset',
            WebkitTextFillColor: 'var(--mui-palette-text-primary)',
            caretColor: 'var(--mui-palette-text-primary)',
            borderRadius: 'inherit',
          },
        },
      },
    },
  },
});

export default theme
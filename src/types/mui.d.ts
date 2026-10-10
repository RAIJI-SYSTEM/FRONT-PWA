import '@mui/material/styles';

// O tema usa `cssVariables: true` (src/theme.ts). Esta declaração avisa o TypeScript,
// liberando `theme.vars` e `theme.colorSchemes` com os tipos corretos.
declare module '@mui/material/styles' {
  interface CssThemeVariables {
    enabled: true;
  }
}

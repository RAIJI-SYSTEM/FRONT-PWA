import Box from '@mui/material/Box';
import Container from '@mui/material/Container';

/** Telas de fluxo (nova viagem, busca, pagamento): sem o menu inferior, para o passageiro focar no passo atual */
export default function FlowLayout({ children }: { children: React.ReactNode }) {
  return (
    <Box
      sx={{
        minHeight: '100dvh',
        bgcolor: 'background.default',
        backgroundImage:
          'linear-gradient(180deg, rgba(var(--mui-palette-primary-mainChannel) / 0.18) 0%, transparent 240px)',
      }}
    >
      {/* Coluna com a altura da tela: permite que barras de ação fiquem no fim mesmo com pouco conteúdo */}
      <Container maxWidth="sm" sx={{ px: { xs: 2, sm: 3 }, pb: 4, minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
        {children}
      </Container>
    </Box>
  );
}

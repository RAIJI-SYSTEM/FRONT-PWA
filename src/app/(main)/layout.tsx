import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <Box
      sx={{
        minHeight: '100dvh',
        bgcolor: 'background.default',
        // Degradê laranja no topo, como na referência (variável CSS gerada pelo tema)
        backgroundImage:
          'linear-gradient(180deg, rgba(var(--mui-palette-primary-mainChannel) / 0.28) 0%, transparent 320px)',
      }}
    >
      <Header userName="Pablo" location="São Paulo, SP" />
      {/* padding inferior para o conteúdo não ficar escondido atrás do Footer fixo */}
      <Container maxWidth="md" component="main" sx={{ px: { xs: 2, sm: 3 }, pt: 1, pb: { xs: 12, sm: 15 } }}>
        {children}
      </Container>
      <Footer />
    </Box>
  );
}

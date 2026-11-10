import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Footer from '@/components/Footer';
import Header from '@/components/Header';
import DriverGate from '@/features/driver/components/DriverGate';

/**
 * Modo motorista: mesmo usuário, outro "app" (cabeçalho com a etiqueta "Motorista" e menu próprio).
 * Quem ainda não tem cadastro de motorista vai direto para o cadastro.
 */
export default function DriverLayout({ children }: { children: React.ReactNode }) {

  return (
    <Box
      sx={{
        minHeight: '100dvh',
        bgcolor: 'background.default',
        backgroundImage:
          'linear-gradient(180deg, rgba(var(--mui-palette-primary-mainChannel) / 0.28) 0%, transparent 320px)',
      }}
    >
      <Header userName="Pablo" location="São Paulo, SP" modeLabel="Motorista" mode="driver" />
      <Container maxWidth="md" component="main" sx={{ px: { xs: 2, sm: 3 }, pt: 1, pb: { xs: 12, sm: 15 } }}>
        <DriverGate>{children}</DriverGate>
      </Container>
      <Footer mode="driver" />
    </Box>
  );
}

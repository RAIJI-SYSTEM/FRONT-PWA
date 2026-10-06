import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <Box sx={{ minHeight: '100dvh', bgcolor: 'background.default' }}>
      <Header userName="Pablo" balance={100} notificationsCount={1} />
      {/* padding inferior para o conteúdo não ficar escondido atrás do Footer fixo */}
      <Container maxWidth="md" component="main" sx={{ py: 3, pb: { xs: 13, sm: 15 } }}>
        {children}
      </Container>
      <Footer />
    </Box>
  );
}

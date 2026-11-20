import Box from '@mui/material/Box';
import Container from '@mui/material/Container';

/** Termos e privacidade: abrem sem login (a política de privacidade precisa ser pública) */
export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <Box sx={{ minHeight: '100dvh', bgcolor: 'background.default' }}>
      <Container maxWidth="sm" sx={{ px: { xs: 2, sm: 3 }, pb: 6 }}>
        {children}
      </Container>
    </Box>
  );
}

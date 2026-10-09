import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import AuthHero from '@/features/auth/components/AuthHero';
import LoginForm from '@/features/auth/components/LoginForm';

export default function LoginPage() {
  return (
    <>
      {/* Para usar uma foto: coloque em /public e passe imageSrc="/images/login-hero.jpg" */}
      <AuthHero />

      <Box sx={{ px: { xs: 2.5, sm: 0 }, pb: 4, mt: { xs: -3, sm: 3 }, position: 'relative' }}>
        <Typography
          component="h1"
          sx={{ fontWeight: 700, lineHeight: 1.15, fontSize: { xs: '2rem', sm: '2.5rem' }, mb: 1 }}
        >
          Viaje e envie,
          <br />
          sem complicação
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          Corridas e entregas em um só lugar. Entre para continuar.
        </Typography>

        <LoginForm />
      </Box>
    </>
  );
}

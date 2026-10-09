import Box from '@mui/material/Box';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <Box
      sx={{
        minHeight: '100dvh',
        bgcolor: 'background.default',
        // Leve tom laranja vindo de baixo, lembrando o degradê da referência
        backgroundImage:
          'linear-gradient(0deg, rgba(var(--mui-palette-primary-mainChannel) / 0.18) 0%, transparent 60%)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: { xs: 'stretch', sm: 'center' },
        py: { xs: 0, sm: 4 },
      }}
    >
      <Box component="main" sx={{ width: '100%', maxWidth: { sm: 520 } }}>
        {children}
      </Box>
    </Box>
  );
}

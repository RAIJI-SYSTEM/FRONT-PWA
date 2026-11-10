'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogIn, UserPlus } from 'lucide-react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import GoogleIcon from '@/components/GoogleIcon';
import { useSession } from '@/hooks/useSession';
import { initNativeAuth, isNativeApp, onNativeSignInError, signIn, type SignInOptions } from '@/services/auth';

const pillSx = { height: 56, borderRadius: 999, fontSize: '1rem', fontWeight: 600, textTransform: 'none' } as const;

type Action = 'email' | 'google' | 'register';

/**
 * E-mail/senha, cadastro e Google acontecem nas páginas do Keycloak (no app, numa aba
 * sobreposta, sem sair do app). Esta tela só escolhe o caminho.
 */
export default function LoginForm() {
  const router = useRouter();
  const session = useSession();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<Action | null>(null);

  // App Android: escuta o retorno do login (com.raiji.app://auth/callback)
  useEffect(() => {
    void initNativeAuth();
    return onNativeSignInError(() => {
      setError('Não foi possível concluir o login. Tente novamente.');
      setLoading(null);
    });
  }, []);

  // Já logado (ou o login acabou de concluir no app): segue para o início
  useEffect(() => {
    if (session) router.replace('/homepage');
  }, [session, router]);

  const start = async (action: Action, options: SignInOptions) => {
    setError(null);
    setLoading(action);
    try {
      await signIn(options);
      // Web: a página está saindo, mantém o "carregando". App: a aba abriu por cima —
      // libera o botão (se o usuário fechar a aba sem entrar, pode tentar de novo)
      if (isNativeApp()) setLoading(null);
    } catch {
      setError('Não foi possível abrir o login. Verifique sua conexão e tente novamente.');
      setLoading(null);
    }
  };

  return (
    <Box>
      <Stack spacing={2}>
        {error && <Alert severity="error">{error}</Alert>}

        <Button
          variant="contained"
          onClick={() => start('email', {})}
          disabled={loading !== null}
          startIcon={loading === 'email' ? <CircularProgress size={20} color="inherit" /> : <LogIn size={20} />}
          sx={{ ...pillSx, boxShadow: 3 }}
        >
          Entrar com e-mail
        </Button>

        <Divider sx={{ color: 'text.secondary', typography: 'body2' }}>ou</Divider>

        <Button
          variant="outlined"
          color="inherit"
          onClick={() => start('google', { provider: 'google' })}
          disabled={loading !== null}
          startIcon={loading === 'google' ? <CircularProgress size={20} /> : <GoogleIcon />}
          sx={{ ...pillSx, bgcolor: 'background.paper', borderColor: 'divider' }}
        >
          Continuar com Google
        </Button>

        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', pt: 1 }}>
          Não tem uma conta?{' '}
          <Link
            component="button"
            type="button"
            underline="hover"
            onClick={() => start('register', { mode: 'register' })}
            disabled={loading !== null}
            sx={{ fontWeight: 600, verticalAlign: 'baseline', display: 'inline-flex', alignItems: 'center', gap: 0.5 }}
          >
            {loading === 'register' ? <CircularProgress size={14} /> : <UserPlus size={14} />}
            Criar conta
          </Link>
        </Typography>
      </Stack>
    </Box>
  );
}

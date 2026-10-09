'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import NextLink from 'next/link';
import { Eye, EyeOff, Lock, LogIn, Mail } from 'lucide-react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import GoogleIcon from '@/components/GoogleIcon';
import { signInWithEmail, signInWithGoogle } from '@/services/auth';

type FieldErrors = Partial<Record<'email' | 'password', string>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(email: string, password: string): FieldErrors {
  const errors: FieldErrors = {};
  if (!email) errors.email = 'Informe seu e-mail.';
  else if (!EMAIL_PATTERN.test(email)) errors.email = 'E-mail inválido.';
  if (!password) errors.password = 'Informe sua senha.';
  return errors;
}

const pillSx = { height: 56, borderRadius: 999, fontSize: '1rem', fontWeight: 600, textTransform: 'none' } as const;

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<'email' | 'google' | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const errors = validate(email.trim(), password);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setError(null);
    setLoading('email');
    try {
      await signInWithEmail({ email: email.trim(), password });
      router.push('/homepage');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível entrar. Tente novamente.');
      setLoading(null);
    }
  };

  const handleGoogle = async () => {
    setError(null);
    setLoading('google');
    try {
      await signInWithGoogle();
      router.push('/homepage');
    } catch {
      setError('Não foi possível entrar com o Google. Tente novamente.');
      setLoading(null);
    }
  };

  return (
    <Box component="form" noValidate onSubmit={handleSubmit}>
      <Stack spacing={2}>
        {error && <Alert severity="error">{error}</Alert>}

        <TextField
          label="E-mail"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={Boolean(fieldErrors.email)}
          helperText={fieldErrors.email}
          fullWidth
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Mail size={20} />
                </InputAdornment>
              ),
            },
          }}
        />

        <TextField
          label="Senha"
          type={showPassword ? 'text' : 'password'}
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={Boolean(fieldErrors.password)}
          helperText={fieldErrors.password}
          fullWidth
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Lock size={20} />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    edge="end"
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                    onClick={() => setShowPassword((show) => !show)}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
        />

        <Link component={NextLink} href="/recuperar-senha" variant="body2" underline="hover" sx={{ alignSelf: 'flex-end', fontWeight: 600 }}>
          Esqueceu a senha?
        </Link>

        <Button
          type="submit"
          variant="contained"
          disabled={loading !== null}
          startIcon={loading === 'email' ? <CircularProgress size={20} color="inherit" /> : <LogIn size={20} />}
          sx={{ ...pillSx, boxShadow: 3 }}
        >
          Entrar
        </Button>

        <Divider sx={{ color: 'text.secondary', typography: 'body2' }}>ou</Divider>

        <Button
          variant="outlined"
          color="inherit"
          onClick={handleGoogle}
          disabled={loading !== null}
          startIcon={loading === 'google' ? <CircularProgress size={20} /> : <GoogleIcon />}
          sx={{ ...pillSx, bgcolor: 'background.paper', borderColor: 'divider' }}
        >
          Continuar com Google
        </Button>

        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', pt: 1 }}>
          Não tem uma conta?{' '}
          <Link component={NextLink} href="/cadastro" underline="hover" sx={{ fontWeight: 600 }}>
            Criar conta
          </Link>
        </Typography>
      </Stack>
    </Box>
  );
}

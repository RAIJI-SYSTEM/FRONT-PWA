'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import NextLink from 'next/link';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { completeSignIn } from '@/services/auth';

/** Volta do Keycloak na web: troca o código pelos tokens e segue para o app */
export default function AuthCallback() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  useEffect(() => {
    // O código só pode ser trocado uma vez (o StrictMode do React roda efeitos duas vezes em dev)
    if (started.current) return;
    started.current = true;

    // Erro vindo do Keycloak (?error=...) também cai no catch: o oidc-client-ts o transforma em exceção
    completeSignIn()
      .then((returnTo) => router.replace(returnTo))
      .catch((err: { error?: string; error_description?: string }) =>
        setError(
          err?.error === 'access_denied'
            ? 'O login foi cancelado.'
            : (err?.error_description ?? 'Não foi possível concluir o login. Tente novamente.'),
        ),
      );
  }, [router]);

  return (
    <Stack spacing={2} sx={{ alignItems: 'center', justifyContent: 'center', minHeight: '60dvh', px: 3 }}>
      {error ? (
        <>
          <Alert severity="error" sx={{ width: '100%' }}>
            {error}
          </Alert>
          <Button component={NextLink} href="/login" variant="contained">
            Voltar ao login
          </Button>
        </>
      ) : (
        <>
          <CircularProgress />
          <Typography color="text.secondary">Entrando…</Typography>
        </>
      )}
    </Stack>
  );
}

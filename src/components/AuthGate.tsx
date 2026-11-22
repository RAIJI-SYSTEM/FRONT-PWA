'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import { useHydrated } from '@/hooks/useHydrated';
import { useSession } from '@/hooks/useSession';
import PushRegistrar from '@/features/push/PushRegistrar';

/** Caminho de onde a pessoa saiu, para voltar depois do login */
export const loginPath = (returnTo: string) => `/login?voltar=${encodeURIComponent(returnTo)}`;

/**
 * Só mostra as telas do app para quem está logado. Sem sessão (nunca entrou, saiu, ou o
 * login venceu e não deu para renovar) vai para o login e, depois, volta para onde estava.
 */
export default function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const hydrated = useHydrated();
  const session = useSession();

  useEffect(() => {
    if (hydrated && !session) {
      router.replace(loginPath(`${pathname}${window.location.search}`));
    }
  }, [hydrated, session, pathname, router]);

  if (!hydrated || !session) {
    return (
      <Stack sx={{ minHeight: '60dvh', alignItems: 'center', justifyContent: 'center' }} aria-busy="true">
        <CircularProgress />
      </Stack>
    );
  }
  return (
    <>
      {children}
      <PushRegistrar userId={session.user.id} />
    </>
  );
}

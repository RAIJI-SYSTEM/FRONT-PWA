'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Entrada do app: vai para o início. No Android, o Capacitor entrega este index.html para
 * qualquer endereço sem arquivo (ex.: ao recarregar ou voltar do Stripe); nesse caso
 * reabre a página pedida pela navegação do próprio Next.
 */
export default function RootPage() {
  const router = useRouter();
  useEffect(() => {
    const { pathname, search } = window.location;
    router.replace(pathname === '/' ? '/homepage' : `${pathname}${search}`);
  }, [router]);
  return null;
}

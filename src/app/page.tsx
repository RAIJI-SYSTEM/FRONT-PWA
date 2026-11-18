'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSession } from '@/services/auth';

/**
 * Entrada do app: vai para o início (ou para o login, se ninguém entrou). No Android, o Capacitor entrega este index.html para
 * qualquer endereço sem arquivo (ex.: ao recarregar ou voltar do Stripe); nesse caso
 * reabre a página pedida pela navegação do próprio Next.
 */
export default function RootPage() {
  const router = useRouter();
  useEffect(() => {
    const { pathname, search } = window.location;
    // Na raiz: quem está logado vai para o início; quem não está, para o login
    if (pathname === '/') router.replace(getSession() ? '/homepage' : '/login');
    else router.replace(`${pathname}${search}`);
  }, [router]);
  return null;
}

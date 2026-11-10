'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** Redirecionamento no cliente (a exportação estática não tem servidor para redirecionar) */
export default function Redirect({ to }: { to: string }) {
  const router = useRouter();
  useEffect(() => router.replace(to), [router, to]);
  return null;
}

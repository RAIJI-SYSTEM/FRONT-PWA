'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { getSession } from '@/services/auth';

/**
 * Registra cada navegação client-side (Link/App Router), que não passa pelo
 * servidor. O beacon vai para o BFF com o token, permitindo saber o `sub`.
 */
export function AuditTracker() {
  const pathname = usePathname();
  const last = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname || last.current === pathname) return;
    last.current = pathname;
    const token = getSession()?.accessToken;
    void fetch('/api/audit/front', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ path: pathname }),
      keepalive: true,
    }).catch(() => {
      // auditoria nunca pode quebrar a navegação
    });
  }, [pathname]);

  return null;
}

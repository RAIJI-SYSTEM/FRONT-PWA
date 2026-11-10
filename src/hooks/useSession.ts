'use client';

import { useSyncExternalStore } from 'react';
import { getSession, subscribeSession, type Session } from '@/services/auth';

/** Sessão atual do usuário (null = não logado). Atualiza sozinho em login/logout. */
export function useSession(): Session | null {
  return useSyncExternalStore(subscribeSession, getSession, () => null);
}

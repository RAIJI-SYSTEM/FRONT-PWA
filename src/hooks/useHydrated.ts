'use client';

import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};

/** true só no navegador, depois da hidratação (a sessão fica no localStorage) */
export function useHydrated() {
  return useSyncExternalStore(subscribe, () => true, () => false);
}

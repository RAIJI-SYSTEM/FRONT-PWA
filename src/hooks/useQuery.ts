'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Busca dados sempre que `key` muda (ex.: cidade + filtros). `key = null` não busca nada.
 * Respostas de buscas antigas são descartadas, então a tela nunca mostra o resultado errado
 * quando o usuário troca o filtro no meio de uma busca.
 */
export function useQuery<T>(key: string | null, fetcher: () => Promise<T>) {
  const [state, setState] = useState<{ key: string | null; data?: T; error?: string }>({ key: null });
  const fetcherRef = useRef(fetcher);
  useEffect(() => {
    fetcherRef.current = fetcher;
  });

  useEffect(() => {
    if (key === null) return;
    let active = true;
    fetcherRef.current().then(
      (data) => active && setState({ key, data }),
      (err) => active && setState({ key, error: err instanceof Error ? err.message : 'Falha na busca.' }),
    );
    return () => {
      active = false;
    };
  }, [key]);

  const settled = state.key === key;
  return {
    data: settled ? state.data : undefined,
    error: settled ? state.error : undefined,
    loading: key !== null && !settled,
  };
}

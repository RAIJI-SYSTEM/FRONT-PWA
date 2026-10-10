'use client';

import { useEffect, useState } from 'react';
import { getRideSearch } from '@/services/rideSearch';
import type { RideSearch } from '@/types/ride';

const POLL_INTERVAL_MS = 3000;

/**
 * Acompanha a busca consultando o servidor periodicamente enquanto ela está em andamento.
 * Polling é simples e funciona em qualquer hospedagem; com um backend próprio, dá para
 * trocar por WebSocket/SSE sem mudar quem usa o hook.
 */
export function useRideSearch(id: string) {
  const [search, setSearch] = useState<RideSearch | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout>;

    const poll = async () => {
      try {
        const data = await getRideSearch(id);
        if (!active) return;
        setSearch(data);
        setError(null);
        if (data.status === 'searching') timer = setTimeout(poll, POLL_INTERVAL_MS);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Falha ao consultar a busca.');
        timer = setTimeout(poll, POLL_INTERVAL_MS * 2);
      }
    };

    poll();
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [id]);

  return { search, error, setSearch };
}

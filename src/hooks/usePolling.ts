'use client';

import { useEffect, useState } from 'react';

const DEFAULT_INTERVAL_MS = 3000;

/**
 * Consulta `fetcher` periodicamente enquanto `shouldContinue` for verdadeiro.
 * Polling é simples e funciona em qualquer hospedagem; com backend próprio, dá para
 * trocar por WebSocket/SSE sem mudar quem usa o hook.
 */
export function usePolling<T>(
  key: string,
  fetcher: (key: string) => Promise<T>,
  shouldContinue: (data: T) => boolean,
  intervalMs = DEFAULT_INTERVAL_MS,
) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout>;

    const poll = async () => {
      try {
        const result = await fetcher(key);
        if (!active) return;
        setData(result);
        setError(null);
        if (shouldContinue(result)) timer = setTimeout(poll, intervalMs);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Falha ao consultar o servidor.');
        timer = setTimeout(poll, intervalMs * 2);
      }
    };

    poll();
    return () => {
      active = false;
      clearTimeout(timer);
    };
    // fetcher/shouldContinue são funções estáveis de módulo; a consulta recomeça só quando a chave muda
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, intervalMs]);

  return { data, error, setData };
}

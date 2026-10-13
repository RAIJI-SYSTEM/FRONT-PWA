'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Renderiza uma lista em partes: os primeiros `pageSize` itens e, quando o usuário se aproxima
 * do fim (IntersectionObserver), mais uma parte. Evita montar centenas de cartões de uma vez
 * na webview. Para recomeçar do início (ex.: filtros mudaram), troque a `key` do componente.
 */
export function useIncrementalList<T>(items: T[], pageSize = 10) {
  const [count, setCount] = useState(pageSize);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const hasMore = count < items.length;

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore) return;
    // rootMargin: começa a carregar um pouco antes de chegar ao fim (rolagem sem "travadas")
    const observer = new IntersectionObserver(
      (entries) => entries[0].isIntersecting && setCount((c) => c + pageSize),
      { rootMargin: '600px 0px' },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, pageSize]);

  return {
    visible: items.slice(0, count),
    hasMore,
    remaining: items.length - count,
    /** Coloque <div ref={sentinelRef} /> logo depois do último item */
    sentinelRef,
    /** Alternativa acessível ao carregamento automático (botão "Carregar mais") */
    loadMore: () => setCount((c) => c + pageSize),
  };
}

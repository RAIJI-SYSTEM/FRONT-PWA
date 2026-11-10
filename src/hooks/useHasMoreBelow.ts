'use client';

import { useEffect, useState } from 'react';

/**
 * Diz se ainda há conteúdo da página abaixo da área visível (útil em telas pequenas para
 * avisar "tem mais abaixo"). Recalcula ao rolar, ao girar a tela e sempre que a altura da
 * página muda — por isso observa o <body> inteiro: funciona mesmo que o conteúdo apareça
 * depois (ex.: após carregar dados) ou troque (ex.: etapas de um formulário).
 */
export function useHasMoreBelow(threshold = 24) {
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    const check = () =>
      setHasMore(document.documentElement.scrollHeight - (window.scrollY + window.innerHeight) > threshold);

    const frame = requestAnimationFrame(check);
    window.addEventListener('scroll', check, { passive: true });
    window.addEventListener('resize', check);
    const observer = new ResizeObserver(check);
    observer.observe(document.body);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', check);
      window.removeEventListener('resize', check);
      observer.disconnect();
    };
  }, [threshold]);

  return hasMore;
}

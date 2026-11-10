'use client';

import { useEffect } from 'react';

/**
 * Trava a rolagem da página enquanto a tela estiver aberta. Para telas que ocupam a tela inteira
 * por cima do layout (mapa, conversa): sem isso, no Android o teclado ou a lista de sugestões
 * podem deixar a página de baixo rolável, e aparece o indicador de rolagem.
 */
export function useLockPageScroll() {
  useEffect(() => {
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = 'hidden';
    return () => {
      root.style.overflow = previous;
    };
  }, []);
}

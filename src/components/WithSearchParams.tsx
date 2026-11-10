'use client';

import { Suspense, type ReactNode } from 'react';
import { useSearchParams } from 'next/navigation';

type Render = (params: URLSearchParams) => ReactNode;

function Reader({ children }: { children: Render }) {
  return children(useSearchParams());
}

/**
 * Lê a query string no navegador. Na exportação estática (app Android) as páginas são geradas
 * no build, então os parâmetros só existem no cliente — e useSearchParams exige um Suspense.
 */
export default function WithSearchParams({ children }: { children: Render }) {
  return (
    <Suspense fallback={null}>
      <Reader>{children}</Reader>
    </Suspense>
  );
}

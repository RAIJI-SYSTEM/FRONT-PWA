'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';

interface ActionBarProps {
  children: ReactNode;
  /** Conteúdo encostado acima da barra (ex.: aviso de "Mais abaixo"), posicionado com bottom: '100%' */
  above?: ReactNode;
}

/**
 * Botões de ação (Continuar, Pagar…) fixos no rodapé das telas de fluxo, ao alcance do polegar.
 * Só o conteúdo do meio rola; um espaço com a altura da barra evita que ela cubra o fim da página.
 */
export default function ActionBar({ children, above }: ActionBarProps) {
  const barRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(88);

  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;
    const observer = new ResizeObserver(() => setHeight(bar.offsetHeight));
    observer.observe(bar);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <Box aria-hidden sx={{ height, flexShrink: 0 }} />
      <Box
        ref={barRef}
        sx={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 'appBar',
          pt: 2,
          pb: 'calc(16px + env(safe-area-inset-bottom))',
          bgcolor: 'background.default',
          borderTop: 1,
          borderColor: 'divider',
        }}
      >
        {above}
        <Container maxWidth="sm" sx={{ px: { xs: 2, sm: 3 } }}>
          {children}
        </Container>
      </Box>
    </>
  );
}

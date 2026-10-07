'use client';

import { Children, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

// Distância entre o início de um slide e o do próximo (largura + gap)
function getStep(track: HTMLDivElement) {
  const [first, second] = Array.from(track.children) as HTMLElement[];
  return second ? second.offsetLeft - first.offsetLeft : track.clientWidth;
}

/**
 * O Firefox restaura o estado "disabled" dos botões ao recarregar a página, o que gera
 * erro de hydration (servidor manda disabled, o navegador remove). `autocomplete="off"`
 * desliga essa restauração; vai por spread porque o tipo do React não prevê o atributo em <button>.
 */
const noFormStateRestore = { autoComplete: 'off' };

interface CarouselProps {
  children: ReactNode;
  'aria-label': string;
}

/**
 * Carrossel horizontal com scroll-snap (arrastar no touch).
 * No celular mostra um slide por vez ocupando toda a largura; no tablet, dois.
 * A existência de mais itens é indicada pelos controles (setas, pontos e contador).
 */
export default function Carousel({ children, 'aria-label': ariaLabel }: CarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const slides = Children.toArray(children);
  const [activeIndex, setActiveIndex] = useState(0);
  // Quantidade de posições possíveis (no tablet, com 2 por vez, é menor que o nº de slides)
  const [pageCount, setPageCount] = useState(slides.length);

  const sync = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const step = getStep(track);
    setPageCount(Math.round((track.scrollWidth - track.clientWidth) / step) + 1);
    setActiveIndex(Math.round(track.scrollLeft / step));
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    // Recalcula ao redimensionar (ex.: girar o tablet). O observer já dispara uma vez ao iniciar.
    const observer = new ResizeObserver(sync);
    observer.observe(track);
    return () => observer.disconnect();
  }, [sync, slides.length]);

  const goTo = (index: number) => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollTo({ left: getStep(track) * index, behavior: 'smooth' });
  };

  const hasControls = pageCount > 1;

  return (
    <Box role="region" aria-roledescription="carrossel" aria-label={ariaLabel}>
      <Box
        ref={trackRef}
        onScroll={sync}
        sx={{
          display: 'grid',
          gridAutoFlow: 'column',
          gridAutoColumns: { xs: '100%', sm: 'calc(50% - 8px)' },
          gap: 2,
          overflowX: 'auto',
          scrollSnapType: 'x mandatory',
          scrollbarWidth: 'none',
          '&::-webkit-scrollbar': { display: 'none' },
          // espaço para a sombra dos cards não ser cortada
          py: 0.5,
        }}
      >
        {slides.map((slide, index) => (
          <Box
            key={index}
            role="group"
            aria-roledescription="slide"
            aria-label={`${index + 1} de ${slides.length}`}
            sx={{ scrollSnapAlign: 'start', minWidth: 0 }}
          >
            {slide}
          </Box>
        ))}
      </Box>

      {hasControls && (
        <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', mt: 1.5 }}>
          <Typography variant="body2" color="text.secondary" aria-live="polite" sx={{ minWidth: 40 }}>
            {activeIndex + 1}/{pageCount}
          </Typography>

          <Stack direction="row" spacing={0.75}>
            {Array.from({ length: pageCount }, (_, index) => (
              <ButtonBase
                key={index}
                aria-label={`Ir para o item ${index + 1}`}
                aria-current={index === activeIndex}
                onClick={() => goTo(index)}
                sx={{
                  width: index === activeIndex ? 20 : 8,
                  height: 8,
                  borderRadius: 999,
                  bgcolor: index === activeIndex ? 'primary.main' : 'divider',
                  transition: 'width 200ms, background-color 200ms',
                }}
              />
            ))}
          </Stack>

          <Stack direction="row" spacing={1}>
            <IconButton
              size="small"
              aria-label="Anterior"
              {...noFormStateRestore}
              disabled={activeIndex === 0}
              onClick={() => goTo(activeIndex - 1)}
              sx={{ border: 1, borderColor: 'divider' }}
            >
              <ChevronLeft size={18} />
            </IconButton>
            <IconButton
              size="small"
              aria-label="Próximo"
              {...noFormStateRestore}
              disabled={activeIndex >= pageCount - 1}
              onClick={() => goTo(activeIndex + 1)}
              sx={{
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                '&:hover': { bgcolor: 'primary.dark' },
                '&.Mui-disabled': { bgcolor: 'action.disabledBackground' },
              }}
            >
              <ChevronRight size={18} />
            </IconButton>
          </Stack>
        </Stack>
      )}
    </Box>
  );
}

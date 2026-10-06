'use client';

import { Children, useRef, useState, type ReactNode } from 'react';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Stack from '@mui/material/Stack';

interface CarouselProps {
  children: ReactNode;
  'aria-label': string;
}

/** Carrossel horizontal com scroll-snap (arrastar no touch) e indicadores clicáveis. */
export default function Carousel({ children, 'aria-label': ariaLabel }: CarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const slides = Children.toArray(children);

  const handleScroll = () => {
    const track = trackRef.current;
    if (!track) return;
    const slideWidth = track.scrollWidth / slides.length;
    setActiveIndex(Math.round(track.scrollLeft / slideWidth));
  };

  const goTo = (index: number) => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollTo({ left: (track.scrollWidth / slides.length) * index, behavior: 'smooth' });
  };

  return (
    <Box role="region" aria-roledescription="carrossel" aria-label={ariaLabel}>
      <Box
        ref={trackRef}
        onScroll={handleScroll}
        sx={{
          display: 'grid',
          gridAutoFlow: 'column',
          // Mostra um pedaço do próximo card no celular; 2 por vez no tablet
          gridAutoColumns: { xs: '86%', sm: 'calc(50% - 8px)' },
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

      {slides.length > 1 && (
        <Stack direction="row" spacing={0.75} sx={{ justifyContent: 'center', mt: 1.5 }}>
          {slides.map((_, index) => (
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
      )}
    </Box>
  );
}

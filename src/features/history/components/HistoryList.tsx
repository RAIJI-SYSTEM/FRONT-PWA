'use client';

import type { ReactNode } from 'react';
import { SearchX } from 'lucide-react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import StatusScreen from '@/components/StatusScreen';
import { useIncrementalList } from '@/hooks/useIncrementalList';
import { groupByMonth } from '../filters';

interface HistoryListProps<T extends { id: string; date: string }> {
  items: T[];
  renderItem: (item: T) => ReactNode;
  emptyTitle: string;
  /** Mostra "Limpar filtros" quando a lista vazia é culpa dos filtros */
  filtered: boolean;
  onClear: () => void;
}

const PAGE_SIZE = 10;

/**
 * Lista agrupada por mês, renderizada em partes (10 por vez, mais ao rolar).
 * Para voltar ao início quando os filtros mudam, quem usa troca a `key` deste componente.
 */
export default function HistoryList<T extends { id: string; date: string }>({
  items,
  renderItem,
  emptyTitle,
  filtered,
  onClear,
}: HistoryListProps<T>) {
  const { visible, hasMore, remaining, sentinelRef, loadMore } = useIncrementalList(items, PAGE_SIZE);

  if (items.length === 0) {
    return (
      <StatusScreen
        icon={SearchX}
        title={filtered ? 'Nada encontrado com esses filtros' : emptyTitle}
        description={filtered ? 'Tente outro período ou outra busca.' : undefined}
        actions={
          filtered && (
            <Button onClick={onClear} variant="outlined" sx={{ height: 48, borderRadius: 999, textTransform: 'none', fontWeight: 600 }}>
              Limpar filtros
            </Button>
          )
        }
      />
    );
  }

  return (
    <Stack spacing={3}>
      {groupByMonth(visible).map((group) => (
        <Box component="section" key={group.label} aria-label={group.label}>
          <Typography
            variant="overline"
            color="text.secondary"
            sx={{ display: 'block', px: 0.5, mb: 1, fontWeight: 700, letterSpacing: 1 }}
          >
            {group.label}
          </Typography>
          <Stack spacing={1.5}>
            {group.items.map((item) => (
              <Box
                key={item.id}
                sx={{
                  // O navegador pula o layout e o desenho dos cartões fora da tela;
                  // o tamanho estimado mantém a barra de rolagem estável
                  contentVisibility: 'auto',
                  containIntrinsicSize: 'auto 300px',
                }}
              >
                {renderItem(item)}
              </Box>
            ))}
          </Stack>
        </Box>
      ))}

      {hasMore && (
        <>
          {/* Ao chegar perto deste ponto, a próxima parte é carregada automaticamente */}
          <Box ref={sentinelRef} aria-hidden sx={{ height: 1 }} />
          <Button
            onClick={loadMore}
            variant="outlined"
            sx={{ alignSelf: 'center', borderRadius: 999, textTransform: 'none', fontWeight: 600 }}
          >
            Carregar mais ({remaining})
          </Button>
        </>
      )}
    </Stack>
  );
}

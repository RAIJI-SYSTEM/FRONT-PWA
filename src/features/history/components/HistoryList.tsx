import type { ReactNode } from 'react';
import { SearchX } from 'lucide-react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import StatusScreen from '@/components/StatusScreen';
import { groupByMonth } from '../filters';

interface HistoryListProps<T extends { id: string; date: string }> {
  items: T[];
  renderItem: (item: T) => ReactNode;
  emptyTitle: string;
  /** Mostra "Limpar filtros" quando a lista vazia é culpa dos filtros */
  filtered: boolean;
  onClear: () => void;
}

/** Lista agrupada por mês, com estado vazio */
export default function HistoryList<T extends { id: string; date: string }>({
  items,
  renderItem,
  emptyTitle,
  filtered,
  onClear,
}: HistoryListProps<T>) {
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
      {groupByMonth(items).map((group) => (
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
              <Box key={item.id}>{renderItem(item)}</Box>
            ))}
          </Stack>
        </Box>
      ))}
    </Stack>
  );
}

import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import StatusScreen from '@/components/StatusScreen';

interface ResultStateProps {
  loading: boolean;
  error?: string;
  empty: boolean;
  emptyIcon: LucideIcon;
  emptyTitle: string;
  emptyDescription?: string;
  children: ReactNode;
}

/** Carregando / erro / vazio / resultados — mesmo comportamento nas três abas */
export default function ResultState({ loading, error, empty, emptyIcon, emptyTitle, emptyDescription, children }: ResultStateProps) {
  if (loading) {
    return (
      <Stack sx={{ alignItems: 'center', py: 6 }} role="status" aria-label="Buscando">
        <CircularProgress />
      </Stack>
    );
  }
  if (error) return <Alert severity="error">{error}</Alert>;
  if (empty) return <StatusScreen icon={emptyIcon} title={emptyTitle} description={emptyDescription} />;
  return <>{children}</>;
}

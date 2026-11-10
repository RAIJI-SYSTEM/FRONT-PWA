'use client';

import type { ReactNode } from 'react';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import Redirect from '@/components/Redirect';
import { useQuery } from '@/hooks/useQuery';
import { getDriverAccount } from '@/services/driverMode';

/** Só mostra as telas do modo motorista para quem já tem cadastro; os demais vão para o cadastro */
export default function DriverGate({ children }: { children: ReactNode }) {
  const { data: account, error } = useQuery('driver-account', getDriverAccount);

  if (error) return <Alert severity="error">{error}</Alert>;
  if (!account) {
    return (
      <Stack sx={{ alignItems: 'center', py: 8 }} role="status" aria-label="Carregando">
        <CircularProgress />
      </Stack>
    );
  }
  if (account.status === 'none') return <Redirect to="/motorista/cadastro" />;
  return children;
}

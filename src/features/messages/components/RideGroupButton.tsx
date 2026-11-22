'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UsersRound } from 'lucide-react';
import Button, { type ButtonProps } from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Snackbar from '@mui/material/Snackbar';
import { findRideGroup } from '@/services/messages';
import { routes } from '@/utils/routes';

interface RideGroupButtonProps extends Omit<ButtonProps, 'onClick' | 'children'> {
  rideId: string;
}

/** "Grupo da viagem": conversa do motorista com todos os passageiros aceitos */
export default function RideGroupButton({ rideId, sx, ...props }: RideGroupButtonProps) {
  const router = useRouter();
  const [opening, setOpening] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const open = async () => {
    setOpening(true);
    try {
      const id = await findRideGroup(rideId);
      if (id) {
        router.push(routes.conversation(id));
        return;
      }
      setNotice('O grupo aparece quando o motorista aceitar o primeiro passageiro.');
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Não foi possível abrir o grupo.');
    }
    setOpening(false);
  };

  return (
    <>
      <Button
        size="small"
        variant="outlined"
        onClick={open}
        disabled={opening}
        startIcon={opening ? <CircularProgress size={14} color="inherit" /> : <UsersRound size={16} />}
        sx={[{ flexShrink: 0, borderRadius: 999, textTransform: 'none', fontWeight: 600 }, ...(Array.isArray(sx) ? sx : [sx])]}
        {...props}
      >
        Grupo da viagem
      </Button>
      <Snackbar open={Boolean(notice)} autoHideDuration={5000} onClose={() => setNotice(null)} message={notice} />
    </>
  );
}

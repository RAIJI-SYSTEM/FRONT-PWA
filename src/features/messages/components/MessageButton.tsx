'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MessageCircle } from 'lucide-react';
import Button, { type ButtonProps } from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Snackbar from '@mui/material/Snackbar';
import { useSession } from '@/hooks/useSession';
import { openDirectChat, type ChatTarget } from '@/services/messages';
import { routes } from '@/utils/routes';

interface MessageButtonProps extends Omit<ButtonProps, 'onClick' | 'children'> {
  /** Com quem conversar (ou uma função que descobre, ex.: buscando a encomenda no backend) */
  target: ChatTarget | (() => Promise<ChatTarget>);
  label?: string;
}

/**
 * "Mensagem": abre (ou reabre) a conversa direta com o motorista, passageiro ou remetente,
 * já ligada à corrida/encomenda, e vai para ela.
 */
export default function MessageButton({ target, label = 'Mensagem', sx, ...props }: MessageButtonProps) {
  const router = useRouter();
  const session = useSession();
  const [opening, setOpening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const open = async () => {
    setOpening(true);
    setError(null);
    try {
      const resolved = typeof target === 'function' ? await target() : target;
      if (!resolved.userId) throw new Error('Ainda não dá para conversar: o motorista não foi definido.');
      if (resolved.userId === session?.user.id) throw new Error('Esta viagem é sua.');
      const id = await openDirectChat(resolved);
      router.push(routes.conversation(id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível abrir a conversa.');
      setOpening(false);
    }
  };

  return (
    <>
      <Button
        size="small"
        variant="outlined"
        onClick={open}
        disabled={opening}
        startIcon={opening ? <CircularProgress size={14} color="inherit" /> : <MessageCircle size={16} />}
        sx={[{ flexShrink: 0, borderRadius: 999, textTransform: 'none', fontWeight: 600 }, ...(Array.isArray(sx) ? sx : [sx])]}
        {...props}
      >
        {label}
      </Button>
      <Snackbar open={Boolean(error)} autoHideDuration={5000} onClose={() => setError(null)} message={error} />
    </>
  );
}

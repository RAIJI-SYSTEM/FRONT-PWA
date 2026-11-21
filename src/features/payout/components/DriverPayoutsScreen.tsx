'use client';

import { useState } from 'react';
import { Check, KeyRound, Pencil, Wallet } from 'lucide-react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { usePolling } from '@/hooks/usePolling';
import { getMyPayouts, savePixKey } from '@/services/payouts';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';
import PayoutItemList from './PayoutItemList';

const loadOnce = () => false;
const pill = { borderRadius: 999, textTransform: 'none', fontWeight: 600 } as const;

/**
 * Repasses do motorista: quanto a plataforma ainda vai mandar por Pix (viagens concluídas e
 * encomendas entregues, já sem a comissão), a chave Pix e os repasses já recebidos.
 */
export default function DriverPayoutsScreen() {
  const { data, error, setData } = usePolling('my-payouts', getMyPayouts, loadOnce);
  const [editing, setEditing] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [pixError, setPixError] = useState<string | null>(null);

  if (error) return <Alert severity="error">{error}</Alert>;
  if (!data) {
    return (
      <Stack sx={{ alignItems: 'center', py: 8 }}>
        <CircularProgress />
      </Stack>
    );
  }

  const save = async () => {
    if (editing === null) return;
    setSaving(true);
    setPixError(null);
    try {
      const { pixKey } = await savePixKey(editing);
      setData({ ...data, pixKey });
      setEditing(null);
    } catch (err) {
      setPixError(err instanceof Error ? err.message : 'Não foi possível salvar.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Stack spacing={2.5}>
      <Paper
        variant="outlined"
        sx={{ p: 2.5, borderRadius: 3, bgcolor: 'rgba(var(--mui-palette-primary-mainChannel) / 0.08)', borderColor: 'primary.main' }}
      >
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', color: 'primary.main' }}>
          <Wallet size={20} />
          <Typography sx={{ fontWeight: 700 }}>A receber</Typography>
        </Stack>
        <Typography sx={{ fontWeight: 800, fontSize: '2rem', mt: 0.5 }}>{formatCurrency(data.pendingCents)}</Typography>
        <Typography variant="body2" color="text.secondary">
          Viagens concluídas e encomendas entregues que foram pagas pelo app, já sem a comissão. A plataforma envia por Pix
          para a sua chave.
        </Typography>
      </Paper>

      <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1 }}>
          <KeyRound size={18} />
          <Typography sx={{ fontWeight: 700 }}>Chave Pix</Typography>
        </Stack>
        {editing !== null ? (
          <Stack spacing={1.5}>
            <TextField
              autoFocus
              label="Chave Pix"
              placeholder="CPF, e-mail, celular ou chave aleatória"
              value={editing}
              onChange={(e) => setEditing(e.target.value)}
              error={Boolean(pixError)}
              helperText={pixError ?? 'Confira com cuidado: é para ela que o dinheiro vai.'}
            />
            <Stack direction="row" spacing={1}>
              <Button variant="contained" onClick={save} disabled={saving || !editing.trim()} startIcon={<Check size={16} />} sx={pill}>
                Salvar
              </Button>
              <Button color="inherit" onClick={() => setEditing(null)} sx={pill}>
                Cancelar
              </Button>
            </Stack>
          </Stack>
        ) : (
          <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
            <Typography color={data.pixKey ? 'text.primary' : 'text.secondary'} sx={{ wordBreak: 'break-all' }}>
              {data.pixKey ?? 'Cadastre a chave para receber os repasses.'}
            </Typography>
            <Button size="small" variant={data.pixKey ? 'text' : 'contained'} startIcon={<Pencil size={14} />} onClick={() => setEditing(data.pixKey ?? '')} sx={{ ...pill, flexShrink: 0 }}>
              {data.pixKey ? 'Alterar' : 'Cadastrar'}
            </Button>
          </Stack>
        )}
      </Paper>

      {data.pending.length > 0 && (
        <Box>
          <Typography sx={{ fontWeight: 700, mb: 1 }}>Ainda não repassado</Typography>
          <PayoutItemList items={data.pending} />
        </Box>
      )}

      <Box>
        <Typography sx={{ fontWeight: 700, mb: 1 }}>Repasses recebidos</Typography>
        {data.payouts.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            Nenhum repasse ainda.
          </Typography>
        ) : (
          <Paper variant="outlined" sx={{ borderRadius: 3 }}>
            {data.payouts.map((p, i) => (
              <Box key={p.id}>
                {i > 0 && <Divider />}
                <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', p: 1.75 }}>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {formatDate(p.paidAt)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {p.itemCount} {p.itemCount === 1 ? 'item' : 'itens'}
                      {p.pixKey ? ` · Pix para ${p.pixKey}` : ''}
                    </Typography>
                  </Box>
                  <Typography sx={{ fontWeight: 700 }}>{formatCurrency(p.amountCents)}</Typography>
                </Stack>
              </Box>
            ))}
          </Paper>
        )}
      </Box>
    </Stack>
  );
}

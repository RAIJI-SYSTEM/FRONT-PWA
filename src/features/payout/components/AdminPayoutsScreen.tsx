'use client';

import { useState } from 'react';
import { ChevronDown, Copy, Send, ShieldAlert } from 'lucide-react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Collapse from '@mui/material/Collapse';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { usePolling } from '@/hooks/usePolling';
import { useSession } from '@/hooks/useSession';
import { isAdmin } from '@/services/auth';
import { getPayoutBalances, getPayoutHistory, registerPayout, type DriverBalanceApi } from '@/services/payouts';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';
import PayoutItemList from './PayoutItemList';

const loadOnce = () => false;
const pill = { borderRadius: 999, textTransform: 'none', fontWeight: 600 } as const;

async function load() {
  const [balances, history] = await Promise.all([getPayoutBalances(), getPayoutHistory()]);
  return { balances, history };
}

/**
 * Repasse manual (admin): quanto a plataforma deve a cada motorista. O admin copia a chave,
 * faz o Pix no banco e registra aqui; os itens saem do saldo e o motorista é avisado.
 */
export default function AdminPayoutsScreen() {
  const session = useSession();
  const admin = isAdmin(session);
  const [round, setRound] = useState(0);
  const { data, error } = usePolling(admin ? `admin-payouts:${round}` : 'admin-payouts:off', admin ? load : async () => null, loadOnce);
  const [open, setOpen] = useState<string | null>(null);
  const [paying, setPaying] = useState<DriverBalanceApi | null>(null);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);

  if (!admin) {
    return (
      <Alert severity="warning" icon={<ShieldAlert size={20} />}>
        Só administradores veem os repasses. Dê a role <b>admin</b> à sua conta no Keycloak e entre de novo.
      </Alert>
    );
  }
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!data) {
    return (
      <Stack sx={{ alignItems: 'center', py: 8 }}>
        <CircularProgress />
      </Stack>
    );
  }

  const total = data.balances.reduce((t, b) => t + b.amountCents, 0);

  const confirm = async () => {
    if (!paying) return;
    setSaving(true);
    try {
      await registerPayout(paying.driverSub, paying.amountCents, note.trim());
      setNotice({ ok: true, text: `Repasse de ${formatCurrency(paying.amountCents)} registrado. O motorista foi avisado.` });
      setPaying(null);
      setNote('');
      setRound((r) => r + 1);
    } catch (err) {
      setNotice({ ok: false, text: err instanceof Error ? err.message : 'Não foi possível registrar.' });
      setPaying(null);
      setRound((r) => r + 1);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Stack spacing={2.5}>
      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
        <Typography variant="body2" color="text.secondary">
          Total a repassar
        </Typography>
        <Typography sx={{ fontWeight: 800, fontSize: '2rem' }}>{formatCurrency(total)}</Typography>
        <Typography variant="body2" color="text.secondary">
          Para cada motorista: copie a chave Pix, faça o Pix no seu banco com o valor exato e toque em “Registrar Pix”.
        </Typography>
      </Paper>

      {notice && (
        <Alert severity={notice.ok ? 'success' : 'error'} onClose={() => setNotice(null)}>
          {notice.text}
        </Alert>
      )}

      {data.balances.length === 0 ? (
        <Typography color="text.secondary">Nenhum motorista com valor a receber.</Typography>
      ) : (
        data.balances.map((b) => (
          <Paper key={b.driverSub} variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
            <Stack spacing={1.25} sx={{ p: 2 }}>
              <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'baseline', gap: 1 }}>
                <Typography sx={{ fontWeight: 700 }} noWrap>
                  {b.driverName ?? 'Motorista'}
                </Typography>
                <Typography sx={{ fontWeight: 800, fontSize: '1.25rem', flexShrink: 0 }}>{formatCurrency(b.amountCents)}</Typography>
              </Stack>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                <Typography variant="body2" color={b.pixKey ? 'text.primary' : 'error.main'} sx={{ flex: 1, wordBreak: 'break-all' }}>
                  {b.pixKey ? `Pix: ${b.pixKey}` : 'Sem chave Pix cadastrada'}
                </Typography>
                {b.pixKey && (
                  <IconButton
                    size="small"
                    aria-label="Copiar chave Pix"
                    onClick={() => navigator.clipboard?.writeText(b.pixKey!).then(() => setNotice({ ok: true, text: 'Chave Pix copiada.' }))}
                  >
                    <Copy size={16} />
                  </IconButton>
                )}
              </Stack>
              <Stack direction="row" spacing={1} sx={{ justifyContent: 'space-between' }}>
                <Button
                  size="small"
                  color="inherit"
                  onClick={() => setOpen(open === b.driverSub ? null : b.driverSub)}
                  endIcon={<ChevronDown size={16} style={{ transform: open === b.driverSub ? 'rotate(180deg)' : undefined }} />}
                  sx={pill}
                >
                  {b.itemCount} {b.itemCount === 1 ? 'item' : 'itens'}
                </Button>
                <Button size="small" variant="contained" disabled={!b.pixKey} startIcon={<Send size={16} />} onClick={() => setPaying(b)} sx={pill}>
                  Registrar Pix
                </Button>
              </Stack>
            </Stack>
            <Collapse in={open === b.driverSub}>
              <Box sx={{ px: 2, pb: 2 }}>
                <PayoutItemList items={b.items} />
              </Box>
            </Collapse>
          </Paper>
        ))
      )}

      <Box>
        <Typography sx={{ fontWeight: 700, mb: 1 }}>Repasses registrados</Typography>
        {data.history.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            Nenhum ainda.
          </Typography>
        ) : (
          <Paper variant="outlined" sx={{ borderRadius: 3 }}>
            {data.history.map((p, i) => (
              <Box key={p.id}>
                {i > 0 && <Divider />}
                <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', p: 1.75, gap: 1 }}>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                      {formatDate(p.paidAt)} · {p.pixKey ?? 'sem chave'}
                    </Typography>
                    {p.note && (
                      <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
                        {p.note}
                      </Typography>
                    )}
                  </Box>
                  <Typography sx={{ fontWeight: 700, flexShrink: 0 }}>{formatCurrency(p.amountCents)}</Typography>
                </Stack>
              </Box>
            ))}
          </Paper>
        )}
      </Box>

      <Dialog open={Boolean(paying)} onClose={() => !saving && setPaying(null)} fullWidth maxWidth="xs">
        {paying && (
          <Stack spacing={2} sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Registrar Pix enviado
            </Typography>
            <Typography variant="body2">
              Confirme que você já enviou <b>{formatCurrency(paying.amountCents)}</b> para <b>{paying.pixKey}</b> (
              {paying.driverName ?? 'motorista'}).
            </Typography>
            <TextField
              label="Observação (opcional)"
              placeholder="Ex.: ID da transação do banco"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <Stack direction="row" spacing={1.5}>
              <Button fullWidth color="inherit" disabled={saving} onClick={() => setPaying(null)} sx={{ ...pill, height: 48 }}>
                Cancelar
              </Button>
              <Button
                fullWidth
                variant="contained"
                disabled={saving}
                onClick={confirm}
                startIcon={saving ? <CircularProgress size={18} color="inherit" /> : undefined}
                sx={{ ...pill, height: 48 }}
              >
                Já enviei
              </Button>
            </Stack>
          </Stack>
        )}
      </Dialog>
    </Stack>
  );
}

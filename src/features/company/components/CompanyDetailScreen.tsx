'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, Trash2, Truck, UserPlus } from 'lucide-react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { fromBrazilLocal, toCents } from '@/services/backend/client';
import { usePolling } from '@/hooks/usePolling';
import { getCompany, inviteMember, listCompanyFreights, removeMember } from '@/services/companies';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate, formatTime } from '@/utils/formatDate';
import { FREIGHT_STATUS } from './freightLabels';

const loadOnce = () => false;
const loadCompany = async (id: string) => {
  const [detail, freights] = await Promise.all([getCompany(id), listCompanyFreights(id)]);
  return { detail, freights };
};

const pill = { borderRadius: 999, textTransform: 'none', fontWeight: 600 } as const;

/** Uma empresa: gestores (convidar/remover) e os fretes propostos */
export default function CompanyDetailScreen({ companyId }: { companyId: string }) {
  const [round, setRound] = useState(0);
  const { data, error } = usePolling(`company:${companyId}:${round}`, () => loadCompany(companyId), loadOnce);
  const detail = data?.detail ?? null;
  const freights = data?.freights ?? [];
  const load = async () => setRound((r) => r + 1);
  const [email, setEmail] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (error) return <Alert severity="error">{error}</Alert>;
  if (!detail) {
    return (
      <Stack sx={{ alignItems: 'center', py: 8 }}>
        <CircularProgress />
      </Stack>
    );
  }

  const { company, members } = detail;
  const iAmOwner = company.myRole === 'OWNER';

  const invite = async () => {
    setBusy(true);
    setNotice(null);
    try {
      await inviteMember(company.id, email.trim());
      setEmail('');
      setNotice('Convite enviado por e-mail. A pessoa aceita entrando no app com esse e-mail.');
      await load();
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Não foi possível convidar.');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (memberId: string) => {
    setBusy(true);
    try {
      await removeMember(company.id, memberId);
      await load();
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Não foi possível remover.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Stack spacing={2.5}>
      <Box>
        <Typography component="h1" variant="h5" sx={{ fontWeight: 800 }}>
          {company.displayName}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {company.legalName} · {company.cnpjFormatted} · {company.kind === 'MEI' ? 'MEI' : 'Empresa'}
        </Typography>
      </Box>

      <Button
        component={Link}
        href={`/empresa/frete/novo?empresa=${encodeURIComponent(company.id)}`}
        variant="contained"
        startIcon={<Plus size={20} />}
        sx={{ ...pill, height: 52, fontSize: '1rem', boxShadow: 3 }}
      >
        Novo frete
      </Button>

      <Stack spacing={1.25}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <Truck size={20} />
          <Typography sx={{ fontWeight: 700 }}>Fretes</Typography>
        </Stack>
        {freights.length === 0 && <Typography color="text.secondary">Nenhum frete ainda.</Typography>}
        {freights.map((f) => {
          const at = fromBrazilLocal(f.desiredDate);
          const status = FREIGHT_STATUS[f.status];
          return (
            <Paper
              key={f.id}
              component={Link}
              href={`/empresa/frete?id=${encodeURIComponent(f.id)}`}
              variant="outlined"
              sx={{ p: 1.5, borderRadius: 3, textDecoration: 'none', color: 'inherit', display: 'block' }}
            >
              <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography sx={{ fontWeight: 700 }} noWrap>
                  {f.originCity} → {f.destinationCity}
                </Typography>
                <Chip size="small" label={status.label} color={status.color} />
              </Stack>
              <Typography variant="body2" color="text.secondary">
                {formatDate(at)} às {formatTime(at)} · {f.description} · {f.direct ? 'Proposta direta' : 'Pedido público'}
              </Typography>
              <Typography variant="body2">
                {f.offeredPrice !== null ? formatCurrency(toCents(f.offeredPrice)) : 'Sem valor de referência'}
                {!f.direct && f.status === 'OPEN' ? ` · ${f.pendingOffers} oferta(s)` : ''}
              </Typography>
            </Paper>
          );
        })}
      </Stack>

      <Divider />

      <Stack spacing={1.25}>
        <Typography sx={{ fontWeight: 700 }}>Quem gerencia</Typography>
        <Typography variant="body2" color="text.secondary">
          Todos os gestores criam fretes, escolhem ofertas e aprovam pagamentos. Só o dono remove gestores.
        </Typography>
        {members.map((m) => (
          <Stack key={m.id} direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontWeight: 600 }} noWrap>
                {m.displayName ?? m.email} {m.you ? '(você)' : ''}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {m.email} · {m.role === 'OWNER' ? 'Dono' : m.status === 'INVITED' ? 'Convite pendente' : 'Gestor'}
              </Typography>
            </Box>
            {m.role !== 'OWNER' && (iAmOwner || m.you) && (
              <IconButton aria-label={m.you ? 'Sair da empresa' : `Remover ${m.email}`} disabled={busy} onClick={() => remove(m.id)}>
                <Trash2 size={18} />
              </IconButton>
            )}
          </Stack>
        ))}
        <Stack direction="row" spacing={1}>
          <TextField fullWidth size="small" type="email" label="E-mail de quem vai gerenciar" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Button variant="outlined" startIcon={<UserPlus size={16} />} disabled={busy || !email.includes('@')} onClick={invite} sx={pill}>
            Convidar
          </Button>
        </Stack>
        {notice && (
          <Alert severity="info" onClose={() => setNotice(null)}>
            {notice}
          </Alert>
        )}
      </Stack>
    </Stack>
  );
}

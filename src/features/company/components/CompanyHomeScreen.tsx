'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Building2, ChevronRight, Mail, Search } from 'lucide-react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { usePolling } from '@/hooks/usePolling';
import type { CnpjPreviewApi, CompanyInviteApi } from '@/services/backend/types';
import { acceptInvite, declineInvite, listMyCompanies, listMyInvites, previewCnpj, registerCompany } from '@/services/companies';

const loadOnce = () => false;
const loadCompanies = async () => {
  const [companies, invites] = await Promise.all([listMyCompanies(), listMyInvites()]);
  return { companies, invites };
};

const pill = { borderRadius: 999, textTransform: 'none', fontWeight: 600 } as const;

const formatCnpjInput = (value: string) => {
  const d = value.replace(/\D/g, '').slice(0, 14);
  return d
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
};

/**
 * Empresas: as que eu gerencio, convites recebidos e o cadastro de uma nova pelo CNPJ
 * (os dados vêm da Receita Federal; só CNPJ ativo).
 */
export default function CompanyHomeScreen() {
  // Trocar a "rodada" recarrega a lista (depois de cadastrar, aceitar convite...)
  const [round, setRound] = useState(0);
  const { data, error: loadError } = usePolling(`companies:${round}`, loadCompanies, loadOnce);
  const companies = data?.companies ?? null;
  const invites = data?.invites ?? [];
  const [actionError, setError] = useState<string | null>(null);
  const error = loadError ?? actionError;
  const load = async () => setRound((r) => r + 1);
  const [cnpj, setCnpj] = useState('');
  const [preview, setPreview] = useState<CnpjPreviewApi | null>(null);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const consult = async () => {
    setFormError(null);
    setPreview(null);
    setBusy(true);
    try {
      setPreview(await previewCnpj(cnpj));
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Não foi possível consultar.');
    } finally {
      setBusy(false);
    }
  };

  const register = async () => {
    setBusy(true);
    setFormError(null);
    try {
      await registerCompany(cnpj);
      setCnpj('');
      setPreview(null);
      await load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Não foi possível cadastrar.');
    } finally {
      setBusy(false);
    }
  };

  const respond = async (invite: CompanyInviteApi, accept: boolean) => {
    setBusy(true);
    try {
      if (accept) await acceptInvite(invite.memberId);
      else await declineInvite(invite.memberId);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível responder.');
    } finally {
      setBusy(false);
    }
  };

  if (error) return <Alert severity="error">{error}</Alert>;
  if (!companies) {
    return (
      <Stack sx={{ alignItems: 'center', py: 8 }}>
        <CircularProgress />
      </Stack>
    );
  }

  return (
    <Stack spacing={3}>
      <Box>
        <Typography component="h1" variant="h5" sx={{ fontWeight: 800 }}>
          Empresa
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Envie encomendas em nome da empresa, proponha fretes a motoristas e divida a gestão com outras pessoas.
        </Typography>
      </Box>

      {invites.map((invite) => (
        <Alert
          key={invite.memberId}
          icon={<Mail size={20} />}
          severity="info"
          action={
            <Stack direction="row" spacing={0.5}>
              <Button size="small" disabled={busy} onClick={() => respond(invite, false)}>
                Recusar
              </Button>
              <Button size="small" variant="contained" disabled={busy} onClick={() => respond(invite, true)}>
                Aceitar
              </Button>
            </Stack>
          }
        >
          Convite para gerenciar <b>{invite.companyName}</b> ({invite.cnpjFormatted})
        </Alert>
      ))}

      {companies.length > 0 && (
        <Stack spacing={1.25}>
          {companies.map((c) => (
            <Paper
              key={c.id}
              component={Link}
              href={`/empresa/detalhe?id=${encodeURIComponent(c.id)}`}
              variant="outlined"
              sx={{ p: 2, borderRadius: 3, display: 'flex', alignItems: 'center', gap: 1.5, textDecoration: 'none', color: 'inherit' }}
            >
              <Building2 size={28} color="var(--mui-palette-primary-main)" />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ fontWeight: 700 }} noWrap>
                  {c.displayName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {c.cnpjFormatted} · {c.myRole === 'OWNER' ? 'Dono' : 'Gestor'}
                </Typography>
              </Box>
              <Chip size="small" label={c.kind === 'MEI' ? 'MEI' : 'Empresa'} />
              <ChevronRight size={20} />
            </Paper>
          ))}
        </Stack>
      )}

      <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
        <Typography sx={{ fontWeight: 700, mb: 1.5 }}>Cadastrar empresa</Typography>
        <Stack direction="row" spacing={1}>
          <TextField
            fullWidth
            size="small"
            label="CNPJ"
            value={cnpj}
            onChange={(e) => {
              setCnpj(formatCnpjInput(e.target.value));
              setPreview(null);
            }}
            slotProps={{ htmlInput: { inputMode: 'numeric' } }}
          />
          <Button variant="outlined" startIcon={<Search size={16} />} disabled={busy || cnpj.replace(/\D/g, '').length !== 14} onClick={consult} sx={pill}>
            Consultar
          </Button>
        </Stack>
        <Typography variant="caption" color="text.secondary">
          Conferimos os dados na Receita Federal.
        </Typography>
        {preview && (
          <Box sx={{ mt: 1.5 }}>
            <Typography sx={{ fontWeight: 700 }}>{preview.tradeName || preview.legalName}</Typography>
            <Typography variant="body2" color="text.secondary">
              {preview.legalName} · {preview.kind === 'MEI' ? 'MEI' : 'Empresa'}
              {preview.city ? ` · ${preview.city}/${preview.state}` : ''}
            </Typography>
            <Typography variant="body2">Situação na Receita: {preview.registrationStatus ?? 'desconhecida'}</Typography>
            {preview.alreadyRegistered ? (
              <Alert severity="info" sx={{ mt: 1 }}>
                Esta empresa já está no Raiji. Peça a um dos gestores para convidar você.
              </Alert>
            ) : preview.active ? (
              <Button variant="contained" sx={{ ...pill, mt: 1 }} disabled={busy} onClick={register}>
                É minha empresa — cadastrar
              </Button>
            ) : (
              <Alert severity="warning" sx={{ mt: 1 }}>
                Só dá para cadastrar CNPJ ativo.
              </Alert>
            )}
          </Box>
        )}
        {formError && (
          <Alert severity="error" sx={{ mt: 1.5 }}>
            {formError}
          </Alert>
        )}
      </Paper>
    </Stack>
  );
}

'use client';

import { unregisterPush } from '@/features/push/push';
import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Check, ExternalLink, LogOut, Phone } from 'lucide-react';
import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import InputAdornment from '@mui/material/InputAdornment';
import Paper from '@mui/material/Paper';
import Snackbar from '@mui/material/Snackbar';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import SettingsSection from '@/features/settings/components/SettingsSection';
import { useQuery } from '@/hooks/useQuery';
import { useSession } from '@/hooks/useSession';
import { openAccountPage, signOut } from '@/services/auth';
import { getContact, getMe, updatePhone } from '@/services/profile';
import { formatPhone, fromE164, toE164 } from '@/utils/phone';

const pill = { height: 52, borderRadius: 999, textTransform: 'none', fontWeight: 600 } as const;

const ACCOUNT_TYPE = { PF: 'Pessoa física', PJ: 'Pessoa jurídica' } as const;

const loadProfile = () => Promise.all([getMe(), getContact()]).then(([me, contact]) => ({ me, contact }));

/**
 * Perfil: nome e e-mail vêm do login (trocados na página "Minha conta" do Keycloak);
 * o telefone é salvo no backend Raiji.
 */
export default function ProfileScreen() {
  const router = useRouter();
  const session = useSession();
  const { data, error } = useQuery('profile', loadProfile);
  // null = ainda não editado (mostra o salvo no servidor)
  const [phone, setPhone] = useState<string | null>(null);
  const [savedPhone, setSavedPhone] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [leaving, setLeaving] = useState(false);

  if (error) return <Alert severity="error">{error}</Alert>;
  if (!data) {
    return (
      <Stack sx={{ alignItems: 'center', py: 8 }} role="status" aria-label="Carregando perfil">
        <CircularProgress />
      </Stack>
    );
  }

  const { me, contact } = data;
  const name = contact.fullName ?? session?.user.name ?? 'Sem nome';
  const email = contact.email ?? session?.user.email ?? '';
  const currentPhone = savedPhone ?? fromE164(contact.phone);
  const phoneValue = phone ?? currentPhone;
  const phoneChanged = phoneValue !== currentPhone;

  const savePhone = async (event: FormEvent) => {
    event.preventDefault();
    const e164 = toE164(phoneValue);
    if (!e164) {
      setPhoneError('Informe o DDD e o número, ex.: (11) 91234-5678.');
      return;
    }
    setSaving(true);
    try {
      const updated = await updatePhone(e164);
      setSavedPhone(fromE164(updated.phone));
      setPhone(null);
      setSaved(true);
    } catch (err) {
      setPhoneError(err instanceof Error ? err.message : 'Não foi possível salvar o telefone.');
    } finally {
      setSaving(false);
    }
  };

  const leave = async () => {
    setLeaving(true);
    await unregisterPush();
    await signOut();
    router.replace('/login');
  };

  return (
    <Stack spacing={4}>
      <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
        <Avatar
          src={contact.photoUrl ?? undefined}
          alt=""
          sx={{ width: 72, height: 72, bgcolor: 'primary.main', color: 'primary.contrastText', fontWeight: 700, fontSize: '1.75rem' }}
        >
          {name.charAt(0).toUpperCase()}
        </Avatar>
        <Box sx={{ minWidth: 0 }}>
          <Typography component="h2" variant="h5" sx={{ fontWeight: 800 }} noWrap>
            {name}
          </Typography>
          <Typography color="text.secondary" noWrap>
            {email}
          </Typography>
          <Stack direction="row" spacing={0.75} sx={{ mt: 0.75 }}>
            {me.passenger && <Chip size="small" label="Passageiro" />}
            {me.driver && <Chip size="small" color="primary" label="Motorista" />}
          </Stack>
        </Box>
      </Stack>

      <SettingsSection id="telefone" title="Telefone" description="Os motoristas e passageiros das suas viagens usam este número para falar com você.">
        <Stack component="form" noValidate spacing={1.5} onSubmit={savePhone}>
          <TextField
            label="Celular"
            value={phoneValue}
            onChange={(e) => {
              setPhone(formatPhone(e.target.value));
              setPhoneError(null);
            }}
            placeholder="(11) 91234-5678"
            error={Boolean(phoneError)}
            helperText={phoneError ?? ' '}
            autoComplete="tel-national"
            slotProps={{
              htmlInput: { inputMode: 'tel' },
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Phone size={18} />
                  </InputAdornment>
                ),
              },
            }}
          />
          <Button
            type="submit"
            variant="contained"
            disabled={!phoneChanged || saving}
            startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <Check size={18} />}
            sx={pill}
          >
            Salvar telefone
          </Button>
        </Stack>
      </SettingsSection>

      <SettingsSection id="conta" title="Conta">
        <Paper variant="outlined" sx={{ borderRadius: 3, p: 2 }}>
          <Stack spacing={1.5}>
            <Row label="Nome" value={name} />
            <Row label="E-mail" value={email} />
            <Row label="Tipo de conta" value={me.userType ? ACCOUNT_TYPE[me.userType] : 'Não definido'} />
          </Stack>
        </Paper>
        <Button
          fullWidth
          variant="outlined"
          color="inherit"
          onClick={() => void openAccountPage()}
          endIcon={<ExternalLink size={18} />}
          sx={{ ...pill, mt: 1.5, borderColor: 'divider' }}
        >
          Alterar nome, e-mail ou senha
        </Button>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.75, textAlign: 'center' }}>
          Abre a página segura da sua conta Raiji. Depois de alterar, entre de novo para atualizar aqui.
        </Typography>
      </SettingsSection>

      <Button
        fullWidth
        variant="outlined"
        color="error"
        onClick={leave}
        disabled={leaving}
        startIcon={leaving ? <CircularProgress size={20} color="inherit" /> : <LogOut size={18} />}
        sx={pill}
      >
        Sair da conta
      </Button>

      <Snackbar
        open={saved}
        autoHideDuration={3000}
        onClose={() => setSaved(false)}
        message="Telefone salvo."
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      />
    </Stack>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <Stack direction="row" spacing={2} sx={{ justifyContent: 'space-between' }}>
      <Typography color="text.secondary">{label}</Typography>
      <Typography sx={{ fontWeight: 600, textAlign: 'right', minWidth: 0, overflowWrap: 'anywhere' }}>{value}</Typography>
    </Stack>
  );
}

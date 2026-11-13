'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Bike, Bus, Car, CircleCheck, Clock, EllipsisVertical, IdCard, Pencil, Plus, Repeat, Star, type LucideIcon } from 'lucide-react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { usePolling } from '@/hooks/usePolling';
import { ApiError } from '@/services/api';
import { addVehicle, getDriverAccount, removeVehicle, saveCnh, updateVehicle } from '@/services/driverMode';
import type { DriverAccount, Vehicle, VehicleType } from '@/types/driverMode';
import { clearFieldErrors, formatPlate, validateCnh, validateVehicle } from '@/utils/driverValidation';
import CnhVerificationForm, { EMPTY_CNH_VERIFICATION, validateCnhVerification, type CnhVerificationDraft } from './CnhVerificationForm';
import VehicleForm, { draftToVehicle, EMPTY_VEHICLE, vehicleToDraft, type VehicleDraft } from './VehicleForm';
import { apiUrl } from '@/services/api';

const loadOnce = () => false;
const TYPE_ICONS: Record<VehicleType, LucideIcon> = { car: Car, van: Bus, motorcycle: Bike };
const pill = { borderRadius: 999, textTransform: 'none', fontWeight: 600 } as const;

type Editing = { kind: 'cnh' } | { kind: 'vehicle'; vehicle?: Vehicle } | null;

function Section({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <Box component="section" aria-label={title}>
      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 1.25 }}>
        <Typography component="h2" variant="h6" sx={{ fontWeight: 700 }}>
          {title}
        </Typography>
        {action}
      </Stack>
      {children}
    </Box>
  );
}

/** Perfil do motorista: status do cadastro, CNH, veículos e volta ao modo passageiro */
export default function DriverProfileScreen() {
  const { data: account, error, setData } = usePolling('driver-account', getDriverAccount, loadOnce);
  const [editing, setEditing] = useState<Editing>(null);
  const [menu, setMenu] = useState<{ anchor: HTMLElement; vehicle: Vehicle } | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  if (!account) {
    return error ? (
      <Alert severity="error">{error}</Alert>
    ) : (
      <Stack sx={{ alignItems: 'center', py: 8 }}>
        <CircularProgress />
      </Stack>
    );
  }

  const run = async (action: () => Promise<DriverAccount>) => {
    setActionError(null);
    try {
      setData(await action());
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Não foi possível concluir.');
    }
  };

  const { cnh } = account;
  const approved = account.status === 'approved';

  return (
    <Stack spacing={3.5}>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
        <Box sx={{ flex: 1 }}>
          <Typography component="h1" variant="h5" sx={{ fontWeight: 800 }}>
            Perfil de motorista
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Documentos e veículos usados nas suas viagens.
          </Typography>
        </Box>
        <Chip
          icon={approved ? <CircleCheck size={16} /> : <Clock size={16} />}
          label={approved ? 'Aprovado' : 'Em análise'}
          color={approved ? 'success' : 'default'}
          sx={{ fontWeight: 700 }}
        />
      </Stack>

      {actionError && (
        <Alert severity="warning" onClose={() => setActionError(null)}>
          {actionError}
        </Alert>
      )}

      <Section
        title="CNH"
        action={
          <Button size="small" startIcon={<Pencil size={16} />} onClick={() => setEditing({ kind: 'cnh' })} sx={pill}>
            Editar
          </Button>
        }
      >
        {cnh ? (
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
              <IdCard size={28} color="var(--mui-palette-primary-main)" />
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ fontWeight: 700 }}>CNH verificada no SENATRAN</Typography>
                <Typography variant="body2" color="text.secondary">
                  Categoria {cnh.category} · válida até {new Date(`${cnh.expiresAt}T12:00:00`).toLocaleDateString('pt-BR')}
                </Typography>
              </Box>
              {cnh.ear && <Chip size="small" color="success" label="EAR" sx={{ fontWeight: 700 }} />}
            </Stack>
            <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
              {[cnh.frontPhoto, cnh.backPhoto].map(
                (photo, i) =>
                  photo && (
                    // eslint-disable-next-line @next/next/no-img-element -- foto enviada pelo usuário
                    <img key={photo.id} src={apiUrl(photo.url)} alt={i === 0 ? 'Frente da CNH' : 'Verso da CNH'} style={{ width: 88, height: 56, objectFit: 'cover', borderRadius: 8 }} />
                  ),
              )}
            </Stack>
          </Paper>
        ) : (
          <Alert severity="info">Cadastre sua CNH para dirigir.</Alert>
        )}
      </Section>

      <Section
        title="Veículos"
        action={
          <Button size="small" startIcon={<Plus size={16} />} onClick={() => setEditing({ kind: 'vehicle' })} sx={pill}>
            Adicionar
          </Button>
        }
      >
        <Stack spacing={1.5}>
          {account.vehicles.map((vehicle) => {
            const Icon = TYPE_ICONS[vehicle.type];
            return (
              <Paper key={vehicle.id} variant="outlined" sx={{ p: 2, borderRadius: 3, borderColor: vehicle.primary ? 'primary.main' : 'divider' }}>
                <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      flexShrink: 0,
                      borderRadius: 2,
                      display: 'grid',
                      placeItems: 'center',
                      color: 'primary.main',
                      bgcolor: 'rgba(var(--mui-palette-primary-mainChannel) / 0.12)',
                    }}
                  >
                    <Icon size={22} />
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                      <Typography sx={{ fontWeight: 700 }} noWrap>
                        {vehicle.model}
                      </Typography>
                      {vehicle.primary && <Chip size="small" color="primary" icon={<Star size={12} />} label="Principal" sx={{ fontWeight: 700, height: 22 }} />}
                    </Stack>
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {vehicle.year} · {vehicle.color} · {vehicle.seats} lugar{vehicle.seats === 1 ? '' : 'es'}
                    </Typography>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 700, letterSpacing: 1 }}>
                      {formatPlate(vehicle.plate)}
                    </Typography>
                  </Box>
                  <IconButton aria-label={`Opções do ${vehicle.model}`} onClick={(e) => setMenu({ anchor: e.currentTarget, vehicle })}>
                    <EllipsisVertical size={20} />
                  </IconButton>
                </Stack>
              </Paper>
            );
          })}
        </Stack>
      </Section>

      <Menu anchorEl={menu?.anchor} open={Boolean(menu)} onClose={() => setMenu(null)}>
        {menu && !menu.vehicle.primary && (
          <MenuItem
            onClick={() => {
              const id = menu.vehicle.id;
              setMenu(null);
              run(() => updateVehicle(id, { primary: true }));
            }}
          >
            Usar como principal
          </MenuItem>
        )}
        <MenuItem
          onClick={() => {
            const vehicle = menu!.vehicle;
            setMenu(null);
            setEditing({ kind: 'vehicle', vehicle });
          }}
        >
          Editar
        </MenuItem>
        <MenuItem
          sx={{ color: 'error.main' }}
          onClick={() => {
            const id = menu!.vehicle.id;
            setMenu(null);
            run(() => removeVehicle(id));
          }}
        >
          Remover
        </MenuItem>
      </Menu>

      <Button component={Link} href="/homepage" variant="outlined" color="inherit" startIcon={<Repeat size={18} />} sx={{ ...pill, height: 52, borderColor: 'divider' }}>
        Voltar ao modo passageiro
      </Button>

      {editing?.kind === 'cnh' && (
        <CnhDialog
          onClose={() => setEditing(null)}
          onSaved={(updated) => {
            setData(updated);
            setEditing(null);
          }}
        />
      )}
      {editing?.kind === 'vehicle' && (
        <VehicleDialog
          vehicle={editing.vehicle}
          onClose={() => setEditing(null)}
          onSaved={(updated) => {
            setData(updated);
            setEditing(null);
          }}
        />
      )}
    </Stack>
  );
}

/** Diálogo em tela cheia no celular, com o formulário e os botões salvar/cancelar */
function FormDialog({ title, saving, error, onClose, onSave, children }: { title: string; saving: boolean; error: string | null; onClose: () => void; onSave: () => void; children: React.ReactNode }) {
  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm" aria-labelledby="form-dialog-title" slotProps={{ paper: { sx: { borderRadius: 4, m: 1.5, width: 'calc(100% - 24px)' } } }}>
      <Stack spacing={2.5} sx={{ p: { xs: 2, sm: 3 } }}>
        <Typography id="form-dialog-title" variant="h6" sx={{ fontWeight: 700 }}>
          {title}
        </Typography>
        {children}
        {error && <Alert severity="error">{error}</Alert>}
        <Stack direction="row" spacing={1.5}>
          <Button fullWidth color="inherit" onClick={onClose} sx={{ ...pill, height: 48 }}>
            Cancelar
          </Button>
          <Button fullWidth variant="contained" onClick={onSave} disabled={saving} startIcon={saving ? <CircularProgress size={18} color="inherit" /> : undefined} sx={{ ...pill, height: 48 }}>
            Salvar
          </Button>
        </Stack>
      </Stack>
    </Dialog>
  );
}

function CnhDialog({ onClose, onSaved }: { onClose: () => void; onSaved: (account: DriverAccount) => void }) {
  const [cnh, setCnh] = useState<CnhVerificationDraft>(EMPTY_CNH_VERIFICATION);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const found: Record<string, string | undefined> = validateCnhVerification(cnh);
    setErrors(found);
    if (Object.values(found).some(Boolean)) return;
    setSaving(true);
    setError(null);
    try {
      onSaved(await saveCnh({ image: cnh.photo!, securityCode: cnh.securityCode }));
    } catch (err) {
      if (err instanceof ApiError && err.fields) setErrors(err.fields);
      setError(err instanceof Error ? err.message : 'Não foi possível enviar.');
      setSaving(false);
    }
  };

  return (
    <FormDialog title="Reenviar CNH" saving={saving} error={error} onClose={onClose} onSave={save}>
      <CnhVerificationForm
        value={cnh}
        onChange={(changes) => {
          setCnh((c) => ({ ...c, ...changes }));
          setErrors((e) => clearFieldErrors(e, changes));
        }}
        errors={errors}
      />
    </FormDialog>
  );
}

function VehicleDialog({ vehicle, onClose, onSaved }: { vehicle?: Vehicle; onClose: () => void; onSaved: (account: DriverAccount) => void }) {
  const [draft, setDraft] = useState<VehicleDraft>(vehicle ? vehicleToDraft(vehicle) : EMPTY_VEHICLE);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const data = draftToVehicle(draft);
    const found = validateVehicle(data);
    setErrors(found);
    if (Object.values(found).some(Boolean)) return;
    setSaving(true);
    setError(null);
    try {
      onSaved(vehicle ? await updateVehicle(vehicle.id, data) : await addVehicle(data));
    } catch (err) {
      if (err instanceof ApiError && err.fields) setErrors(err.fields);
      setError(err instanceof Error ? err.message : 'Não foi possível salvar.');
      setSaving(false);
    }
  };

  return (
    <FormDialog title={vehicle ? 'Editar veículo' : 'Adicionar veículo'} saving={saving} error={error} onClose={onClose} onSave={save}>
      <VehicleForm
        value={draft}
        onChange={(changes) => {
          setDraft((d) => ({ ...d, ...changes }));
          setErrors((e) => clearFieldErrors(e, changes));
        }}
        errors={errors}
      />
    </FormDialog>
  );
}


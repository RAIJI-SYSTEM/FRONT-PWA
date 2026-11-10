'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, CircleCheck, ShieldCheck } from 'lucide-react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import Stepper from '@mui/material/Stepper';
import Typography from '@mui/material/Typography';
import ActionBar from '@/components/ActionBar';
import StatusScreen from '@/components/StatusScreen';
import { usePolling } from '@/hooks/usePolling';
import { addVehicle, getDriverAccount, saveCnh } from '@/services/driverMode';
import type { DriverAccount } from '@/types/driverMode';
import { clearFieldErrors, validateCnh, validateVehicle } from '@/utils/driverValidation';
import CnhForm, { EMPTY_CNH, type CnhDraft } from './CnhForm';
import VehicleForm, { draftToVehicle, EMPTY_VEHICLE, type VehicleDraft } from './VehicleForm';

type Step = 'cnh' | 'vehicle' | 'done';
const STEPS: { key: Exclude<Step, 'done'>; label: string; title: string }[] = [
  { key: 'cnh', label: 'CNH', title: 'Sua carteira de motorista' },
  { key: 'vehicle', label: 'Veículo', title: 'Seu veículo' },
];

const loadOnce = () => false;
const pillButton = { height: 52, borderRadius: 999, fontSize: '1rem', fontWeight: 600, textTransform: 'none' } as const;

/** Continua de onde parou: sem CNH → CNH; sem veículo → veículo; tudo pronto → concluído */
const firstStep = (account: DriverAccount): Step => (!account.cnh ? 'cnh' : account.vehicles.length === 0 ? 'vehicle' : 'done');

/** Cadastro para virar motorista: CNH (com EAR e fotos) e o primeiro veículo */
export default function DriverOnboardingScreen() {
  const router = useRouter();
  const { data: account, error: loadError } = usePolling('driver-account', getDriverAccount, loadOnce);
  const [step, setStep] = useState<Step | null>(null);
  const [cnh, setCnh] = useState<CnhDraft>(EMPTY_CNH);
  const [vehicle, setVehicle] = useState<VehicleDraft>(EMPTY_VEHICLE);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  if (loadError) return <Alert severity="error">{loadError}</Alert>;
  if (!account) {
    return (
      <Stack sx={{ alignItems: 'center', py: 8 }}>
        <CircularProgress />
      </Stack>
    );
  }

  const current = step ?? firstStep(account);

  const save = async () => {
    setApiError(null);
    if (current === 'cnh') {
      const found: Record<string, string | undefined> = {
        ...validateCnh({ ...cnh, category: cnh.category ?? undefined }),
        frontPhoto: cnh.frontPhoto ? undefined : 'Envie a foto da frente.',
        backPhoto: cnh.backPhoto ? undefined : 'Envie a foto do verso.',
      };
      setErrors(found);
      if (Object.values(found).some(Boolean)) return;
    } else {
      const found = validateVehicle(draftToVehicle(vehicle));
      setErrors(found);
      if (Object.values(found).some(Boolean)) return;
    }

    setSaving(true);
    try {
      if (current === 'cnh') {
        await saveCnh({
          number: cnh.number,
          category: cnh.category ?? undefined,
          expiresAt: cnh.expiresAt,
          ear: cnh.ear,
          frontPhotoId: cnh.frontPhoto?.id,
          backPhotoId: cnh.backPhoto?.id,
        });
        setStep('vehicle');
      } else {
        await addVehicle(draftToVehicle(vehicle));
        setStep('done');
      }
      setErrors({});
      window.scrollTo({ top: 0 });
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Não foi possível salvar.');
    } finally {
      setSaving(false);
    }
  };

  if (current === 'done') {
    return (
      <StatusScreen
        icon={CircleCheck}
        tone="success"
        title="Cadastro de motorista concluído!"
        description="Seus documentos foram enviados. Agora você pode publicar rotas e aceitar corridas e encomendas da sua região."
        actions={
          <>
            <Button variant="contained" onClick={() => router.push('/motorista')} endIcon={<ArrowRight size={20} />} sx={pillButton}>
              Começar a dirigir
            </Button>
            <Button component={Link} href="/homepage" color="inherit" sx={pillButton}>
              Voltar ao modo passageiro
            </Button>
          </>
        }
      />
    );
  }

  const index = STEPS.findIndex((s) => s.key === current);

  return (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <Stepper activeStep={index} alternativeLabel sx={{ mb: 3 }}>
        {STEPS.map((s) => (
          <Step key={s.key}>
            <StepLabel>{s.label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <Typography component="h2" variant="h5" sx={{ fontWeight: 700 }}>
        {STEPS[index].title}
      </Typography>
      <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', color: 'text.secondary', mb: 2.5 }}>
        <ShieldCheck size={16} />
        <Typography variant="body2">Seus dados são usados só para verificar o cadastro.</Typography>
      </Stack>

      {current === 'cnh' ? (
        <CnhForm
          value={cnh}
          onChange={(changes) => {
            setCnh((c) => ({ ...c, ...changes }));
            setErrors((e) => clearFieldErrors(e, changes));
          }}
          errors={errors}
        />
      ) : (
        <VehicleForm
          value={vehicle}
          onChange={(changes) => {
            setVehicle((v) => ({ ...v, ...changes }));
            setErrors((e) => clearFieldErrors(e, changes));
          }}
          errors={errors}
        />
      )}

      {apiError && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {apiError}
        </Alert>
      )}

      <ActionBar>
        <Button
          fullWidth
          variant="contained"
          onClick={save}
          disabled={saving}
          startIcon={saving ? <CircularProgress size={20} color="inherit" /> : undefined}
          endIcon={saving ? undefined : <ArrowRight size={20} />}
          sx={{ ...pillButton, boxShadow: 3 }}
        >
          {current === 'cnh' ? 'Continuar' : 'Concluir cadastro'}
        </Button>
      </ActionBar>
    </Box>
  );
}

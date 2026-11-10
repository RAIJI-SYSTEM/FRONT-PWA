'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, ChevronDown, Search } from 'lucide-react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Fade from '@mui/material/Fade';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Step from '@mui/material/Step';
import StepButton from '@mui/material/StepButton';
import Stepper from '@mui/material/Stepper';
import Typography from '@mui/material/Typography';
import ActionBar from '@/components/ActionBar';
import RouteSummary from '@/features/activities/components/RouteSummary';
import { useHasMoreBelow } from '@/hooks/useHasMoreBelow';
import { getDelivery, submitDeliveryDetails } from '@/services/deliveries';
import type { Delivery } from '@/types/delivery';
import type { Departure } from '@/types/ride';
import { routes } from '@/utils/routes';
import { EMPTY_FORM, parseMoney, STEPS, validateStep, type DetailsErrors, type DetailsForm, type StepKey } from './details/form';
import PackageStep from './details/PackageStep';
import RecipientStep from './details/RecipientStep';
import ReviewStep from './details/ReviewStep';
import ScheduleStep from './details/ScheduleStep';

const pillButton = { height: 52, borderRadius: 999, fontSize: '1rem', fontWeight: 600, textTransform: 'none' } as const;

/**
 * "Informar dados do produto" do BPMN, em etapas: pacote → destinatário → quando → revisão.
 * Cada etapa valida só os próprios campos antes de avançar.
 */
export default function DeliveryDetailsScreen({ deliveryId }: { deliveryId: string }) {
  const router = useRouter();
  const [delivery, setDelivery] = useState<Delivery | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [form, setForm] = useState<DetailsForm>(EMPTY_FORM);
  const [errors, setErrors] = useState<DetailsErrors>({});
  const [activeStep, setActiveStep] = useState(0);
  /** Maior etapa já alcançada: as anteriores ficam clicáveis no indicador */
  const [furthestStep, setFurthestStep] = useState(0);
  const [apiError, setApiError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  // Telas pequenas: avisa quando a etapa continua abaixo da barra de botões
  const hasMoreBelow = useHasMoreBelow();
  const isFirstRender = useRef(true);

  const step = STEPS[activeStep];
  const isReview = step.key === 'review';

  useEffect(() => {
    getDelivery(deliveryId)
      .then((data) => {
        // Dados já enviados: segue para o acompanhamento
        if (data.status !== 'awaiting_details') router.replace(routes.delivery(deliveryId));
        else setDelivery(data);
      })
      .catch((err) => setLoadError(err instanceof Error ? err.message : 'Entrega não encontrada.'));
  }, [deliveryId, router]);

  // Ao trocar de etapa: volta ao topo e leva o foco ao título (leitores de tela anunciam a nova etapa)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
    headingRef.current?.focus({ preventScroll: true });
  }, [activeStep]);

  const update = (changes: Partial<DetailsForm>) => {
    setForm((prev) => ({ ...prev, ...changes }));
    // Some com o erro do campo assim que o usuário mexe nele
    setErrors((prev) => {
      const next = { ...prev };
      for (const key of Object.keys(changes) as (keyof DetailsForm)[]) delete next[key];
      return next;
    });
  };

  const goTo = (index: number) => {
    setErrors({});
    setApiError(null);
    setActiveStep(index);
    setFurthestStep((prev) => Math.max(prev, index));
  };

  const editStep = (key: StepKey) => goTo(STEPS.findIndex((s) => s.key === key));

  /** Avançar sempre valida a etapa atual (as anteriores já foram validadas e só a atual pode ter mudado) */
  const tryGoTo = (index: number) => {
    if (index > activeStep) {
      const stepErrors = validateStep(step.key, form);
      setErrors(stepErrors);
      if (Object.keys(stepErrors).length > 0) return;
    }
    goTo(index);
  };

  const handleNext = () => tryGoTo(activeStep + 1);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // Enter num campo avança a etapa em vez de enviar o formulário inteiro
    if (!isReview) return handleNext();
    if (!form.size) return editStep('package');

    const departure: Departure =
      form.mode === 'now' ? { type: 'now' } : { type: 'scheduled', at: new Date(form.scheduledAt).toISOString() };

    setApiError(null);
    setSubmitting(true);
    try {
      await submitDeliveryDetails(deliveryId, {
        details: {
          size: form.size,
          description: form.description.trim(),
          fragile: form.fragile,
          declaredValueCents: parseMoney(form.declaredValue),
          recipientName: form.recipientName.trim(),
          recipientPhone: form.recipientPhone,
          notes: form.notes.trim() || undefined,
        },
        departure,
      });
      router.push(routes.delivery(deliveryId));
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Não foi possível enviar os dados.');
      setSubmitting(false);
    }
  };

  if (loadError) return <Alert severity="error" sx={{ mt: 2 }}>{loadError}</Alert>;
  if (!delivery) {
    return (
      <Stack sx={{ alignItems: 'center', py: 8 }}>
        <CircularProgress />
      </Stack>
    );
  }

  return (
    // flex: 1 ocupa o resto da tela; a barra de ações (mt: auto) fica sempre no fim
    <Box component="form" noValidate onSubmit={handleSubmit} sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <Stepper nonLinear activeStep={activeStep} alternativeLabel sx={{ mb: 3, mx: -1 }}>
        {STEPS.map((s, index) => (
          <Step key={s.key} completed={index < furthestStep && index !== activeStep}>
            <StepButton
              type="button"
              onClick={() => tryGoTo(index)}
              disabled={index > furthestStep}
              sx={{ '& .MuiStepLabel-label': { mt: '6px !important', fontSize: '0.8125rem' } }}
            >
              {s.label}
            </StepButton>
          </Step>
        ))}
      </Stepper>

      <Typography
        ref={headingRef}
        tabIndex={-1}
        component="h2"
        variant="h5"
        sx={{ fontWeight: 700, mb: 0.5, outline: 'none' }}
      >
        {step.title}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
        Etapa {activeStep + 1} de {STEPS.length}
      </Typography>

      {step.key === 'package' && <PackageStep form={form} errors={errors} update={update} />}
      {step.key === 'recipient' && <RecipientStep form={form} errors={errors} update={update} />}
      {step.key === 'schedule' && <ScheduleStep form={form} errors={errors} update={update} />}
      {isReview && (
        <Stack spacing={2}>
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
            <RouteSummary origin={delivery.origin.name} destination={delivery.destination.name} />
          </Paper>
          <ReviewStep form={form} onEdit={editStep} />
          <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
            Não transportamos itens proibidos por lei, perecíveis sem embalagem ou animais.
          </Typography>
        </Stack>
      )}

      {apiError && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {apiError}
        </Alert>
      )}

      {/* Ações fixas no rodapé, ao alcance do polegar; acima delas, o aviso de "tem mais abaixo"
          (degradê sobre o conteúdo + atalho para descer) */}
      <ActionBar
        above={
          <Fade in={hasMoreBelow}>
            <Box
              sx={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: '100%',
                height: 64,
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'center',
                pb: 1,
                pointerEvents: 'none',
                background: 'linear-gradient(to bottom, transparent, var(--mui-palette-background-default))',
              }}
            >
              <Button
                size="small"
                variant="outlined"
                color="inherit"
                tabIndex={hasMoreBelow ? 0 : -1}
                onClick={() => window.scrollBy({ top: window.innerHeight * 0.6, behavior: 'smooth' })}
                endIcon={<ChevronDown size={16} />}
                sx={{
                  pointerEvents: hasMoreBelow ? 'auto' : 'none',
                  borderRadius: 999,
                  textTransform: 'none',
                  fontWeight: 600,
                  bgcolor: 'background.paper',
                  borderColor: 'divider',
                  boxShadow: 2,
                  '@keyframes nudge': { '0%, 100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(3px)' } },
                  '& .MuiButton-endIcon': { animation: 'nudge 1.6s ease-in-out infinite' },
                  '@media (prefers-reduced-motion: reduce)': { '& .MuiButton-endIcon': { animation: 'none' } },
                }}
              >
                Mais abaixo
              </Button>
            </Box>
          </Fade>
        }
      >
        <Stack direction="row" spacing={1.5}>
          {activeStep > 0 && (
            <Button
              type="button"
              variant="outlined"
              color="inherit"
              onClick={() => goTo(activeStep - 1)}
              startIcon={<ArrowLeft size={18} />}
              sx={{ ...pillButton, px: 3, borderColor: 'divider' }}
            >
              Voltar
            </Button>
          )}
          {isReview ? (
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={submitting}
              startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : <Search size={20} />}
              sx={{ ...pillButton, boxShadow: 3 }}
            >
              {form.mode === 'now' ? 'Procurar motorista' : 'Publicar no mural'}
            </Button>
          ) : (
            <Button
              type="submit"
              fullWidth
              variant="contained"
              endIcon={<ArrowRight size={20} />}
              sx={{ ...pillButton, boxShadow: 3 }}
            >
              Continuar
            </Button>
          )}
        </Stack>
      </ActionBar>
    </Box>
  );
}

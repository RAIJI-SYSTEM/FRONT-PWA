'use client';

import { useEffect, useMemo, useRef } from 'react';
import { Camera, KeyRound, RefreshCw } from 'lucide-react';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import FormHelperText from '@mui/material/FormHelperText';
import InputAdornment from '@mui/material/InputAdornment';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { ACCEPT_IMAGES } from '@/utils/attachments';

export interface CnhVerificationDraft {
  photo?: File;
  securityCode: string;
}

export const EMPTY_CNH_VERIFICATION: CnhVerificationDraft = { securityCode: '' };

/** Limite do backend para a foto da CNH */
const MAX_PHOTO_BYTES = 8 * 1024 * 1024;

export function validateCnhVerification(d: CnhVerificationDraft) {
  const errors: Partial<Record<keyof CnhVerificationDraft, string>> = {};
  if (!d.photo) errors.photo = 'Envie a foto da CNH.';
  else if (d.photo.size > MAX_PHOTO_BYTES) errors.photo = 'Foto maior que 8 MB.';
  if (!/^\d{11}$/.test(d.securityCode)) errors.securityCode = 'O código de segurança tem 11 números.';
  return errors;
}

interface Props {
  value: CnhVerificationDraft;
  onChange: (changes: Partial<CnhVerificationDraft>) => void;
  errors: Partial<Record<keyof CnhVerificationDraft, string | undefined>>;
}

/**
 * CNH para a verificação automática: uma foto nítida da CNH (a leitura dos dados é
 * automática) e o código de segurança (11 números no verso, ou no QR da CNH digital).
 */
export default function CnhVerificationForm({ value, onChange, errors }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const preview = useMemo(() => (value.photo ? URL.createObjectURL(value.photo) : null), [value.photo]);
  // Libera a prévia anterior quando a foto muda
  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  return (
    <Stack spacing={2.5}>
      <Box>
        <Typography variant="body2" sx={{ fontWeight: 700, mb: 1 }}>
          Foto da CNH (aberta, com a foto e os dados)
        </Typography>
        <ButtonBase
          onClick={() => input.current?.click()}
          aria-label={value.photo ? 'Foto enviada. Toque para trocar' : 'Escolher foto da CNH'}
          sx={{
            width: '100%',
            aspectRatio: '1.58',
            borderRadius: 2,
            overflow: 'hidden',
            border: '2px dashed',
            borderColor: errors.photo ? 'error.main' : value.photo ? 'primary.main' : 'divider',
            bgcolor: 'background.paper',
            flexDirection: 'column',
            gap: 0.5,
          }}
        >
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element -- prévia local da foto escolhida
            <img src={preview} alt="Prévia da CNH" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <>
              <Camera size={28} />
              <Typography variant="body2">Tirar ou escolher foto</Typography>
            </>
          )}
        </ButtonBase>
        {value.photo && (
          <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', mt: 0.5, color: 'text.secondary' }}>
            <RefreshCw size={12} />
            <Typography variant="caption">Toque na foto para trocar</Typography>
          </Stack>
        )}
        <input
          ref={input}
          type="file"
          accept={ACCEPT_IMAGES}
          capture="environment"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onChange({ photo: file });
            e.target.value = '';
          }}
        />
        <FormHelperText error={Boolean(errors.photo)}>
          {errors.photo ?? 'Sem reflexo e com tudo legível. A foto é apagada depois da verificação.'}
        </FormHelperText>
      </Box>

      <TextField
        label="Código de segurança da CNH"
        value={value.securityCode}
        onChange={(e) => onChange({ securityCode: e.target.value.replace(/\D/g, '').slice(0, 11) })}
        error={Boolean(errors.securityCode)}
        helperText={errors.securityCode ?? '11 números no verso da CNH (ou no QR Code da CNH digital).'}
        autoComplete="off"
        slotProps={{
          htmlInput: { inputMode: 'numeric' },
          input: { startAdornment: <InputAdornment position="start"><KeyRound size={18} /></InputAdornment> },
        }}
      />
    </Stack>
  );
}

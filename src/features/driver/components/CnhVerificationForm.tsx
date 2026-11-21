"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Camera, ImageIcon, KeyRound } from "lucide-react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import FormHelperText from "@mui/material/FormHelperText";
import InputAdornment from "@mui/material/InputAdornment";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { ACCEPT_IMAGES } from "@/utils/attachments";
import { shrinkImage } from "@/utils/shrinkImage";
import CnhSecurityCodeHelp from "./CnhSecurityCodeHelp";

export interface CnhVerificationDraft {
  photo?: File;
  securityCode: string;
}

export const EMPTY_CNH_VERIFICATION: CnhVerificationDraft = {
  securityCode: "",
};

/** Limite do backend para a foto da CNH */
const MAX_PHOTO_BYTES = 8 * 1024 * 1024;

export function validateCnhVerification(
  d: CnhVerificationDraft,
  askSecurityCode = true,
) {
  const errors: Partial<Record<keyof CnhVerificationDraft, string>> = {};
  if (!d.photo) errors.photo = "Envie a foto da CNH.";
  else if (d.photo.size > MAX_PHOTO_BYTES)
    errors.photo = "Foto maior que 8 MB.";
  if (askSecurityCode && !/^\d{11}$/.test(d.securityCode))
    errors.securityCode = "O código de segurança tem 11 números.";
  return errors;
}

interface Props {
  value: CnhVerificationDraft;
  onChange: (changes: Partial<CnhVerificationDraft>) => void;
  errors: Partial<Record<keyof CnhVerificationDraft, string | undefined>>;
  /** Pede o código de segurança (só quando o backend confere no SENATRAN) */
  askSecurityCode?: boolean;
}

/**
 * CNH para a verificação automática: uma foto nítida da CNH (a leitura dos dados é
 * automática) e, quando o backend confere no SENATRAN, o código de segurança (11 números no verso).
 */
export default function CnhVerificationForm({
  value,
  onChange,
  errors,
  askSecurityCode = true,
}: Props) {
  // Dois inputs: no Android a câmera só abre com accept="image/*" + capture; a galeria usa os tipos aceitos
  const cameraInput = useRef<HTMLInputElement>(null);
  const galleryInput = useRef<HTMLInputElement>(null);
  const [preparing, setPreparing] = useState(false);
  const preview = useMemo(
    () => (value.photo ? URL.createObjectURL(value.photo) : null),
    [value.photo],
  );
  // Libera a prévia anterior quando a foto muda
  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview],
  );

  const choose = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setPreparing(true);
    try {
      onChange({ photo: await shrinkImage(file) });
    } finally {
      setPreparing(false);
    }
  };

  return (
    <Stack spacing={2.5}>
      <Box>
        <Typography variant="body2" sx={{ fontWeight: 700, mb: 1 }}>
          Foto da CNH (aberta, com a foto e os dados)
        </Typography>
        <Box
          sx={{
            width: "100%",
            aspectRatio: "1.58",
            borderRadius: 2,
            overflow: "hidden",
            border: "2px dashed",
            borderColor: errors.photo
              ? "error.main"
              : value.photo
                ? "primary.main"
                : "divider",
            bgcolor: "background.paper",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 0.5,
            color: "text.secondary",
          }}
        >
          {preparing ? (
            <CircularProgress size={28} aria-label="Preparando a foto" />
          ) : preview ? (
            // eslint-disable-next-line @next/next/no-img-element -- prévia local da foto escolhida
            <img
              src={preview}
              alt="Prévia da CNH"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <>
              <Camera size={28} />
              <Typography variant="body2">Nenhuma foto ainda</Typography>
            </>
          )}
        </Box>
        <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
          <Button
            fullWidth
            variant="contained"
            disabled={preparing}
            startIcon={<Camera size={18} />}
            onClick={() => cameraInput.current?.click()}
            sx={{ textTransform: "none", fontWeight: 600, borderRadius: 999 }}
          >
            {value.photo ? "Tirar outra" : "Tirar foto"}
          </Button>
          <Button
            fullWidth
            variant="outlined"
            disabled={preparing}
            startIcon={<ImageIcon size={18} />}
            onClick={() => galleryInput.current?.click()}
            sx={{ textTransform: "none", fontWeight: 600, borderRadius: 999 }}
          >
            Da galeria
          </Button>
        </Stack>
        <input
          ref={cameraInput}
          type="file"
          accept="image/*"
          capture="environment"
          hidden
          onChange={choose}
        />
        <input
          ref={galleryInput}
          type="file"
          accept={ACCEPT_IMAGES}
          hidden
          onChange={choose}
        />
        <FormHelperText error={Boolean(errors.photo)}>
          {errors.photo ??
            "Sem reflexo e com tudo legível. A foto é apagada depois da verificação."}
        </FormHelperText>
      </Box>

      {askSecurityCode && (
        <Box>
          <TextField
            fullWidth
            label="Código de segurança da CNH"
            value={value.securityCode}
            onChange={(e) =>
              onChange({
                securityCode: e.target.value.replace(/\D/g, "").slice(0, 11),
              })
            }
            error={Boolean(errors.securityCode)}
            helperText={
              errors.securityCode ??
              "11 números no verso da CNH, no canto inferior direito."
            }
            autoComplete="off"
            slotProps={{
              htmlInput: { inputMode: "numeric" },
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <KeyRound size={18} />
                  </InputAdornment>
                ),
              },
            }}
          />
          <CnhSecurityCodeHelp />
        </Box>
      )}
    </Stack>
  );
}

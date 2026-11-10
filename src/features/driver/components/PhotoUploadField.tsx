'use client';

import { useRef, useState } from 'react';
import { Camera, RefreshCw } from 'lucide-react';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import CircularProgress from '@mui/material/CircularProgress';
import FormHelperText from '@mui/material/FormHelperText';
import Typography from '@mui/material/Typography';
import { uploadFile } from '@/services/uploads';
import type { Attachment } from '@/types/message';
import { ACCEPT_IMAGES, MAX_ATTACHMENT_BYTES } from '@/utils/attachments';
import { apiUrl } from '@/services/api';

interface PhotoUploadFieldProps {
  label: string;
  value?: Attachment;
  onChange: (photo: Attachment) => void;
  error?: string;
}

/** Foto de documento: escolhe/tira a foto, já envia e mostra a prévia (toque de novo para trocar) */
export default function PhotoUploadField({ label, value, onChange, error }: PhotoUploadFieldProps) {
  const input = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const choose = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > MAX_ATTACHMENT_BYTES) return setLocalError('Foto maior que 10 MB.');
    setLocalError(null);
    setUploading(true);
    try {
      onChange(await uploadFile(file));
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Não foi possível enviar a foto.');
    } finally {
      setUploading(false);
    }
  };

  const message = localError ?? error;

  return (
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <ButtonBase
        onClick={() => input.current?.click()}
        disabled={uploading}
        aria-label={value ? `${label}: enviada. Toque para trocar` : `Enviar ${label.toLowerCase()}`}
        sx={{
          width: '100%',
          aspectRatio: '1.58', // proporção de um cartão (CNH)
          borderRadius: 2,
          overflow: 'hidden',
          border: '2px dashed',
          borderColor: message ? 'error.main' : value ? 'primary.main' : 'divider',
          bgcolor: 'background.paper',
          flexDirection: 'column',
          gap: 0.5,
          position: 'relative',
          color: 'text.secondary',
        }}
      >
        {value ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element -- foto enviada pelo usuário */}
            <img src={apiUrl(value.url)} alt={label} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
            <Box sx={{ position: 'absolute', right: 6, bottom: 6, p: 0.5, borderRadius: '50%', bgcolor: 'rgba(0 0 0 / 0.6)', color: '#fff', display: 'grid' }}>
              <RefreshCw size={14} />
            </Box>
          </>
        ) : uploading ? (
          <CircularProgress size={24} />
        ) : (
          <>
            <Camera size={24} />
            <Typography variant="caption" sx={{ fontWeight: 600 }}>
              {label}
            </Typography>
          </>
        )}
      </ButtonBase>
      <input ref={input} type="file" accept={ACCEPT_IMAGES} hidden onChange={(e) => choose(e.target.files?.[0])} />
      {message && <FormHelperText error>{message}</FormHelperText>}
    </Box>
  );
}

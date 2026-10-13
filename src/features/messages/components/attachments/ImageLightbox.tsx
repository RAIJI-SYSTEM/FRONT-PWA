'use client';

import { Download, X } from 'lucide-react';
import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import type { Attachment } from '@/types/message';

interface ImageLightboxProps {
  attachment: Attachment;
  open: boolean;
  onClose: () => void;
}

/** Foto em tela cheia com opção de baixar (carregada sob demanda pelo ImageAttachment) */
export default function ImageLightbox({ attachment, open, onClose }: ImageLightboxProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen
      aria-label={attachment.name}
      slotProps={{ paper: { sx: { bgcolor: 'rgba(0 0 0 / 0.92)' } } }}
    >
      <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end', p: 1.5 }}>
        <IconButton component="a" href={attachment.url} download={attachment.name} aria-label="Baixar imagem" sx={{ color: '#fff' }}>
          <Download size={22} />
        </IconButton>
        <IconButton onClick={onClose} aria-label="Fechar" sx={{ color: '#fff' }} autoFocus>
          <X size={24} />
        </IconButton>
      </Stack>
      <Box sx={{ flex: 1, display: 'grid', placeItems: 'center', p: 2, minHeight: 0 }} onClick={onClose}>
        {/* eslint-disable-next-line @next/next/no-img-element -- idem */}
        <img src={attachment.url} alt={attachment.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
      </Box>
    </Dialog>
  );
}

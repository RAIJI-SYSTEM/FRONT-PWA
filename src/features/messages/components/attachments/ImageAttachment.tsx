'use client';

import { useState } from 'react';
import { Download, X } from 'lucide-react';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Dialog from '@mui/material/Dialog';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import type { Attachment } from '@/types/message';

/** Miniatura da foto; ao tocar, abre em tela cheia com opção de baixar */
export default function ImageAttachment({ attachment }: { attachment: Attachment }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <ButtonBase
        onClick={() => setOpen(true)}
        aria-label={`Ampliar imagem ${attachment.name}`}
        sx={{ display: 'block', width: '100%', borderRadius: 2, overflow: 'hidden', bgcolor: 'action.hover' }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- arquivo enviado pelo usuário, sem otimização do next/image */}
        <img
          src={attachment.url}
          alt={attachment.name}
          loading="lazy"
          style={{ display: 'block', width: '100%', maxHeight: 280, objectFit: 'cover' }}
        />
      </ButtonBase>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        fullScreen
        aria-label={attachment.name}
        slotProps={{ paper: { sx: { bgcolor: 'rgba(0 0 0 / 0.92)' } } }}
      >
        <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end', p: 1.5 }}>
          <IconButton component="a" href={attachment.url} download={attachment.name} aria-label="Baixar imagem" sx={{ color: '#fff' }}>
            <Download size={22} />
          </IconButton>
          <IconButton onClick={() => setOpen(false)} aria-label="Fechar" sx={{ color: '#fff' }} autoFocus>
            <X size={24} />
          </IconButton>
        </Stack>
        <Box sx={{ flex: 1, display: 'grid', placeItems: 'center', p: 2, minHeight: 0 }} onClick={() => setOpen(false)}>
          {/* eslint-disable-next-line @next/next/no-img-element -- idem */}
          <img src={attachment.url} alt={attachment.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
        </Box>
      </Dialog>
    </>
  );
}

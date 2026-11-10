'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import ButtonBase from '@mui/material/ButtonBase';
import type { Attachment } from '@/types/message';
import { apiUrl } from '@/services/api';

const loadLightbox = () => import('./ImageLightbox');
const ImageLightbox = dynamic(loadLightbox);

/** Miniatura da foto; ao tocar, abre em tela cheia com opção de baixar */
export default function ImageAttachment({ attachment }: { attachment: Attachment }) {
  const [open, setOpen] = useState(false);
  const [everOpened, setEverOpened] = useState(false);

  return (
    <>
      <ButtonBase
        // Começa a baixar o visualizador quando o dedo encosta, antes de soltar: abre sem atraso
        onPointerDown={() => void loadLightbox()}
        onClick={() => {
          setEverOpened(true);
          setOpen(true);
        }}
        aria-label={`Ampliar imagem ${attachment.name}`}
        sx={{ display: 'block', width: '100%', borderRadius: 2, overflow: 'hidden', bgcolor: 'action.hover' }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- arquivo enviado pelo usuário, sem otimização do next/image */}
        <img
          src={apiUrl(attachment.url)}
          alt={attachment.name}
          loading="lazy"
          style={{ display: 'block', width: '100%', maxHeight: 280, objectFit: 'cover' }}
        />
      </ButtonBase>

      {/* Montado só depois do primeiro toque; continua montado para a animação de fechar */}
      {everOpened && <ImageLightbox attachment={attachment} open={open} onClose={() => setOpen(false)} />}
    </>
  );
}

'use client';

import { useState } from 'react';
import { ChevronDown, CircleHelp } from 'lucide-react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Collapse from '@mui/material/Collapse';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

/** Desenho esquemático do verso da CNH com o lugar do código de segurança destacado */
function CnhBackSketch() {
  const label = { fontSize: 9, fontWeight: 600, fill: 'currentColor', opacity: 0.6 } as const;
  const line = { stroke: 'currentColor', strokeOpacity: 0.25, strokeWidth: 1.5 } as const;
  return (
    <Box
      component="svg"
      viewBox="0 0 316 200"
      role="img"
      aria-label="Verso da CNH: o código de segurança fica no canto inferior direito, abaixo do local e da data de emissão"
      sx={{ width: '100%', maxWidth: 360, display: 'block', mx: 'auto', color: 'text.primary' }}
    >
      <rect x="1" y="1" width="314" height="198" rx="12" fill="none" stroke="currentColor" strokeOpacity="0.35" strokeWidth="2" />
      <text x="14" y="22" style={label}>VERSO DA CNH</text>
      {/* Observações */}
      <rect x="14" y="32" width="288" height="64" rx="6" fill="none" {...line} />
      <text x="22" y="48" style={label}>OBSERVAÇÕES</text>
      {/* Assinatura do emissor (esquerda) */}
      <path d="M24 150 q14 -18 28 0 t28 0 t28 0" fill="none" stroke="currentColor" strokeOpacity="0.4" strokeWidth="1.5" />
      <line x1="14" y1="160" x2="150" y2="160" {...line} />
      <text x="14" y="174" style={label}>ASSINATURA DO EMISSOR</text>
      {/* Local e data (direita) */}
      <text x="174" y="116" style={label}>LOCAL</text>
      <line x1="174" y1="124" x2="302" y2="124" {...line} />
      <text x="174" y="140" style={label}>DATA EMISSÃO</text>
      {/* Código de segurança destacado */}
      <Box component="rect" x="168" y="150" width="140" height="34" rx="6" sx={{ fill: 'currentColor', color: 'primary.main', fillOpacity: 0.15 }} />
      <Box component="rect" x="168" y="150" width="140" height="34" rx="6" fill="none" strokeWidth="2" sx={{ stroke: 'currentColor', color: 'primary.main' }} />
      <Box component="text" x="238" y="172" textAnchor="middle" sx={{ fontSize: 14, fontWeight: 700, letterSpacing: 1.5, fill: 'currentColor', color: 'primary.main', fontFamily: 'monospace' }}>
        12345678901
      </Box>
    </Box>
  );
}

/** "Onde encontro o código?": desenho do verso e o caminho na CNH digital */
export default function CnhSecurityCodeHelp() {
  const [open, setOpen] = useState(false);
  return (
    <Box>
      <Button
        size="small"
        onClick={() => setOpen((v) => !v)}
        startIcon={<CircleHelp size={16} />}
        endIcon={<ChevronDown size={16} style={{ transform: open ? 'rotate(180deg)' : undefined, transition: 'transform .2s' }} />}
        aria-expanded={open}
        sx={{ textTransform: 'none', fontWeight: 600, px: 1 }}
      >
        Onde encontro o código?
      </Button>
      <Collapse in={open}>
        <Stack spacing={1.5} sx={{ mt: 1, p: 2, borderRadius: 2, border: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
          <CnhBackSketch />
          <Typography variant="body2">
            <b>CNH de papel:</b> vire a carteira. O código tem <b>11 números</b> e fica no <b>canto inferior direito</b>,
            embaixo do local e da data de emissão, ao lado da assinatura do emissor.
          </Typography>
          <Typography variant="body2">
            <b>CNH digital:</b> no app <b>Carteira Digital de Trânsito</b>, abra a sua CNH e veja o verso do documento.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Não confunda com o número de registro (fica na frente) nem com o CPF. O código muda a cada renovação, então
            use o da CNH atual.
          </Typography>
        </Stack>
      </Collapse>
    </Box>
  );
}

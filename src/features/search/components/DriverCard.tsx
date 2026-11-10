'use client';

import { useState } from 'react';
import { BadgeCheck, Check, Copy, MapPin, Star } from 'lucide-react';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { participantColor } from '@/features/messages/participantColor';
import { formatDriverCode, type DriverProfile } from '@/types/drivers';
import PersonTypeChip from './PersonTypeChip';

const SERVICE_LABEL = { rides: 'Corridas', deliveries: 'Encomendas' } as const;

/** Perfil resumido do motorista: avaliação, tipo de pessoa, veículo, serviços, cidades e código */
export default function DriverCard({ driver }: { driver: DriverProfile }) {
  const [copied, setCopied] = useState(false);
  const cities = [driver.city, ...driver.servesCities];

  const copyCode = async () => {
    await navigator.clipboard.writeText(driver.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Paper variant="outlined" component="article" sx={{ p: 2, borderRadius: 3 }}>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
        <Avatar sx={{ width: 52, height: 52, bgcolor: participantColor(driver.id), color: '#fff', fontWeight: 700, fontSize: '1.25rem' }}>
          {driver.name.charAt(0)}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
            <Typography sx={{ fontWeight: 700 }} noWrap>
              {driver.name}
            </Typography>
            {driver.verified && (
              <Tooltip title="Documentos verificados">
                <Box component="span" sx={{ display: 'inline-flex', color: 'primary.main', flexShrink: 0 }} aria-label="Verificado">
                  <BadgeCheck size={18} />
                </Box>
              </Tooltip>
            )}
          </Stack>
          <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
            <Star size={14} fill="var(--mui-palette-primary-main)" color="var(--mui-palette-primary-main)" />
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              {driver.rating.toFixed(1).replace('.', ',')}
            </Typography>
            <Typography variant="body2" color="text.secondary" noWrap>
              · {driver.tripsCount.toLocaleString('pt-BR')} viagens
            </Typography>
          </Stack>
          <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
            {driver.vehicle}
          </Typography>
        </Box>
      </Stack>

      <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1, mt: 1.5 }}>
        <PersonTypeChip driver={driver} />
        {driver.services.map((service) => (
          <Chip key={service} size="small" label={SERVICE_LABEL[service]} sx={{ fontWeight: 600 }} />
        ))}
      </Stack>

      <Stack direction="row" spacing={0.75} sx={{ alignItems: 'flex-start', mt: 1.5, color: 'text.secondary' }}>
        <MapPin size={15} style={{ flexShrink: 0, marginTop: 2 }} />
        <Typography variant="body2">Atende: {cities.join(', ')}</Typography>
      </Stack>

      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', mt: 1 }}>
        <Typography variant="body2" color="text.secondary">
          Código{' '}
          <Box component="span" sx={{ fontFamily: 'monospace', fontWeight: 800, color: 'text.primary', letterSpacing: 1 }}>
            {formatDriverCode(driver.code)}
          </Box>
        </Typography>
        <IconButton size="small" onClick={copyCode} aria-label={copied ? 'Código copiado' : `Copiar código ${formatDriverCode(driver.code)}`}>
          {copied ? <Check size={16} /> : <Copy size={16} />}
        </IconButton>
      </Stack>
    </Paper>
  );
}

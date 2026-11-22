'use client';

import { useState } from 'react';
import { BadgeCheck, Hash, UserX } from 'lucide-react';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import InputAdornment from '@mui/material/InputAdornment';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import MessageButton from '@/features/messages/components/MessageButton';
import { participantColor } from '@/features/messages/participantColor';
import { useQuery } from '@/hooks/useQuery';
import { useSession } from '@/hooks/useSession';
import { findDriverByCode } from '@/services/drivers';
import { DRIVER_CODE_LENGTH, formatDriverCode } from '@/types/drivers';
import ResultState from './ResultState';
import TripCard from './TripCard';

/** Encontrar um motorista pelo código de 8 dígitos (busca sozinho ao completar), conversar e ver as viagens dele */
export default function CodeTab() {
  const session = useSession();
  const [digits, setDigits] = useState('');
  const complete = digits.length === DRIVER_CODE_LENGTH;
  const query = useQuery(complete ? `driver-code:${digits}` : null, () => findDriverByCode(digits));
  const driver = query.data;
  const name = driver?.driverName ?? 'Motorista';

  return (
    <Stack spacing={2.5}>
      <TextField
        label="Código do motorista"
        placeholder="0000-0000"
        value={formatDriverCode(digits)}
        onChange={(e) => setDigits(e.target.value.replace(/\D/g, '').slice(0, DRIVER_CODE_LENGTH))}
        helperText={
          complete
            ? ' '
            : `Peça ao motorista: o código aparece no app dele, em Mais. Faltam ${DRIVER_CODE_LENGTH - digits.length} números.`
        }
        autoComplete="off"
        slotProps={{
          htmlInput: { inputMode: 'numeric', style: { fontSize: '1.5rem', letterSpacing: 4, fontWeight: 700, fontFamily: 'monospace' } },
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <Hash size={20} />
              </InputAdornment>
            ),
          },
        }}
      />

      {complete && (
        <ResultState
          loading={query.loading}
          // "Nenhum motorista" é um resultado vazio, não um erro do sistema
          error={query.error && !query.error.startsWith('Nenhum') ? query.error : undefined}
          empty={!driver}
          emptyIcon={UserX}
          emptyTitle="Nenhum motorista com esse código"
          emptyDescription="Confira os números com o motorista e tente de novo."
        >
          {driver && (
            <Stack spacing={1.5}>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
                <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                  <Avatar sx={{ width: 48, height: 48, bgcolor: participantColor(driver.driverSub), color: '#fff', fontWeight: 700 }}>
                    {name.charAt(0)}
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 800 }} noWrap>
                      {name}
                    </Typography>
                    <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', color: 'success.main' }}>
                      <BadgeCheck size={14} />
                      <Typography variant="caption">CNH verificada · {formatDriverCode(driver.code)}</Typography>
                    </Stack>
                  </Box>
                  {session?.user.id !== driver.driverSub && (
                    <MessageButton target={{ userId: driver.driverSub, name: driver.driverName, role: 'driver', myRole: 'passenger' }} />
                  )}
                </Stack>
              </Paper>
              <Typography variant="body2" color="text.secondary">
                {driver.rides.length === 0
                  ? 'Nenhuma viagem publicada no momento. Mande uma mensagem para combinar.'
                  : `${driver.rides.length} viage${driver.rides.length === 1 ? 'm publicada' : 'ns publicadas'}`}
              </Typography>
              {driver.rides.map((ride) => (
                <TripCard key={ride.id} ride={ride} showDriver={false} />
              ))}
            </Stack>
          )}
        </ResultState>
      )}
    </Stack>
  );
}

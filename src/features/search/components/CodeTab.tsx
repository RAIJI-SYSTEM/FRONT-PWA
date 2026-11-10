'use client';

import { useState } from 'react';
import { Hash, UserX } from 'lucide-react';
import InputAdornment from '@mui/material/InputAdornment';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import { useQuery } from '@/hooks/useQuery';
import { findDriverByCode } from '@/services/drivers';
import { DRIVER_CODE_LENGTH, formatDriverCode } from '@/types/drivers';
import DriverCard from './DriverCard';
import ResultState from './ResultState';

/** Encontrar um motorista pelo código amigável de 8 dígitos (busca sozinho ao completar) */
export default function CodeTab() {
  const [digits, setDigits] = useState('');
  const complete = digits.length === DRIVER_CODE_LENGTH;
  const query = useQuery(complete ? digits : null, () => findDriverByCode(digits));

  return (
    <Stack spacing={2.5}>
      <TextField
        label="Código do motorista"
        placeholder="0000-0000"
        value={formatDriverCode(digits)}
        onChange={(e) => setDigits(e.target.value.replace(/\D/g, '').slice(0, DRIVER_CODE_LENGTH))}
        helperText={
          complete ? ' ' : `O código tem ${DRIVER_CODE_LENGTH} dígitos e fica no perfil do motorista. Faltam ${DRIVER_CODE_LENGTH - digits.length}.`
        }
        autoComplete="off"
        slotProps={{
          htmlInput: { inputMode: 'numeric', 'aria-describedby': 'code-hint', style: { fontSize: '1.5rem', letterSpacing: 4, fontWeight: 700, fontFamily: 'monospace' } },
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <Hash size={20} />
              </InputAdornment>
            ),
          },
          formHelperText: { id: 'code-hint' },
        }}
      />

      {complete && (
        <ResultState
          loading={query.loading}
          // "Nenhum motorista" é um resultado vazio, não um erro do sistema
          error={query.error && !query.error.startsWith('Nenhum') ? query.error : undefined}
          empty={!query.data}
          emptyIcon={UserX}
          emptyTitle="Nenhum motorista com esse código"
          emptyDescription="Confira os números com o motorista e tente de novo."
        >
          {query.data && <DriverCard driver={query.data} />}
        </ResultState>
      )}
    </Stack>
  );
}

'use client';

import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import { CalendarClock, Zap } from 'lucide-react';

export type DepartureMode = 'now' | 'scheduled';

interface DepartureSelectorProps {
  mode: DepartureMode;
  onModeChange: (mode: DepartureMode) => void;
  /** Valor do input datetime-local (AAAA-MM-DDTHH:mm) */
  scheduledAt: string;
  onScheduledAtChange: (value: string) => void;
  error?: string;
  /** Texto de ajuda do agendamento */
  scheduledHint?: string;
  dateLabel?: string;
}

/** "Carona é para agora?" do BPMN */
export default function DepartureSelector({
  mode,
  onModeChange,
  scheduledAt,
  onScheduledAtChange,
  error,
  scheduledHint = 'Sua carona fica publicada no mural até um motorista aceitar.',
  dateLabel = 'Data e horário da carona',
}: DepartureSelectorProps) {
  return (
    <Stack spacing={2}>
      <ToggleButtonGroup
        exclusive
        fullWidth
        value={mode}
        onChange={(_, value: DepartureMode | null) => value && onModeChange(value)}
        aria-label="Quando você quer viajar?"
        sx={{
          gap: 1,
          '& .MuiToggleButton-root': {
            gap: 1,
            py: 1.25,
            borderRadius: '999px !important',
            border: '1px solid var(--mui-palette-divider) !important',
            fontWeight: 600,
            textTransform: 'none',
          },
          // Seletor mais específico que o padrão do MUI (.MuiToggleButton-root.Mui-selected)
          '& .MuiToggleButton-root.Mui-selected': {
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            borderColor: 'transparent !important',
            '&:hover': { bgcolor: 'primary.dark' },
          },
        }}
      >
        <ToggleButton value="now">
          <Zap size={18} /> Agora
        </ToggleButton>
        <ToggleButton value="scheduled">
          <CalendarClock size={18} /> Agendar
        </ToggleButton>
      </ToggleButtonGroup>

      {mode === 'scheduled' && (
        <TextField
          type="datetime-local"
          label={dateLabel}
          value={scheduledAt}
          onChange={(e) => onScheduledAtChange(e.target.value)}
          error={Boolean(error)}
          helperText={error ?? scheduledHint}
          slotProps={{ inputLabel: { shrink: true } }}
        />
      )}
    </Stack>
  );
}

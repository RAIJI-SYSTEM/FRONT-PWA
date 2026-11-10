'use client';

import { Bike, Bus, Car, Minus, Plus, type LucideIcon } from 'lucide-react';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import FormHelperText from '@mui/material/FormHelperText';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import type { Vehicle, VehicleType } from '@/types/driverMode';
import { formatPlate, normalizePlate, VEHICLE_TYPES } from '@/utils/driverValidation';

export interface VehicleDraft {
  type: VehicleType;
  model: string;
  year: string;
  color: string;
  plate: string;
  seats: number;
}

export const EMPTY_VEHICLE: VehicleDraft = { type: 'car', model: '', year: '', color: '', plate: '', seats: 4 };

export const vehicleToDraft = (v: Vehicle): VehicleDraft => ({ ...v, year: String(v.year) });
export const draftToVehicle = (d: VehicleDraft): Partial<Vehicle> => ({ ...d, year: Number(d.year), plate: normalizePlate(d.plate) });

const TYPE_ICONS: Record<VehicleType, LucideIcon> = { car: Car, van: Bus, motorcycle: Bike };

interface VehicleFormProps {
  value: VehicleDraft;
  onChange: (changes: Partial<VehicleDraft>) => void;
  errors: Partial<Record<keyof Vehicle, string>>;
}

/** Dados do veículo: tipo, modelo, ano, cor, placa e lugares para passageiros */
export default function VehicleForm({ value, onChange, errors }: VehicleFormProps) {
  const type = VEHICLE_TYPES.find((t) => t.value === value.type)!;

  return (
    <Stack spacing={2.5}>
      <Box role="radiogroup" aria-label="Tipo de veículo" sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1 }}>
        {VEHICLE_TYPES.map((t) => {
          const Icon = TYPE_ICONS[t.value];
          const selected = t.value === value.type;
          return (
            <ButtonBase
              key={t.value}
              role="radio"
              aria-checked={selected}
              // Ao trocar o tipo, ajusta os lugares ao máximo permitido
              onClick={() => onChange({ type: t.value, seats: Math.min(value.seats, t.maxSeats) })}
              sx={{
                flexDirection: 'column',
                gap: 0.5,
                py: 1.5,
                borderRadius: 3,
                border: 2,
                borderColor: selected ? 'primary.main' : 'divider',
                bgcolor: selected ? 'rgba(var(--mui-palette-primary-mainChannel) / 0.08)' : 'background.paper',
                color: selected ? 'primary.main' : 'text.primary',
              }}
            >
              <Icon size={24} />
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                {t.label}
              </Typography>
            </ButtonBase>
          );
        })}
      </Box>

      <TextField
        label="Marca e modelo"
        placeholder="Ex.: Chevrolet Onix"
        value={value.model}
        onChange={(e) => onChange({ model: e.target.value })}
        error={Boolean(errors.model)}
        helperText={errors.model}
      />
      <Stack direction="row" spacing={1.5}>
        <TextField
          label="Ano"
          value={value.year}
          onChange={(e) => onChange({ year: e.target.value.replace(/\D/g, '').slice(0, 4) })}
          error={Boolean(errors.year)}
          helperText={errors.year}
          slotProps={{ htmlInput: { inputMode: 'numeric' } }}
          sx={{ flex: 1 }}
        />
        <TextField
          label="Cor"
          value={value.color}
          onChange={(e) => onChange({ color: e.target.value })}
          error={Boolean(errors.color)}
          helperText={errors.color}
          sx={{ flex: 1 }}
        />
      </Stack>
      <TextField
        label="Placa"
        placeholder="ABC-1D23"
        value={formatPlate(value.plate)}
        onChange={(e) => onChange({ plate: normalizePlate(e.target.value) })}
        error={Boolean(errors.plate)}
        helperText={errors.plate ?? 'Padrão antigo ou Mercosul.'}
        autoComplete="off"
        slotProps={{ htmlInput: { style: { textTransform: 'uppercase', letterSpacing: 2, fontWeight: 700 } } }}
      />

      <Box>
        <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography sx={{ fontWeight: 700 }}>Lugares para passageiros</Typography>
            <Typography variant="body2" color="text.secondary">
              Sem contar o motorista (máx. {type.maxSeats})
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <IconButton
              aria-label="Menos um lugar"
              onClick={() => onChange({ seats: Math.max(1, value.seats - 1) })}
              disabled={value.seats <= 1}
              sx={{ border: 1, borderColor: 'divider' }}
            >
              <Minus size={18} />
            </IconButton>
            <Typography sx={{ fontWeight: 800, fontSize: '1.25rem', minWidth: 24, textAlign: 'center' }} aria-live="polite">
              {value.seats}
            </Typography>
            <IconButton
              aria-label="Mais um lugar"
              onClick={() => onChange({ seats: Math.min(type.maxSeats, value.seats + 1) })}
              disabled={value.seats >= type.maxSeats}
              sx={{ border: 1, borderColor: 'divider' }}
            >
              <Plus size={18} />
            </IconButton>
          </Stack>
        </Stack>
        {errors.seats && <FormHelperText error>{errors.seats}</FormHelperText>}
      </Box>
    </Stack>
  );
}

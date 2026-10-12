'use client';

import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import FormHelperText from '@mui/material/FormHelperText';
import Typography from '@mui/material/Typography';
import type { PackageSize } from '@/types/delivery';
import { PACKAGE_SIZES } from '../packageSizes';

interface PackageSizePickerProps {
  value: PackageSize | null;
  onChange: (size: PackageSize) => void;
  error?: string;
}

/** Tamanho do pacote em cards selecionáveis (2 por linha no celular, 4 no tablet) */
export default function PackageSizePicker({ value, onChange, error }: PackageSizePickerProps) {
  return (
    <Box>
      <Box
        role="radiogroup"
        aria-label="Tamanho do pacote"
        sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' }, gap: 1.5 }}
      >
        {PACKAGE_SIZES.map(({ value: size, label, hint, icon: Icon }) => {
          const selected = value === size;
          return (
            <ButtonBase
              key={size}
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(size)}
              sx={{
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: 1,
                p: 1.5,
                borderRadius: 3,
                textAlign: 'left',
                border: 2,
                borderColor: selected ? 'primary.main' : 'divider',
                bgcolor: selected ? 'rgba(var(--mui-palette-primary-mainChannel) / 0.08)' : 'background.paper',
                transition: 'border-color 150ms, background-color 150ms',
              }}
            >
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 2,
                  display: 'grid',
                  placeItems: 'center',
                  color: selected ? 'primary.contrastText' : 'primary.main',
                  bgcolor: selected ? 'primary.main' : 'rgba(var(--mui-palette-primary-mainChannel) / 0.12)',
                }}
              >
                <Icon size={20} />
              </Box>
              <Box>
                <Typography sx={{ fontWeight: 700, lineHeight: 1.2 }}>{label}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {hint}
                </Typography>
              </Box>
            </ButtonBase>
          );
        })}
      </Box>
      {error && <FormHelperText error>{error}</FormHelperText>}
    </Box>
  );
}

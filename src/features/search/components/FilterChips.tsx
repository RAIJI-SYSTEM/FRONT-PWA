import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';

interface FilterChipsProps<V extends string> {
  label: string;
  options: { value: V; label: string }[];
  value: V;
  onChange: (value: V) => void;
}

/** Linha de chips de escolha única (rolável na horizontal no celular) */
export default function FilterChips<V extends string>({ label, options, value, onChange }: FilterChipsProps<V>) {
  return (
    <Stack
      direction="row"
      spacing={1}
      role="radiogroup"
      aria-label={label}
      sx={{ overflowX: 'auto', pb: 0.5, scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' } }}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Chip
            key={option.value}
            role="radio"
            aria-checked={selected}
            label={option.label}
            onClick={() => onChange(option.value)}
            color={selected ? 'primary' : 'default'}
            variant={selected ? 'filled' : 'outlined'}
            sx={{ flexShrink: 0, fontWeight: 600 }}
          />
        );
      })}
    </Stack>
  );
}

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

interface RouteSummaryProps {
  origin: string;
  destination: string;
}

function RoutePoint({ label, address, filled }: { label: string; address: string; filled?: boolean }) {
  return (
    <Stack direction="row" spacing={1.5} sx={{ alignItems: 'flex-start' }}>
      <Box
        aria-hidden
        sx={{
          mt: 0.75,
          flexShrink: 0,
          width: 10,
          height: 10,
          borderRadius: '50%',
          border: 2,
          borderColor: 'primary.main',
          bgcolor: filled ? 'primary.main' : 'background.paper',
          position: 'relative',
          zIndex: 1,
        }}
      />
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="caption" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
          {address}
        </Typography>
      </Box>
    </Stack>
  );
}

/** Origem → destino com a linha tracejada entre os pontos, como na referência */
export default function RouteSummary({ origin, destination }: RouteSummaryProps) {
  return (
    <Stack spacing={1} sx={{ position: 'relative' }}>
      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          left: 4,
          top: 14,
          bottom: 30,
          borderLeft: '2px dashed',
          borderColor: 'divider',
        }}
      />
      <RoutePoint label="Origem" address={origin} />
      <RoutePoint label="Destino" address={destination} filled />
    </Stack>
  );
}

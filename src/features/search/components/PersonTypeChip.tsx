import { Building2, User } from 'lucide-react';
import Chip from '@mui/material/Chip';
import type { DriverProfile } from '@/types/drivers';

/** "Pessoa física" ou "MEI"/"Empresa" (pessoa jurídica) */
export default function PersonTypeChip({ driver }: { driver: DriverProfile }) {
  const pj = driver.personType === 'pj';
  return (
    <Chip
      size="small"
      variant="outlined"
      icon={pj ? <Building2 size={14} /> : <User size={14} />}
      label={pj ? `PJ · ${driver.companyKind ?? 'Empresa'}` : 'Pessoa física'}
      sx={{ fontWeight: 600 }}
    />
  );
}

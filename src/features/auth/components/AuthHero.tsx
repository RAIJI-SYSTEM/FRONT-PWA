import Image from 'next/image';
import Box from '@mui/material/Box';
import { Car, Package, Truck } from 'lucide-react';

interface AuthHeroProps {
  /** Foto opcional (ex.: /images/login-hero.jpg em /public). Sem ela, usa a ilustração com ícones. */
  imageSrc?: string;
}

/** Área visual do topo da tela de login, que se dissolve no fundo da página como na referência. */
export default function AuthHero({ imageSrc }: AuthHeroProps) {
  return (
    <Box
      aria-hidden
      sx={{
        position: 'relative',
        height: { xs: '34vh', sm: 320 },
        minHeight: 220,
        overflow: 'hidden',
        borderRadius: { xs: 0, sm: 6 },
        background:
          'linear-gradient(160deg, var(--mui-palette-primary-light) 0%, var(--mui-palette-primary-main) 60%, var(--mui-palette-primary-dark) 100%)',
        // Dissolve a parte de baixo no fundo da página
        maskImage: 'linear-gradient(180deg, #000 55%, transparent 100%)',
      }}
    >
      {imageSrc ? (
        <Image src={imageSrc} alt="" fill priority sizes="(max-width: 600px) 100vw, 520px" style={{ objectFit: 'cover' }} />
      ) : (
        <Box sx={{ position: 'absolute', inset: 0, color: 'common.white' }}>
          <Box sx={{ position: 'absolute', right: '-8%', bottom: '8%', opacity: 0.95, transform: 'rotate(-4deg)' }}>
            <Truck size={220} strokeWidth={1.1} />
          </Box>
          <Box sx={{ position: 'absolute', left: '6%', top: '14%', opacity: 0.45, transform: 'rotate(-12deg)' }}>
            <Package size={88} strokeWidth={1.25} />
          </Box>
          <Box sx={{ position: 'absolute', left: '30%', top: '6%', opacity: 0.3, transform: 'rotate(10deg)' }}>
            <Car size={64} strokeWidth={1.25} />
          </Box>
          <Box sx={{ position: 'absolute', left: '-4%', bottom: '18%', opacity: 0.25, transform: 'rotate(8deg)' }}>
            <Package size={120} strokeWidth={1} />
          </Box>
        </Box>
      )}
    </Box>
  );
}

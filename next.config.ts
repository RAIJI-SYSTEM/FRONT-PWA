import type { NextConfig } from 'next';

/**
 * BUILD_TARGET=mobile gera a exportação estática (pasta out/) que vai dentro do app Android.
 * Só entram arquivos .tsx: as rotas /api (route.ts) e o proxy.ts ficam de fora e continuam
 * rodando no servidor (next dev / next start), que o app acessa por NEXT_PUBLIC_API_URL.
 */
const isMobile = process.env.BUILD_TARGET === 'mobile';

if (isMobile && !process.env.MOBILE_API_URL) {
  throw new Error('Defina MOBILE_API_URL no .env.local (ex.: http://192.168.0.10:3000) antes de npm run build:mobile.');
}

const nextConfig: NextConfig = isMobile
  ? {
      output: 'export',
      // /mensagens → /mensagens/index.html: o servidor local do Capacitor encontra cada página
      trailingSlash: true,
      pageExtensions: ['tsx'],
      images: { unoptimized: true },
      // Endereço do servidor das rotas /api visto pelo celular (só neste build; na web é a mesma origem)
      env: { NEXT_PUBLIC_API_URL: process.env.MOBILE_API_URL },
      // As rotas /api ficam fora deste build e os tipos delas não são gerados; a checagem de
      // tipos completa é feita no build normal (npm run build) e no editor
      typescript: { ignoreBuildErrors: true },
    }
  : {};

export default nextConfig;

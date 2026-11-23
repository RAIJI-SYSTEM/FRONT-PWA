import { existsSync } from 'node:fs';
import { join } from 'node:path';
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

/** Sem o google-services.json, registrar push derruba o app Android (erro nativo, fora do alcance do try/catch) */
const hasFirebaseConfig = existsSync(join(process.cwd(), 'android/app/google-services.json'));

/** Só desenvolvimento: deixa abrir o `dev:lan` no navegador pelo endereço da rede (MOBILE_API_URL) */
function lanHosts() {
  try {
    return process.env.MOBILE_API_URL ? [new URL(process.env.MOBILE_API_URL).hostname] : [];
  } catch {
    return [];
  }
}

const nextConfig: NextConfig = isMobile
  ? {
      output: 'export',
      // /mensagens → /mensagens/index.html: o servidor local do Capacitor encontra cada página
      trailingSlash: true,
      pageExtensions: ['tsx'],
      images: { unoptimized: true },
      // Endereço do servidor das rotas /api visto pelo celular (só neste build; na web é a mesma origem)
      env: {
        NEXT_PUBLIC_API_URL: process.env.MOBILE_API_URL,
        NEXT_PUBLIC_PUSH_AVAILABLE: hasFirebaseConfig ? 'true' : 'false',
      },
      // As rotas /api ficam fora deste build e os tipos delas não são gerados; a checagem de
      // tipos completa é feita no build normal (npm run build) e no editor
      typescript: { ignoreBuildErrors: true },
    }
  : { allowedDevOrigins: lanHosts() };

export default nextConfig;

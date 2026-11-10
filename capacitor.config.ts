import type { CapacitorConfig } from '@capacitor/cli';

/**
 * App Android: a interface vem da exportação estática (out/) e as rotas /api continuam no
 * servidor Next, acessado por NEXT_PUBLIC_API_URL (ver npm run build:mobile).
 */
const config: CapacitorConfig = {
  appId: 'com.raiji.app',
  appName: 'Raiji',
  webDir: 'out',
  server: {
    // O app roda em http://localhost: chamar o servidor de testes (http://IP-do-PC:3000)
    // não vira "conteúdo misto". Em produção, troque por https e uma API com https.
    androidScheme: 'http',
    cleartext: true,
  },
};

export default config;

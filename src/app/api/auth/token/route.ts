import { forwardToGateway } from '@/server/gateway';

const REALM = process.env.NEXT_PUBLIC_KEYCLOAK_REALM ?? 'raiji';

/**
 * Troca do código de login pelos tokens e renovação (refresh), pelo BFF: o app não
 * chama o Keycloak em outra origem. As páginas de login/Google continuam abrindo no
 * endereço público do Keycloak (navegação de página inteira, sem CORS).
 */
export async function POST(request: Request) {
  return forwardToGateway(request, `/realms/${REALM}/protocol/openid-connect/token`);
}

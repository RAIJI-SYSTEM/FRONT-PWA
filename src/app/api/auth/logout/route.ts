import { forwardToGateway } from '@/server/gateway';

const REALM = process.env.NEXT_PUBLIC_KEYCLOAK_REALM ?? 'raiji';

/** Encerra a sessão no Keycloak (com o refresh token), pelo BFF */
export async function POST(request: Request) {
  return forwardToGateway(request, `/realms/${REALM}/protocol/openid-connect/logout`);
}

import { getDriverAccount } from '@/server/driverMode';

/** Conta de motorista: status do cadastro, CNH e veículos */
export async function GET() {
  return Response.json(getDriverAccount());
}

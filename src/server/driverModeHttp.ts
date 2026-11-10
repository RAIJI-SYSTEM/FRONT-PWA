import 'server-only';
import { DriverModeError } from './driverMode';

/** Executa uma ação do modo motorista e converte erros de regra em respostas HTTP (com o campo errado) */
export async function handleDriverAction(action: () => unknown | Promise<unknown>, successStatus = 200) {
  try {
    return Response.json(await action(), { status: successStatus });
  } catch (error) {
    if (error instanceof DriverModeError) {
      return Response.json({ error: error.message, fields: error.fields }, { status: error.status });
    }
    throw error;
  }
}

export const readJson = async <T,>(request: Request) => (await request.json().catch(() => ({}))) as Partial<T>;

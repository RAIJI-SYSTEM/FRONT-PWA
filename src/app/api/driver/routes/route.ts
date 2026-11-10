import { listRoutes, publishRoute } from '@/server/driverMode';
import { handleDriverAction, readJson } from '@/server/driverModeHttp';
import type { NewDriverRoute } from '@/types/driverMode';

export async function GET() {
  return Response.json(listRoutes());
}

/** Publicar uma rota (aparece para passageiros em "Buscar → Entre cidades") */
export async function POST(request: Request) {
  const body = await readJson<NewDriverRoute>(request);
  return handleDriverAction(() => publishRoute(body), 201);
}

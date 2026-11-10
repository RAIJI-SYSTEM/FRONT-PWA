import { saveCnh } from '@/server/driverMode';
import { handleDriverAction, readJson } from '@/server/driverModeHttp';
import type { Cnh } from '@/types/driverMode';

/** Salva/atualiza a CNH. As fotos sobem antes por /api/uploads e chegam aqui só os IDs. */
export async function PUT(request: Request) {
  const body = await readJson<Cnh & { frontPhotoId: string; backPhotoId: string }>(request);
  return handleDriverAction(() => saveCnh(body));
}

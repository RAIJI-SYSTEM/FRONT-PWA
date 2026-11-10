import { removeVehicle, updateVehicle } from '@/server/driverMode';
import { handleDriverAction, readJson } from '@/server/driverModeHttp';
import type { Vehicle } from '@/types/driverMode';

/** Editar o veículo ou torná-lo o principal ({ primary: true }) */
export async function PATCH(request: Request, ctx: RouteContext<'/api/driver/vehicles/[id]'>) {
  const { id } = await ctx.params;
  const body = await readJson<Vehicle>(request);
  return handleDriverAction(() => updateVehicle(id, body));
}

export async function DELETE(_request: Request, ctx: RouteContext<'/api/driver/vehicles/[id]'>) {
  const { id } = await ctx.params;
  return handleDriverAction(() => removeVehicle(id));
}

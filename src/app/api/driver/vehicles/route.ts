import { addVehicle } from '@/server/driverMode';
import { handleDriverAction, readJson } from '@/server/driverModeHttp';
import type { Vehicle } from '@/types/driverMode';

export async function POST(request: Request) {
  const body = await readJson<Vehicle>(request);
  return handleDriverAction(() => addVehicle(body), 201);
}

import { modeFromRequest } from '@/server/modeParam';
import { getPreferences, updatePreferences } from '@/server/notifications';
import type { NotificationPreferences } from '@/types/notification';

export async function GET(request: Request) {
  return Response.json(getPreferences(modeFromRequest(request)));
}

/** Liga/desliga tipos de aviso: { promotions: false, ... } */
export async function PATCH(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Partial<NotificationPreferences>;
  return Response.json(updatePreferences(modeFromRequest(request), body));
}

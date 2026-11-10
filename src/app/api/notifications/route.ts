import { modeFromRequest } from '@/server/modeParam';
import { listNotifications } from '@/server/notifications';

/** Notificações do modo: /api/notifications?modo=motorista */
export async function GET(request: Request) {
  return Response.json(listNotifications(modeFromRequest(request)));
}

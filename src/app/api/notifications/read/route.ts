import { modeFromRequest } from '@/server/modeParam';
import { markRead } from '@/server/notifications';

/** Marcar como lidas: { ids: [...] } ou {} para todas do modo */
export async function POST(request: Request) {
  const { ids } = (await request.json().catch(() => ({}))) as { ids?: unknown };
  const list = Array.isArray(ids) ? ids.filter((x): x is string => typeof x === 'string') : undefined;
  return Response.json(markRead(modeFromRequest(request), list));
}

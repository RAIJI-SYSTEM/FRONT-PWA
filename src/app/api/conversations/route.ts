import { listConversations } from '@/server/messages';

export async function GET() {
  return Response.json(listConversations());
}

import { listJobs } from '@/server/driverMode';

/** Viagens que o motorista aceitou ou concluiu */
export async function GET() {
  return Response.json(listJobs());
}

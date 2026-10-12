import { saveUpload, UploadError } from '@/server/uploads';

/**
 * Recebe um arquivo do chat (multipart/form-data, campo "file").
 * Mensagens de voz enviam também "durationSeconds".
 */
export async function POST(request: Request) {
  const form = await request.formData().catch(() => null);
  const file = form?.get('file');
  if (!(file instanceof File)) return Response.json({ error: 'Nenhum arquivo enviado.' }, { status: 400 });

  const duration = Number(form?.get('durationSeconds'));
  try {
    const attachment = await saveUpload(file, Number.isFinite(duration) ? duration : undefined);
    return Response.json(attachment, { status: 201 });
  } catch (error) {
    if (error instanceof UploadError) return Response.json({ error: error.message }, { status: error.status });
    throw error;
  }
}

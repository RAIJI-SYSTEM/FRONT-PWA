import { getUpload } from '@/server/uploads';

export async function GET(_request: Request, ctx: RouteContext<'/api/uploads/[id]'>) {
  const { id } = await ctx.params;
  const upload = getUpload(id);
  if (!upload) return new Response('Arquivo não encontrado', { status: 404 });

  const { attachment, data } = upload;
  return new Response(new Blob([data as BlobPart], { type: attachment.mimeType }), {
    headers: {
      'Content-Type': attachment.mimeType,
      'Content-Length': String(data.byteLength),
      // Documentos baixam com o nome original; imagens e áudios abrem no próprio app
      'Content-Disposition': `${attachment.type === 'document' ? 'attachment' : 'inline'}; filename*=UTF-8''${encodeURIComponent(attachment.name)}`,
      // Arquivos enviados por usuários nunca executam código no domínio do app
      'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; sandbox",
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'private, max-age=3600',
    },
  });
}

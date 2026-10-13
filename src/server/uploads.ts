/**
 * SIMULAÇÃO do armazenamento de arquivos (fotos, documentos e áudios do chat).
 * Guarda tudo em memória. Em produção, troque por um storage (S3, R2, GCS...)
 * — idealmente com URLs pré-assinadas, para o arquivo ir direto do celular ao storage.
 */
import 'server-only';
import type { Attachment } from '@/types/message';
import { attachmentTypeFor, baseMimeType, MAX_ATTACHMENT_BYTES, MAX_VOICE_SECONDS } from '@/utils/attachments';

interface StoredUpload {
  attachment: Attachment;
  data: Uint8Array;
}

export class UploadError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}

// O armazenamento é criado no fim do arquivo, depois das funções que geram os exemplos

export async function saveUpload(file: File, durationSeconds?: number): Promise<Attachment> {
  const type = attachmentTypeFor(file.type);
  if (!type) throw new UploadError('Tipo de arquivo não permitido.', 415);
  if (file.size === 0) throw new UploadError('Arquivo vazio.');
  if (file.size > MAX_ATTACHMENT_BYTES) throw new UploadError('Arquivo maior que 10 MB.', 413);

  const id = crypto.randomUUID();
  const attachment: Attachment = {
    id,
    type,
    name: file.name || 'arquivo',
    mimeType: baseMimeType(file.type),
    sizeBytes: file.size,
    url: `/api/uploads/${id}`,
    durationSeconds:
      type === 'audio' && durationSeconds !== undefined && Number.isFinite(durationSeconds)
        ? Math.min(Math.max(durationSeconds, 0), MAX_VOICE_SECONDS)
        : undefined,
  };
  uploads.set(id, { attachment, data: new Uint8Array(await file.arrayBuffer()) });
  return attachment;
}

export function getUpload(id: string) {
  return uploads.get(id) ?? null;
}

/** Confere se todos os anexos existem (o cliente nunca informa URLs diretamente) */
export function resolveAttachments(ids: string[]): Attachment[] | null {
  const attachments = ids.map((id) => uploads.get(id)?.attachment);
  return attachments.every(Boolean) ? (attachments as Attachment[]) : null;
}

// ---------------------------------------------------------------------------
// Arquivos de exemplo para as conversas simuladas
// ---------------------------------------------------------------------------

const encoder = new TextEncoder();

/** Ilustração do "ponto de encontro" (gerada aqui, por isso SVG é aceitável) */
function meetingPointImage() {
  return encoder.encode(`<svg xmlns="http://www.w3.org/2000/svg" width="480" height="320" viewBox="0 0 480 320">
  <rect width="480" height="320" fill="#FFE0B2"/>
  <rect y="230" width="480" height="90" fill="#90A4AE"/>
  <rect y="268" width="480" height="6" fill="#ECEFF1" stroke-dasharray="30 20"/>
  <rect x="60" y="70" width="150" height="160" rx="6" fill="#EF6C00"/>
  <rect x="80" y="95" width="40" height="40" fill="#FFF3E0"/><rect x="150" y="95" width="40" height="40" fill="#FFF3E0"/>
  <rect x="115" y="170" width="40" height="60" fill="#5D4037"/>
  <rect x="270" y="150" width="120" height="80" rx="6" fill="#455A64"/>
  <text x="330" y="198" font-family="sans-serif" font-size="22" fill="#fff" text-anchor="middle">BANCA</text>
  <circle cx="240" cy="200" r="16" fill="#D32F2F"/><circle cx="240" cy="200" r="6" fill="#fff"/>
  <text x="240" y="40" font-family="sans-serif" font-size="22" font-weight="bold" fill="#1E293B" text-anchor="middle">Ponto de encontro</text>
</svg>`);
}

/** PDF mínimo válido com uma linha de texto */
function receiptPdf() {
  const content = 'BT /F1 18 Tf 72 720 Td (Comprovante de coleta - Encomenda #H62J568107) Tj ET';
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];
  let pdf = '%PDF-1.4\n';
  const offsets = objects.map((body, index) => {
    const offset = pdf.length;
    pdf += `${index + 1} 0 obj\n${body}\nendobj\n`;
    return offset;
  });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  pdf += offsets.map((o) => `${String(o).padStart(10, '0')} 00000 n \n`).join('');
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return encoder.encode(pdf);
}

/** Áudio WAV curto (um tom suave) para demonstrar o player de mensagens de voz */
function sampleVoiceWav(seconds: number) {
  const sampleRate = 8000;
  const samples = sampleRate * seconds;
  const buffer = new ArrayBuffer(44 + samples * 2);
  const view = new DataView(buffer);
  const writeText = (offset: number, text: string) => [...text].forEach((c, i) => view.setUint8(offset + i, c.charCodeAt(0)));

  writeText(0, 'RIFF');
  view.setUint32(4, 36 + samples * 2, true);
  writeText(8, 'WAVE');
  writeText(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeText(36, 'data');
  view.setUint32(40, samples * 2, true);
  for (let i = 0; i < samples; i++) {
    const t = i / sampleRate;
    const envelope = Math.min(1, t * 8, (seconds - t) * 8); // sem estalos no início/fim
    const value = Math.sin(2 * Math.PI * 440 * t) * 0.2 * envelope;
    view.setInt16(44 + i * 2, value * 0x7fff, true);
  }
  return new Uint8Array(buffer);
}

function createSeedUploads() {
  const seeds = [
    { id: 'seed-ponto-encontro', name: 'ponto-de-encontro.svg', mimeType: 'image/svg+xml', type: 'image' as const, data: meetingPointImage() },
    { id: 'seed-comprovante', name: 'Comprovante de coleta.pdf', mimeType: 'application/pdf', type: 'document' as const, data: receiptPdf() },
    { id: 'seed-audio', name: 'mensagem-de-voz.wav', mimeType: 'audio/wav', type: 'audio' as const, data: sampleVoiceWav(4), durationSeconds: 4 },
  ].map(({ data, durationSeconds, ...meta }) => ({
    data,
    attachment: { ...meta, sizeBytes: data.byteLength, url: `/api/uploads/${meta.id}`, durationSeconds },
  }));
  return new Map(seeds.map((seed) => [seed.attachment.id, seed]));
}

// Fica no fim: os exemplos dependem de constantes declaradas acima (ex.: `encoder`)
const globalStore = globalThis as unknown as { uploads?: Map<string, StoredUpload> };
const uploads = (globalStore.uploads ??= createSeedUploads());

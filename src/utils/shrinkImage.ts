/** Maior lado da foto enviada: legível para a leitura automática e leve para enviar pelo celular */
const MAX_SIDE = 2400;
/** Abaixo disso a foto segue como está */
const SHRINK_ABOVE_BYTES = 3 * 1024 * 1024;

/**
 * Reduz fotos grandes da câmera (muitos celulares geram 10 MB ou mais) para JPEG.
 * Se o navegador não conseguir abrir a imagem (ex.: HEIC), devolve o arquivo original.
 */
export async function shrinkImage(file: File): Promise<File> {
  if (file.size <= SHRINK_ABOVE_BYTES || !file.type.startsWith('image/')) return file;
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.88));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' });
  } catch {
    return file;
  }
}

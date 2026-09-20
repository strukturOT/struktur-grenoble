const MAX_INPUT_BYTES = 30 * 1024 * 1024;
const TARGET_BYTES = 450 * 1024;
const MAX_EDGE = 1800;
const MIN_EDGE = 900;

const canvasToBlob = (canvas: HTMLCanvasElement, type: string, quality: number) =>
  new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Impossible de compresser cette image.')), type, quality);
  });

export async function optimizeProductImage(source: File) {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(source.type)) {
    throw new Error('Format non pris en charge. Utilisez JPG, PNG ou WebP.');
  }
  if (source.size > MAX_INPUT_BYTES) {
    throw new Error('Cette image dépasse 30 Mo. Choisissez une image plus légère.');
  }

  const bitmap = await createImageBitmap(source, { imageOrientation: 'from-image' });
  const originalLongestEdge = Math.max(bitmap.width, bitmap.height);
  let scale = Math.min(1, MAX_EDGE / originalLongestEdge);
  let bestBlob: Blob | null = null;

  try {
    for (let resizeAttempt = 0; resizeAttempt < 5; resizeAttempt += 1) {
      const width = Math.max(1, Math.round(bitmap.width * scale));
      const height = Math.max(1, Math.round(bitmap.height * scale));
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext('2d', { alpha: false });
      if (!context) throw new Error('Votre navigateur ne peut pas optimiser cette image.');
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = 'high';
      context.drawImage(bitmap, 0, 0, width, height);

      for (const quality of [0.84, 0.76, 0.68, 0.6]) {
        const blob = await canvasToBlob(canvas, 'image/webp', quality);
        bestBlob = blob;
        if (blob.size <= TARGET_BYTES) {
          return new File([blob], `${source.name.replace(/\.[^.]+$/, '')}.webp`, { type: 'image/webp', lastModified: Date.now() });
        }
      }

      if (Math.max(width, height) <= MIN_EDGE) break;
      scale *= 0.82;
    }
  } finally {
    bitmap.close();
  }

  if (!bestBlob) throw new Error('Impossible de compresser cette image.');
  return new File([bestBlob], `${source.name.replace(/\.[^.]+$/, '')}.webp`, { type: 'image/webp', lastModified: Date.now() });
}

export const formatFileSize = (bytes: number) => bytes < 1024 * 1024
  ? `${Math.max(1, Math.round(bytes / 1024))} Ko`
  : `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;

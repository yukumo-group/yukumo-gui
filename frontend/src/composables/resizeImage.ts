const MAX_EDGE_PX = 512;
const JPEG_QUALITY = 0.8;

export async function resizeImageToDataUrl(
  source: Blob,
  maxEdgePx = MAX_EDGE_PX,
): Promise<string> {
  const bitmap = await createImageBitmap(source);
  const scale = Math.min(1, maxEdgePx / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) {
    bitmap.close();
    throw new Error('canvas');
  }
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  return canvas.toDataURL('image/jpeg', JPEG_QUALITY);
}

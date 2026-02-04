import imageCompression from 'browser-image-compression';

export interface CompressionOptions {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  useWebWorker?: boolean;
}

const defaultOptions: CompressionOptions = {
  maxSizeMB: 1, // Max 1MB after compression
  maxWidthOrHeight: 1920, // Max dimension
  useWebWorker: true,
};

/**
 * Compresses an image file before upload
 * @param file - The image file to compress
 * @param options - Compression options
 * @returns Compressed file
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<File> {
  const mergedOptions = { ...defaultOptions, ...options };

  // Skip compression for small files (< 500KB) or non-compressible formats
  if (file.size < 500 * 1024) {
    return file;
  }

  // Skip GIFs to preserve animation
  if (file.type === 'image/gif') {
    return file;
  }

  try {
    const compressedBlob = await imageCompression(file, {
      maxSizeMB: mergedOptions.maxSizeMB,
      maxWidthOrHeight: mergedOptions.maxWidthOrHeight,
      useWebWorker: mergedOptions.useWebWorker,
      fileType: file.type as 'image/jpeg' | 'image/png' | 'image/webp',
    });

    // Create a new File from the compressed Blob
    const compressedFile = new File([compressedBlob], file.name, {
      type: compressedBlob.type,
      lastModified: Date.now(),
    });

    // Log compression results for debugging
    const originalSize = (file.size / 1024).toFixed(1);
    const compressedSize = (compressedFile.size / 1024).toFixed(1);
    const savings = (((file.size - compressedFile.size) / file.size) * 100).toFixed(0);
    console.log(
      `Image compressed: ${originalSize}KB → ${compressedSize}KB (${savings}% reduction)`
    );

    return compressedFile;
  } catch (error) {
    console.warn('Image compression failed, using original:', error);
    return file;
  }
}

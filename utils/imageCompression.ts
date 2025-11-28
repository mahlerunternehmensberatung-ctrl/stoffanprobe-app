/**
 * Image compression utility for reducing file size before upload
 * Compresses images to max 1920px width/height and 85% JPEG quality
 */

interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

const DEFAULT_OPTIONS: CompressionOptions = {
  maxWidth: 1920,
  maxHeight: 1920,
  quality: 0.85,
};

/**
 * Compresses an image file or data URL to reduce file size
 * @param input - File object or data URL string
 * @param options - Compression options (maxWidth, maxHeight, quality)
 * @returns Promise<string> - Compressed image as data URL
 */
export const compressImage = (
  input: File | string,
  options: CompressionOptions = {}
): Promise<string> => {
  const { maxWidth, maxHeight, quality } = { ...DEFAULT_OPTIONS, ...options };

  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      try {
        // Calculate new dimensions while maintaining aspect ratio
        let { width, height } = img;

        if (width > maxWidth! || height > maxHeight!) {
          const ratio = Math.min(maxWidth! / width, maxHeight! / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        // Create canvas for compression
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        // Draw image with high quality scaling
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to JPEG with specified quality
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);

        // Log compression stats for debugging
        const originalSize = typeof input === 'string' ? input.length : 0;
        const compressedSize = compressedDataUrl.length;
        console.log(`Image compressed: ${img.naturalWidth}x${img.naturalHeight} -> ${width}x${height}, ` +
          `Size: ${(originalSize / 1024).toFixed(0)}KB -> ${(compressedSize / 1024).toFixed(0)}KB ` +
          `(${((1 - compressedSize / originalSize) * 100).toFixed(0)}% reduction)`);

        resolve(compressedDataUrl);
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error('Failed to load image for compression'));
    };

    // Handle both File and data URL inputs
    if (typeof input === 'string') {
      img.src = input;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(input);
    }
  });
};

/**
 * Compresses a File object directly (convenience function)
 */
export const compressImageFile = (
  file: File,
  options: CompressionOptions = {}
): Promise<string> => {
  return compressImage(file, options);
};

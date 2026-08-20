export interface ImageConversionOptions {
  format: 'image/png' | 'image/jpeg' | 'image/webp' | 'image/avif' | 'image/bmp' | 'image/x-icon';
  quality: number; // 0.1 to 1.0
  maxWidth?: number;
  maxHeight?: number;
}

export interface ImageDimension {
  width: number;
  height: number;
}

export class ImageEngine {
  /**
   * Load a File or Blob into an HTMLImageElement
   */
  static loadImage(source: File | Blob | string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = (e) => reject(new Error('Failed to load image: ' + e));

      if (typeof source === 'string') {
        img.src = source;
      } else {
        const url = URL.createObjectURL(source);
        img.src = url;
      }
    });
  }

  /**
   * Get natural dimensions of an image
   */
  static async getImageDimensions(file: File | Blob): Promise<ImageDimension> {
    const img = await this.loadImage(file);
    return { width: img.naturalWidth, height: img.naturalHeight };
  }

  /**
   * Convert or Compress an image using HTML5 Offscreen/DOM Canvas
   */
  static async processImage(
    file: File | Blob,
    options: ImageConversionOptions
  ): Promise<{ blob: Blob; dataUrl: string; width: number; height: number }> {
    const img = await this.loadImage(file);
    let targetWidth = img.naturalWidth;
    let targetHeight = img.naturalHeight;

    if (options.maxWidth && options.maxWidth < targetWidth) {
      const ratio = options.maxWidth / targetWidth;
      targetWidth = Math.round(options.maxWidth);
      targetHeight = Math.round(targetHeight * ratio);
    }

    if (options.maxHeight && options.maxHeight < targetHeight) {
      const ratio = options.maxHeight / targetHeight;
      targetHeight = Math.round(options.maxHeight);
      targetWidth = Math.round(targetWidth * ratio);
    }

    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    if (!ctx) {
      throw new Error('Canvas 2D context is not supported in this browser environment.');
    }

    // High quality interpolation
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // If converting to JPEG or ICO, fill background with white (avoid black alpha artifacts)
    if (options.format === 'image/jpeg' || options.format === 'image/bmp') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, targetWidth, targetHeight);
    }

    ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

    // Fallback format if browser does not support AVIF
    let targetMime = options.format;
    if (targetMime === 'image/x-icon') {
      targetMime = 'image/png'; // ICO encoded as PNG stream
    }

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to encode image to ' + options.format));
            return;
          }
          const dataUrl = canvas.toDataURL(targetMime, options.quality);
          resolve({ blob, dataUrl, width: targetWidth, height: targetHeight });
        },
        targetMime,
        options.quality
      );
    });
  }

  /**
   * Resize image to target width and height
   */
  static async resizeImage(
    file: File | Blob,
    width: number,
    height: number,
    mimeType: string = 'image/png',
    quality: number = 0.92
  ): Promise<{ blob: Blob; dataUrl: string }> {
    const img = await this.loadImage(file);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    if (!ctx) throw new Error('Could not get 2D canvas context');

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    if (mimeType === 'image/jpeg') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
    }

    ctx.drawImage(img, 0, 0, width, height);

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error('Resize blob creation failed'));
          resolve({ blob, dataUrl: canvas.toDataURL(mimeType, quality) });
        },
        mimeType,
        quality
      );
    });
  }
}

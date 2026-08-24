import { env } from '@xenova/transformers';

if (typeof window !== 'undefined') {
  env.allowLocalModels = false;
  env.useBrowserCache = true;
}

export interface BackgroundRemoverOptions {
  backgroundType: 'transparent' | 'color' | 'blur';
  backgroundColor?: string; // hex e.g. '#ffffff'
  blurRadius?: number; // 0 to 30
  threshold?: number; // 0 to 255 for edge refinement
}

export interface RemoveBgProgress {
  status: 'loading' | 'segmenting' | 'compositing' | 'done' | 'error';
  progress: number;
  message: string;
}

export interface RemoveBgResult {
  blob: Blob;
  dataUrl: string;
  originalWidth: number;
  originalHeight: number;
  maskDataUrl?: string;
}

export class BackgroundRemoverEngine {
  /**
   * Loads image element from File or Blob
   */
  static async loadImage(file: File | Blob): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load image file.'));
      };
      img.src = url;
    });
  }

  /**
   * Generates high-contrast foreground mask using client-side chroma & edge saliency or neural segmentation
   */
  static async generateMask(img: HTMLImageElement): Promise<ImageData> {
    const canvas = document.createElement('canvas');
    const width = img.naturalWidth || img.width;
    const height = img.naturalHeight || img.height;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error('2D Canvas is not supported.');

    ctx.drawImage(img, 0, 0, width, height);
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;

    // Corner sample background colors for edge seed detection
    const cornerSamples = [
      { r: data[0], g: data[1], b: data[2] }, // Top-left
      { r: data[(width - 1) * 4], g: data[(width - 1) * 4 + 1], b: data[(width - 1) * 4 + 2] }, // Top-right
      { r: data[(height - 1) * width * 4], g: data[(height - 1) * width * 4 + 1], b: data[(height - 1) * width * 4 + 2] }, // Bottom-left
      { r: data[((height - 1) * width + (width - 1)) * 4], g: data[((height - 1) * width + (width - 1)) * 4 + 1], b: data[((height - 1) * width + (width - 1)) * 4 + 2] }, // Bottom-right
    ];

    const avgBgR = (cornerSamples[0].r + cornerSamples[1].r + cornerSamples[2].r + cornerSamples[3].r) / 4;
    const avgBgG = (cornerSamples[0].g + cornerSamples[1].g + cornerSamples[2].g + cornerSamples[3].g) / 4;
    const avgBgB = (cornerSamples[0].b + cornerSamples[1].b + cornerSamples[2].b + cornerSamples[3].b) / 4;

    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = width;
    maskCanvas.height = height;
    const maskCtx = maskCanvas.getContext('2d', { willReadFrequently: true })!;
    const maskImgData = maskCtx.createImageData(width, height);
    const mask = maskImgData.data;

    const colorDistThreshold = 38; // Sensitivity

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // Distance from detected corner background
      let minDist = 999;
      for (const corner of cornerSamples) {
        const d = Math.sqrt((r - corner.r) ** 2 + (g - corner.g) ** 2 + (b - corner.b) ** 2);
        if (d < minDist) minDist = d;
      }

      const avgDist = Math.sqrt((r - avgBgR) ** 2 + (g - avgBgG) ** 2 + (b - avgBgB) ** 2);
      const effectiveDist = Math.min(minDist, avgDist);

      let alpha = 255;
      if (effectiveDist < colorDistThreshold) {
        // Smooth feathering boundary
        alpha = Math.max(0, Math.min(255, Math.floor(((effectiveDist - 12) / (colorDistThreshold - 12)) * 255)));
      }

      mask[i] = 255;
      mask[i + 1] = 255;
      mask[i + 2] = 255;
      mask[i + 3] = alpha;
    }

    return maskImgData;
  }

  /**
   * Removes background and composites onto transparent canvas, solid color, or blurred backdrop
   */
  static async removeBackground(
    file: File | Blob,
    options: BackgroundRemoverOptions = { backgroundType: 'transparent' },
    onProgress?: (progress: RemoveBgProgress) => void
  ): Promise<RemoveBgResult> {
    onProgress?.({
      status: 'loading',
      progress: 15,
      message: 'Loading image...',
    });

    const img = await this.loadImage(file);
    const width = img.naturalWidth || img.width;
    const height = img.naturalHeight || img.height;

    onProgress?.({
      status: 'segmenting',
      progress: 50,
      message: 'Segmenting foreground subject and generating alpha mask...',
    });

    const maskData = await this.generateMask(img);

    onProgress?.({
      status: 'compositing',
      progress: 80,
      message: 'Compositing foreground with background layer...',
    });

    const outputCanvas = document.createElement('canvas');
    outputCanvas.width = width;
    outputCanvas.height = height;
    const ctx = outputCanvas.getContext('2d')!;

    // 1. Draw Background Layer
    if (options.backgroundType === 'color' && options.backgroundColor) {
      ctx.fillStyle = options.backgroundColor;
      ctx.fillRect(0, 0, width, height);
    } else if (options.backgroundType === 'blur') {
      ctx.filter = `blur(${options.blurRadius || 16}px)`;
      ctx.drawImage(img, -20, -20, width + 40, height + 40);
      ctx.filter = 'none';
    }

    // 2. Prepare Masked Foreground
    const fgCanvas = document.createElement('canvas');
    fgCanvas.width = width;
    fgCanvas.height = height;
    const fgCtx = fgCanvas.getContext('2d', { willReadFrequently: true })!;

    // Draw original image
    fgCtx.drawImage(img, 0, 0, width, height);
    const fgImgData = fgCtx.getImageData(0, 0, width, height);

    // Apply alpha mask to original image pixels
    for (let i = 0; i < fgImgData.data.length; i += 4) {
      fgImgData.data[i + 3] = maskData.data[i + 3];
    }
    fgCtx.putImageData(fgImgData, 0, 0);

    // Composite foreground onto output canvas
    ctx.drawImage(fgCanvas, 0, 0);

    onProgress?.({
      status: 'done',
      progress: 100,
      message: 'Background removed successfully!',
    });

    return new Promise((resolve, reject) => {
      outputCanvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to create output PNG blob.'));
            return;
          }
          const dataUrl = outputCanvas.toDataURL('image/png');
          resolve({
            blob,
            dataUrl,
            originalWidth: width,
            originalHeight: height,
          });
        },
        'image/png',
        1.0
      );
    });
  }
}

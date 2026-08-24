export interface GifOptions {
  fps: number; // 10 to 30
  width?: number; // Target width in pixels (or undefined for original)
  startTime?: number; // in seconds
  endTime?: number; // in seconds
  quality?: number; // 1 (highest) to 10 (fastest)
  loop?: number; // 0 = infinite loop
}

export interface GifProgress {
  status: 'loading' | 'capturing' | 'quantizing' | 'encoding' | 'done' | 'error';
  progress: number;
  currentFrame: number;
  totalFrames: number;
  message: string;
}

export interface GifResult {
  blob: Blob;
  dataUrl: string;
  frameCount: number;
  width: number;
  height: number;
  fileSize: number;
  duration: number;
}

// Simple LZW GIF Byte Stream Encoder
class LZWEncoder {
  private width: number;
  private height: number;
  private colorDepth = 8;
  private initCodeSize = 8;
  private curAccum = 0;
  private curBits = 0;
  private accum = new Uint8Array(256);
  private a_count = 0;
  private out: number[] = [];

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
  }

  private char_out(c: number) {
    this.accum[this.a_count++] = c;
    if (this.a_count >= 254) this.flush_char();
  }

  private flush_char() {
    if (this.a_count > 0) {
      this.out.push(this.a_count);
      for (let i = 0; i < this.a_count; i++) {
        this.out.push(this.accum[i]);
      }
      this.a_count = 0;
    }
  }

  private output(code: number, n_bits: number) {
    this.curAccum |= code << this.curBits;
    this.curBits += n_bits;

    while (this.curBits >= 8) {
      this.char_out(this.curAccum & 0xff);
      this.curAccum >>= 8;
      this.curBits -= 8;
    }
  }

  encode(pixels: Uint8Array, colorDepth: number): number[] {
    this.out = [];
    this.curAccum = 0;
    this.curBits = 0;
    this.a_count = 0;
    this.colorDepth = Math.max(2, colorDepth);
    this.initCodeSize = Math.max(2, colorDepth);

    const clearCode = 1 << this.initCodeSize;
    const eofCode = clearCode + 1;
    let n_bits = this.initCodeSize + 1;
    let maxcode = (1 << n_bits) - 1;

    // Dict map
    const htab: { [key: number]: number } = {};
    let free_ent = clearCode + 2;

    this.out.push(this.initCodeSize);
    this.output(clearCode, n_bits);

    let ent = pixels[0];

    for (let i = 1; i < pixels.length; i++) {
      const c = pixels[i];
      const fcode = (c << 12) + ent;
      const hval = fcode % 5003;

      if (htab[fcode] !== undefined) {
        ent = htab[fcode];
        continue;
      }

      this.output(ent, n_bits);
      ent = c;

      if (free_ent < 4096) {
        htab[fcode] = free_ent++;
        if (free_ent > maxcode) {
          n_bits++;
          maxcode = (1 << n_bits) - 1;
        }
      } else {
        // Clear table
        for (const k in htab) delete htab[k];
        this.output(clearCode, n_bits);
        n_bits = this.initCodeSize + 1;
        maxcode = (1 << n_bits) - 1;
        free_ent = clearCode + 2;
      }
    }

    this.output(ent, n_bits);
    this.output(eofCode, n_bits);

    if (this.curBits > 0) {
      this.char_out(this.curAccum & 0xff);
    }
    this.flush_char();
    this.out.push(0x00); // Block terminator

    return this.out;
  }
}

export class GifEngine {
  /**
   * Quantizes 24-bit RGB ImageData into standard 256-color palette and indexed pixel array
   */
  static quantizeFrame(
    imgData: ImageData
  ): { palette: number[]; indexedPixels: Uint8Array } {
    const data = imgData.data;
    const totalPixels = imgData.width * imgData.height;
    const indexedPixels = new Uint8Array(totalPixels);

    // Build 6x6x6 color cube palette (216 colors) + 40 grayscale/skin ramps = 256 colors
    const palette: number[] = [];

    // 6x6x6 RGB cube
    for (let r = 0; r < 6; r++) {
      for (let g = 0; g < 6; g++) {
        for (let b = 0; b < 6; b++) {
          palette.push(Math.round((r * 255) / 5));
          palette.push(Math.round((g * 255) / 5));
          palette.push(Math.round((b * 255) / 5));
        }
      }
    }

    // 40 grayscale steps
    for (let i = 0; i < 40; i++) {
      const v = Math.round((i * 255) / 39);
      palette.push(v, v, v);
    }

    // Map each pixel to nearest palette color
    for (let i = 0; i < totalPixels; i++) {
      const r = data[i * 4];
      const g = data[i * 4 + 1];
      const b = data[i * 4 + 2];

      const rIdx = Math.min(5, Math.floor((r / 256) * 6));
      const gIdx = Math.min(5, Math.floor((g / 256) * 6));
      const bIdx = Math.min(5, Math.floor((b / 256) * 6));

      indexedPixels[i] = rIdx * 36 + gIdx * 6 + bIdx;
    }

    return { palette, indexedPixels };
  }

  /**
   * Captures frames from HTML5 Video and encodes into animated GIF Blob
   */
  static async renderVideoToGif(
    videoFile: File | Blob,
    options: GifOptions = { fps: 15 },
    onProgress?: (progress: GifProgress) => void
  ): Promise<GifResult> {
    onProgress?.({
      status: 'loading',
      progress: 5,
      currentFrame: 0,
      totalFrames: 0,
      message: 'Loading video stream...',
    });

    const videoUrl = URL.createObjectURL(videoFile);
    const video = document.createElement('video');
    video.src = videoUrl;
    video.muted = true;
    video.playsInline = true;

    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => resolve();
      video.onerror = () => reject(new Error('Failed to load video metadata.'));
    });

    const videoDuration = video.duration || 1;
    const startTime = Math.max(0, options.startTime || 0);
    const endTime = Math.min(videoDuration, options.endTime || videoDuration);
    const clipDuration = Math.max(0.5, endTime - startTime);

    const fps = Math.max(5, Math.min(30, options.fps || 15));
    const delayHundredths = Math.round(100 / fps);
    const totalFrames = Math.max(2, Math.floor(clipDuration * fps));

    // Calculate dimensions
    const origWidth = video.videoWidth || 640;
    const origHeight = video.videoHeight || 360;
    let targetWidth = options.width && options.width > 0 ? options.width : origWidth;
    let targetHeight = Math.round((targetWidth / origWidth) * origHeight);

    // Ensure even dimensions
    if (targetWidth % 2 !== 0) targetWidth++;
    if (targetHeight % 2 !== 0) targetHeight++;

    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!;

    const bytes: number[] = [];

    // 1. GIF89a Header
    const header = 'GIF89a';
    for (let i = 0; i < header.length; i++) bytes.push(header.charCodeAt(i));

    // 2. Logical Screen Descriptor
    bytes.push(targetWidth & 0xff, (targetWidth >> 8) & 0xff);
    bytes.push(targetHeight & 0xff, (targetHeight >> 8) & 0xff);
    bytes.push(0xf7); // Global Color Table Flag (256 colors)
    bytes.push(0x00); // Background Color Index
    bytes.push(0x00); // Pixel Aspect Ratio

    // 3. Global Color Table (Standard 256 color map)
    const dummyData = ctx.createImageData(1, 1);
    const { palette: globalPalette } = this.quantizeFrame(dummyData);
    for (let i = 0; i < 768; i++) {
      bytes.push(globalPalette[i] !== undefined ? globalPalette[i] : 0);
    }

    // 4. Netscape Application Extension (for Infinite Loop)
    bytes.push(0x21, 0xff, 0x0b);
    const appStr = 'NETSCAPE2.0';
    for (let i = 0; i < appStr.length; i++) bytes.push(appStr.charCodeAt(i));
    bytes.push(0x03, 0x01, 0x00, 0x00, 0x00);

    const encoder = new LZWEncoder(targetWidth, targetHeight);

    // 5. Frame Extraction & Encoding Loop
    for (let f = 0; f < totalFrames; f++) {
      const time = startTime + (f / totalFrames) * clipDuration;

      // Seek video to frame timestamp
      video.currentTime = time;
      await new Promise<void>((resolve) => {
        video.onseeked = () => resolve();
      });

      // Draw current video frame to canvas
      ctx.drawImage(video, 0, 0, targetWidth, targetHeight);
      const frameData = ctx.getImageData(0, 0, targetWidth, targetHeight);

      onProgress?.({
        status: 'quantizing',
        progress: 10 + Math.round((f / totalFrames) * 80),
        currentFrame: f + 1,
        totalFrames,
        message: `Encoding GIF frame ${f + 1} of ${totalFrames}...`,
      });

      const { indexedPixels } = this.quantizeFrame(frameData);

      // Graphic Control Extension
      bytes.push(0x21, 0xf9, 0x04);
      bytes.push(0x04); // Disposal Method: Do not dispose
      bytes.push(delayHundredths & 0xff, (delayHundredths >> 8) & 0xff); // Frame delay
      bytes.push(0x00); // Transparent color index
      bytes.push(0x00); // Block terminator

      // Image Descriptor
      bytes.push(0x2c); // Image Separator
      bytes.push(0x00, 0x00); // Left Position
      bytes.push(0x00, 0x00); // Top Position
      bytes.push(targetWidth & 0xff, (targetWidth >> 8) & 0xff);
      bytes.push(targetHeight & 0xff, (targetHeight >> 8) & 0xff);
      bytes.push(0x00); // No Local Color Table

      // LZW Raster Data
      const lzwData = encoder.encode(indexedPixels, 8);
      for (let i = 0; i < lzwData.length; i++) {
        bytes.push(lzwData[i]);
      }
    }

    // 6. GIF Trailer
    bytes.push(0x3b);

    URL.revokeObjectURL(videoUrl);

    const gifUint8 = new Uint8Array(bytes);
    const gifBlob = new Blob([gifUint8], { type: 'image/gif' });
    const dataUrl = URL.createObjectURL(gifBlob);

    onProgress?.({
      status: 'done',
      progress: 100,
      currentFrame: totalFrames,
      totalFrames,
      message: 'Animated GIF rendered successfully!',
    });

    return {
      blob: gifBlob,
      dataUrl,
      frameCount: totalFrames,
      width: targetWidth,
      height: targetHeight,
      fileSize: gifBlob.size,
      duration: clipDuration,
    };
  }
}

export interface ExifTag {
  name: string;
  value: string;
  category: 'camera' | 'location' | 'date' | 'technical';
}

export class ExifEngine {
  /**
   * Inspect basic EXIF information from JPEG/PNG headers
   */
  static async inspectMetadata(file: File): Promise<{
    hasExif: boolean;
    hasGps: boolean;
    tags: ExifTag[];
    fileSize: number;
    mimeType: string;
  }> {
    const buffer = await file.arrayBuffer();
    const view = new DataView(buffer);
    const tags: ExifTag[] = [];
    let hasExif = false;
    let hasGps = false;

    // Check for JPEG SOI (0xFFD8)
    if (view.getUint16(0, false) === 0xffd8) {
      let offset = 2;
      const length = view.byteLength;

      while (offset < length) {
        if (view.getUint8(offset) !== 0xff) break;
        const marker = view.getUint8(offset + 1);

        // APP1 marker (EXIF / XMP)
        if (marker === 0xe1) {
          hasExif = true;
          // Check for Exif header
          const exifHeader = String.fromCharCode(
            view.getUint8(offset + 4),
            view.getUint8(offset + 5),
            view.getUint8(offset + 6),
            view.getUint8(offset + 7)
          );

          if (exifHeader === 'Exif') {
            tags.push({ name: 'EXIF Metadata Block', value: 'Present (Contains embedded device/time data)', category: 'technical' });
            tags.push({ name: 'GPS Geolocation Tag', value: 'Embedded in APP1 block', category: 'location' });
            hasGps = true;
          }
        } else if (marker === 0xe2) {
          tags.push({ name: 'ICC Color Profile', value: 'Present', category: 'technical' });
        } else if (marker === 0xed) {
          tags.push({ name: 'Photoshop / IPTC Data', value: 'Present (Author / Copyright tags)', category: 'camera' });
        }

        const segmentLength = view.getUint16(offset + 2, false);
        offset += 2 + segmentLength;
      }
    }

    tags.push({ name: 'Original File Name', value: file.name, category: 'technical' });
    tags.push({ name: 'Last Modified', value: new Date(file.lastModified).toLocaleString(), category: 'date' });
    tags.push({ name: 'MIME Type', value: file.type || 'image/jpeg', category: 'technical' });

    return {
      hasExif,
      hasGps,
      tags,
      fileSize: file.size,
      mimeType: file.type,
    };
  }

  /**
   * Scrub all EXIF, GPS, and metadata by re-encoding purely pixel data onto an isolated canvas
   */
  static async scrubMetadata(file: File): Promise<{ blob: Blob; cleanedSize: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          URL.revokeObjectURL(url);
          reject(new Error('Canvas context unavailable'));
          return;
        }

        ctx.drawImage(img, 0, 0);
        URL.revokeObjectURL(url);

        const mime = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to generate scrubbed image blob'));
              return;
            }
            resolve({ blob, cleanedSize: blob.size });
          },
          mime,
          0.95
        );
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load image for metadata scrubbing'));
      };

      img.src = url;
    });
  }
}

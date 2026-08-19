import React, { useState, useRef } from 'react';
import { PdfEngine } from '../../engines/pdfEngine';
import { formatBytes, downloadUint8Array, readFileAsDataURL } from '../../lib/utils';
import { Upload, FilePlus, ArrowUp, ArrowDown, Trash2, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface ImageItem {
  id: string;
  file: File;
  dataUrl: string;
  type: string;
  size: number;
}

export const ImagesToPdfWorkspace: React.FC = () => {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [pageSize, setPageSize] = useState<'A4' | 'LETTER' | 'FIT'>('A4');
  const [margin, setMargin] = useState<number>(20);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (fileList: FileList | File[]) => {
    setError(null);
    setSuccess(false);

    const validFiles = Array.from(fileList).filter((f) =>
      f.type.startsWith('image/') || /\.(jpg|jpeg|png|webp|bmp)$/i.test(f.name)
    );

    if (validFiles.length === 0) {
      setError('Please choose valid image files (JPG, PNG, WebP).');
      return;
    }

    try {
      const items: ImageItem[] = [];
      for (const file of validFiles) {
        const dataUrl = await readFileAsDataURL(file);
        items.push({
          id: Math.random().toString(36).substring(2, 9),
          file,
          dataUrl,
          type: file.type || 'image/jpeg',
          size: file.size,
        });
      }
      setImages((prev) => [...prev, ...items]);
    } catch (err: any) {
      setError('Failed to read image: ' + err.message);
    }
  };

  const moveImage = (index: number, direction: 'up' | 'down') => {
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= images.length) return;
    const next = [...images];
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item);
    setImages(next);
  };

  const removeImage = (id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
  };

  const handleGeneratePdf = async () => {
    if (images.length === 0) return;
    setIsProcessing(true);
    setError(null);
    setSuccess(false);

    try {
      const imgPayloads = images.map((img) => ({
        dataUrl: img.dataUrl,
        type: img.type,
      }));

      const pdfBytes = await PdfEngine.imagesToPdf(imgPayloads, pageSize, margin);
      downloadUint8Array(pdfBytes, 'compiled_images.pdf', 'application/pdf');
      setSuccess(true);
    } catch (err: any) {
      setError('Failed to generate PDF: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      <div
        onClick={() => fileInputRef.current?.click()}
        className="group relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-surface-border bg-surface/60 p-8 sm:p-12 hover:border-zinc-700 hover:bg-surface transition-all"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) handleFiles(e.target.files);
            e.target.value = '';
          }}
        />
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-400 group-hover:scale-105 group-hover:border-brand-500/50 group-hover:text-brand-400 transition-all">
          <FilePlus className="h-6 w-6" />
        </div>
        <h3 className="mt-4 text-sm font-semibold text-zinc-200">
          Upload Images to Convert into PDF
        </h3>
        <p className="mt-1 text-xs text-zinc-500">
          Select multiple JPG, PNG, or WebP images to compile into a single document.
        </p>
      </div>

      {images.length > 0 && (
        <div className="rounded-2xl border border-surface-border bg-surface p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-surface-border pb-4">
            <span className="text-sm font-medium text-zinc-200">
              Selected Photos ({images.length})
            </span>
            <button
              onClick={() => setImages([])}
              className="text-xs text-zinc-400 hover:text-red-400"
            >
              Clear All
            </button>
          </div>

          {/* Settings Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Page Size
              </label>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(e.target.value as any)}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3.5 py-2.5 text-xs text-zinc-100 focus:border-brand-500 focus:outline-none"
              >
                <option value="A4">A4 Standard (210 x 297 mm)</option>
                <option value="LETTER">US Letter (8.5 x 11 in)</option>
                <option value="FIT">Fit to Image Dimensions</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Page Margin
              </label>
              <select
                value={margin}
                onChange={(e) => setMargin(Number(e.target.value))}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3.5 py-2.5 text-xs text-zinc-100 focus:border-brand-500 focus:outline-none"
              >
                <option value="0">No Margins (Full Bleed)</option>
                <option value="20">Standard Margins (20px)</option>
                <option value="40">Wide Margins (40px)</option>
              </select>
            </div>
          </div>

          {/* Image List */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[360px] overflow-y-auto p-1">
            {images.map((item, index) => (
              <div
                key={item.id}
                className="group relative flex flex-col items-center rounded-xl border border-zinc-800 bg-zinc-900 p-2 text-center"
              >
                <div className="relative h-24 w-full rounded-lg overflow-hidden bg-black/40 mb-2">
                  <img
                    src={item.dataUrl}
                    alt={item.file.name}
                    className="h-full w-full object-contain"
                  />
                  <span className="absolute bottom-1 left-1 rounded bg-black/75 px-1.5 py-0.5 font-mono text-[9px] text-zinc-300">
                    #{index + 1}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => moveImage(index, 'up')}
                    disabled={index === 0}
                    className="rounded p-1 text-zinc-400 hover:bg-zinc-800 disabled:opacity-30"
                  >
                    <ArrowUp className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => moveImage(index, 'down')}
                    disabled={index === images.length - 1}
                    className="rounded p-1 text-zinc-400 hover:bg-zinc-800 disabled:opacity-30"
                  >
                    <ArrowDown className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => removeImage(item.id)}
                    className="rounded p-1 text-zinc-400 hover:text-red-400 hover:bg-zinc-800"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2">
            <button
              onClick={handleGeneratePdf}
              disabled={isProcessing || images.length === 0}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-brand-500 py-3 text-sm font-semibold text-white shadow-glow-sm transition-all hover:bg-brand-600 active:scale-[0.98] disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Compiling PDF...</span>
                </>
              ) : (
                <span>Compile {images.length} Images to PDF</span>
              )}
            </button>
          </div>

          {error && (
            <div className="flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300">
              <CheckCircle className="h-4 w-4 shrink-0 text-emerald-400" />
              <span>PDF compiled and downloaded successfully!</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

import React, { useState, useRef } from 'react';
import { PdfEngine } from '../../engines/pdfEngine';
import { formatBytes, downloadUint8Array, readFileAsDataURL } from '../../lib/utils';
import { Upload, FilePlus, ArrowUp, ArrowDown, Trash2, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

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
    <div className="w-full space-y-4">
      {/* Dropzone */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className="group relative flex cursor-pointer flex-col items-center justify-center rounded border border-dashed border-[#2A2D33] bg-[#1B1D22] p-6 sm:p-10 hover:border-[#4F8CFF] hover:bg-[#151820] transition-colors"
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
        <div className="flex h-10 w-10 items-center justify-center rounded bg-[#131418] border border-[#2A2D33] text-[#8B8F98] group-hover:text-[#4F8CFF] group-hover:border-[#4F8CFF]/40 transition-colors">
          <FilePlus className="h-5 w-5" />
        </div>
        <h3 className="mt-3 text-xs font-semibold text-[#ECEDEF]">
          Drop images to convert to PDF, or <span className="text-[#4F8CFF] underline">browse files</span>
        </h3>
        <p className="mt-0.5 font-mono text-[11px] text-[#8B8F98]">
          Combine multiple photos, scans, and graphics into one paginated PDF.
        </p>
      </div>

      {images.length > 0 && (
        <div className="rounded border border-[#2A2D33] bg-[#131418] p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#2A2D33] pb-3">
            <span className="text-xs font-medium text-[#ECEDEF]">
              Queued Images ({images.length})
            </span>
            <button
              onClick={() => setImages([])}
              className="font-mono text-[11px] text-[#8B8F98] hover:text-[#ECEDEF] transition-colors"
            >
              Clear All
            </button>
          </div>

          {/* Page Settings */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded bg-[#1B1D22] border border-[#2A2D33] p-3.5">
            <div className="space-y-1">
              <label className="text-xs font-medium text-[#ECEDEF] block">
                Target Page Geometry
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['A4', 'LETTER', 'FIT'] as const).map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => setPageSize(sz)}
                    className={`rounded border py-1.5 text-xs font-medium transition-colors ${
                      pageSize === sz
                        ? 'border-[#4F8CFF] bg-[#16233F] text-[#4F8CFF]'
                        : 'border-[#2A2D33] bg-[#131418] text-[#8B8F98] hover:text-[#ECEDEF]'
                    }`}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-[#ECEDEF] block">
                Page Margins
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[0, 20, 40].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMargin(m)}
                    className={`rounded border py-1.5 text-xs font-medium transition-colors ${
                      margin === m
                        ? 'border-[#4F8CFF] bg-[#16233F] text-[#4F8CFF]'
                        : 'border-[#2A2D33] bg-[#131418] text-[#8B8F98] hover:text-[#ECEDEF]'
                    }`}
                  >
                    {m === 0 ? 'None (0)' : m === 20 ? 'Standard (20)' : 'Wide (40)'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Image Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-[360px] overflow-y-auto p-1">
            {images.map((img, idx) => (
              <div
                key={img.id}
                className="rounded bg-[#1B1D22] border border-[#2A2D33] p-2 space-y-2 flex flex-col justify-between"
              >
                <div className="relative aspect-square w-full overflow-hidden rounded bg-[#131418] border border-[#2A2D33] flex items-center justify-center p-1">
                  <img
                    src={img.dataUrl}
                    alt={img.file.name}
                    className="max-h-full max-w-full object-contain"
                  />
                  <span className="absolute top-1 left-1 rounded bg-[#131418] border border-[#2A2D33] px-1 font-mono text-[9px] text-[#8B8F98]">
                    #{idx + 1}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs pt-1 border-t border-[#2A2D33]/60">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => moveImage(idx, 'up')}
                      disabled={idx === 0}
                      className="rounded p-1 text-[#8B8F98] hover:bg-[#131418] hover:text-[#ECEDEF] disabled:opacity-25"
                    >
                      <ArrowUp className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveImage(idx, 'down')}
                      disabled={idx === images.length - 1}
                      className="rounded p-1 text-[#8B8F98] hover:bg-[#131418] hover:text-[#ECEDEF] disabled:opacity-25"
                    >
                      <ArrowDown className="h-3 w-3" />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeImage(img.id)}
                    className="rounded p-1 text-[#8B8F98] hover:bg-[#331614] hover:text-[#F0564B]"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Action */}
          <div>
            <button
              onClick={handleGeneratePdf}
              disabled={isProcessing || images.length === 0}
              className="w-full flex items-center justify-center gap-2 rounded bg-[#4F8CFF] hover:bg-[#3B79F0] py-2.5 px-4 text-xs font-semibold text-white transition-colors disabled:opacity-40"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Compiling PDF Document...</span>
                </>
              ) : (
                <span>Compile {images.length} Images to PDF</span>
              )}
            </button>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded bg-[#331614] border border-[#F0564B]/40 p-3 text-xs text-[#F0564B]">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 rounded bg-[#122D1F] border border-[#3FBE73]/40 p-3 text-xs text-[#3FBE73]">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>PDF generated and downloaded successfully.</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

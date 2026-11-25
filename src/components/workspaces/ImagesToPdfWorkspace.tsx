import React, { useState, useRef } from 'react';
import { PdfEngine } from '../../engines/pdfEngine';
import { downloadUint8Array, readFileAsDataURL } from '../../lib/utils';
import { WorkspaceDropzone, WorkspaceAlert } from './WorkspaceUI';
import { useHandoffFiles } from '../../lib/useHandoffFiles';
import { FilePlus, ArrowUp, ArrowDown, Trash2, Loader2 } from 'lucide-react';

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

  useHandoffFiles((files) => {
    handleFiles(files);
  });

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
    <div className="w-full space-y-5">
      <WorkspaceDropzone
        onClick={() => fileInputRef.current?.click()}
        onFilesDrop={handleFiles}
        icon={<FilePlus className="h-5 w-5" />}
        title="Drop images to convert to PDF, or"
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
      </WorkspaceDropzone>

      {images.length > 0 && (
        <div className="nt-card p-5 space-y-5">
          <div className="flex items-center justify-between border-b border-[var(--nt-border)] pb-3">
            <span className="text-xs font-extrabold text-[#111214] dark:text-[#F3F4F6]">
              Queued Images ({images.length})
            </span>
            <button
              onClick={() => setImages([])}
              className="font-mono text-[11px] font-semibold text-[#746D61] hover:text-[#B91C1C] dark:hover:text-[#F87171] transition-colors cursor-pointer"
            >
              Clear All
            </button>
          </div>

          <div className="nt-well grid grid-cols-1 sm:grid-cols-2 gap-4 p-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#111214] dark:text-[#F3F4F6] block">
                Target Page Geometry
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['A4', 'LETTER', 'FIT'] as const).map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => setPageSize(sz)}
                    className={`py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                      pageSize === sz
                        ? 'bg-[#111214] dark:bg-[#2563EB] text-white border-[#141413] shadow-sm'
                        : 'nt-btn-secondary'
                    }`}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#111214] dark:text-[#F3F4F6] block">
                Page Margins
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[0, 20, 40].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMargin(m)}
                    className={`py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                      margin === m
                        ? 'bg-[#111214] dark:bg-[#2563EB] text-white border-[#141413] shadow-sm'
                        : 'nt-btn-secondary'
                    }`}
                  >
                    {m === 0 ? 'None' : m === 20 ? 'Standard' : 'Wide'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="nt-well p-3">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-[360px] overflow-y-auto p-1">
              {images.map((img, idx) => (
                <div key={img.id} className="nt-card p-2.5 space-y-2 flex flex-col justify-between">
                  <div className="nt-well relative aspect-square w-full overflow-hidden flex items-center justify-center p-1.5">
                    <img
                      src={img.dataUrl}
                      alt={img.file.name}
                      className="max-h-full max-w-full object-contain"
                    />
                    <span className="nt-badge-dark absolute top-1.5 left-1.5 px-1.5 py-0.5 font-mono text-[9px] font-bold">
                      #{idx + 1}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1.5 border-t border-[var(--nt-border)]">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => moveImage(idx, 'up')}
                        disabled={idx === 0}
                        className="nt-btn-secondary p-1 disabled:opacity-30"
                      >
                        <ArrowUp className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveImage(idx, 'down')}
                        disabled={idx === images.length - 1}
                        className="nt-btn-secondary p-1 disabled:opacity-30"
                      >
                        <ArrowDown className="h-3 w-3" />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeImage(img.id)}
                      className="nt-btn-secondary p-1 hover:!text-[#B91C1C]"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={handleGeneratePdf}
            disabled={isProcessing || images.length === 0}
            className="w-full flex items-center justify-center gap-2 nt-btn-yellow py-3 px-4 text-xs disabled:opacity-40"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Compiling PDF Document...</span>
              </>
            ) : (
              <span>Compile {images.length} Images to PDF</span>
            )}
          </button>

          {error && <WorkspaceAlert variant="error" message={error} />}
          {success && <WorkspaceAlert variant="success" message="PDF generated and downloaded successfully." />}
        </div>
      )}
    </div>
  );
};

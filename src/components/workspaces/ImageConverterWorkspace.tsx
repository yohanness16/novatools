import React, { useState, useRef } from 'react';
import { ImageEngine } from '../../engines/imageEngine';
import { formatBytes, downloadBlob } from '../../lib/utils';
import { WorkspaceDropzone, WorkspaceAlert } from './WorkspaceUI';
import { useHandoffFiles } from '../../lib/useHandoffFiles';
import JSZip from 'jszip';
import { Repeat, Loader2, Image as ImageIcon, Download } from 'lucide-react';

interface ConvertedFileItem {
  id: string;
  originalName: string;
  originalSize: number;
  newBlob?: Blob;
  newSize?: number;
  dataUrl?: string;
}

export const ImageConverterWorkspace: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [targetFormat, setTargetFormat] = useState<'image/webp' | 'image/png' | 'image/jpeg' | 'image/avif' | 'image/bmp' | 'image/x-icon'>('image/webp');
  const [quality, setQuality] = useState<number>(0.85);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<ConvertedFileItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useHandoffFiles((files) => {
    handleFiles(files);
  });

  const handleFiles = (fileList: FileList | File[]) => {
    setError(null);
    setResults([]);
    const valid = Array.from(fileList).filter((f) => f.type.startsWith('image/'));
    if (valid.length === 0) {
      setError('Please choose valid image files.');
      return;
    }
    setFiles(valid);
  };

  const getExtension = (mime: string) => {
    switch (mime) {
      case 'image/webp': return 'webp';
      case 'image/png': return 'png';
      case 'image/jpeg': return 'jpg';
      case 'image/avif': return 'avif';
      case 'image/bmp': return 'bmp';
      case 'image/x-icon': return 'ico';
      default: return 'png';
    }
  };

  const handleConvert = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);
    setError(null);

    try {
      const convertedItems: ConvertedFileItem[] = [];

      for (const file of files) {
        const res = await ImageEngine.processImage(file, {
          format: targetFormat,
          quality,
        });

        convertedItems.push({
          id: Math.random().toString(36).substring(2, 9),
          originalName: file.name,
          originalSize: file.size,
          newBlob: res.blob,
          newSize: res.blob.size,
          dataUrl: res.dataUrl,
        });
      }

      setResults(convertedItems);

      if (convertedItems.length === 1 && convertedItems[0].newBlob) {
        const ext = getExtension(targetFormat);
        const outName = `${files[0].name.replace(/\.[^/.]+$/, '')}.${ext}`;
        downloadBlob(convertedItems[0].newBlob, outName);
      }
    } catch (err: any) {
      setError('Conversion failed: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadZip = async () => {
    if (results.length === 0) return;
    const zip = new JSZip();
    const ext = getExtension(targetFormat);

    results.forEach((item) => {
      if (item.newBlob) {
        const baseName = item.originalName.replace(/\.[^/.]+$/, '');
        zip.file(`${baseName}.${ext}`, item.newBlob);
      }
    });

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    downloadBlob(zipBlob, `converted_images_${ext}.zip`);
  };

  return (
    <div className="w-full space-y-5">
      {files.length === 0 ? (
        <WorkspaceDropzone
          onClick={() => fileInputRef.current?.click()}
          onFilesDrop={handleFiles}
          icon={<Repeat className="h-5 w-5" />}
          title="Drop images to convert formats, or"
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
      ) : (
        <div className="nt-card p-5 space-y-5">
          <div className="flex items-center justify-between border-b border-[var(--nt-border)] pb-3">
            <span className="text-sm font-extrabold text-[#111214] dark:text-[#F3F4F6]">
              {files.length} {files.length === 1 ? 'Image Selected' : 'Images Selected'}
            </span>
            <button
              onClick={() => {
                setFiles([]);
                setResults([]);
              }}
              className="nt-btn-secondary px-3 py-1.5 font-mono text-[11px] font-semibold"
            >
              Choose different files
            </button>
          </div>

          <div className="nt-well grid grid-cols-1 sm:grid-cols-2 gap-4 p-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#111214] dark:text-[#F3F4F6] block">
                Target Output Format
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'WebP', val: 'image/webp' },
                  { label: 'PNG', val: 'image/png' },
                  { label: 'JPEG', val: 'image/jpeg' },
                  { label: 'AVIF', val: 'image/avif' },
                  { label: 'BMP', val: 'image/bmp' },
                  { label: 'ICO', val: 'image/x-icon' },
                ].map((fmt) => (
                  <button
                    key={fmt.val}
                    type="button"
                    onClick={() => setTargetFormat(fmt.val as any)}
                    className={`rounded-xl border py-1.5 text-xs font-bold transition-all cursor-pointer ${
                      targetFormat === fmt.val
                        ? 'bg-[#111214] dark:bg-[#2563EB] text-white border-[#141413] shadow-sm'
                        : 'nt-btn-secondary'
                    }`}
                  >
                    {fmt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-[#111214] dark:text-[#F3F4F6]">
                  Output Quality
                </label>
                <span className="nt-badge-yellow px-2 py-0.5 font-mono text-xs font-bold">
                  {Math.round(quality * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={quality}
                onChange={(e) => setQuality(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-white dark:bg-[#141311] rounded appearance-none cursor-pointer mt-2"
              />
              <span className="text-[10px] text-[#6B7280] dark:text-[#9CA3AF] block font-mono">
                Higher quality preserves fidelity with larger filesize.
              </span>
            </div>
          </div>

          {results.length === 0 && (
            <button
              onClick={handleConvert}
              disabled={isProcessing}
              className="w-full flex items-center justify-center gap-2 nt-btn-yellow py-3 px-4 text-xs disabled:opacity-40"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Converting Images in Memory...</span>
                </>
              ) : (
                <>
                  <Repeat className="h-4 w-4" />
                  <span>Convert {files.length} Images to {getExtension(targetFormat).toUpperCase()}</span>
                </>
              )}
            </button>
          )}

          {results.length > 0 && (
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between border-b border-[var(--nt-border)] pb-2.5">
                <span className="text-xs font-extrabold text-[#111214] dark:text-[#F3F4F6]">
                  Converted Files ({results.length})
                </span>
                {results.length > 1 && (
                  <button
                    onClick={handleDownloadZip}
                    className="nt-btn-yellow flex items-center gap-1.5 px-3.5 py-1.5 text-xs"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Download All (ZIP)</span>
                  </button>
                )}
              </div>

              <div className="nt-well p-2.5 space-y-2">
                {results.map((item) => (
                  <div
                    key={item.id}
                    className="nt-subcard flex items-center justify-between p-3"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <ImageIcon className="h-4 w-4 shrink-0 text-[#2563EB] dark:text-[#60A5FA]" />
                      <div className="truncate">
                        <span className="text-xs font-bold text-[#111214] dark:text-[#F3F4F6]">{item.originalName}</span>
                        <p className="text-[10px] text-[#6B7280] dark:text-[#9CA3AF] font-mono">
                          {formatBytes(item.originalSize)} → {item.newSize ? formatBytes(item.newSize) : '...'}
                        </p>
                      </div>
                    </div>

                    {item.newBlob && (
                      <button
                        onClick={() => {
                          const ext = getExtension(targetFormat);
                          const outName = `${item.originalName.replace(/\.[^/.]+$/, '')}.${ext}`;
                          downloadBlob(item.newBlob!, outName);
                        }}
                        className="nt-btn-secondary flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold"
                      >
                        <Download className="h-3 w-3" />
                        <span>Save</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && <WorkspaceAlert variant="error" message={error} />}
        </div>
      )}
    </div>
  );
};

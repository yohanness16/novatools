import React, { useState, useRef } from 'react';
import { ImageEngine } from '../../engines/imageEngine';
import { formatBytes, downloadBlob } from '../../lib/utils';
import JSZip from 'jszip';
import { Upload, Repeat, Archive, CheckCircle2, AlertCircle, Loader2, Image as ImageIcon, Download } from 'lucide-react';

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
    <div className="w-full space-y-4">
      {files.length === 0 ? (
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
            <Repeat className="h-5 w-5" />
          </div>
          <h3 className="mt-3 text-xs font-semibold text-[#ECEDEF]">
            Drop images to convert formats, or <span className="text-[#4F8CFF] underline">browse files</span>
          </h3>
          <p className="mt-0.5 font-mono text-[11px] text-[#8B8F98]">
            Batch convert between WebP, PNG, JPG, AVIF, and BMP formats. 100% local WASM.
          </p>
        </div>
      ) : (
        <div className="rounded border border-[#2A2D33] bg-[#131418] p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#2A2D33] pb-3">
            <span className="text-xs font-medium text-[#ECEDEF]">
              {files.length} {files.length === 1 ? 'Image Selected' : 'Images Selected'}
            </span>
            <button
              onClick={() => {
                setFiles([]);
                setResults([]);
              }}
              className="font-mono text-[11px] text-[#8B8F98] hover:text-[#ECEDEF] transition-colors"
            >
              Choose different files
            </button>
          </div>

          {/* Format and Quality Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded bg-[#1B1D22] border border-[#2A2D33] p-3.5">
            <div className="space-y-1">
              <label className="text-xs font-medium text-[#ECEDEF] block">
                Target Output Format
              </label>
              <div className="grid grid-cols-3 gap-1.5">
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
                    className={`rounded border py-1 text-xs font-medium transition-colors ${
                      targetFormat === fmt.val
                        ? 'border-[#4F8CFF] bg-[#16233F] text-[#4F8CFF]'
                        : 'border-[#2A2D33] bg-[#131418] text-[#8B8F98] hover:text-[#ECEDEF]'
                    }`}
                  >
                    {fmt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-xs font-medium text-[#ECEDEF]">
                  Output Quality
                </label>
                <span className="font-mono text-xs text-[#4F8CFF]">
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
                className="w-full accent-[#4F8CFF] h-1.5 bg-[#131418] rounded appearance-none cursor-pointer mt-2"
              />
              <span className="text-[10px] text-[#5B606D] block font-mono">
                Higher quality preserves fidelity with larger filesize.
              </span>
            </div>
          </div>

          {/* Action */}
          {results.length === 0 && (
            <div>
              <button
                onClick={handleConvert}
                disabled={isProcessing}
                className="w-full flex items-center justify-center gap-2 rounded bg-[#4F8CFF] hover:bg-[#3B79F0] py-2.5 px-4 text-xs font-semibold text-white transition-colors disabled:opacity-40"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Converting Images in Memory...</span>
                  </>
                ) : (
                  <>
                    <Repeat className="h-3.5 w-3.5" />
                    <span>Convert {files.length} Images to {getExtension(targetFormat).toUpperCase()}</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Results Gallery */}
          {results.length > 0 && (
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between border-b border-[#2A2D33] pb-2">
                <span className="text-xs font-medium text-[#ECEDEF]">
                  Converted Files ({results.length})
                </span>
                {results.length > 1 && (
                  <button
                    onClick={handleDownloadZip}
                    className="flex items-center gap-1.5 rounded bg-[#4F8CFF] hover:bg-[#3B79F0] px-3 py-1.5 text-xs font-semibold text-white transition-colors"
                  >
                    <Download className="h-3 w-3" />
                    <span>Download All (ZIP)</span>
                  </button>
                )}
              </div>

              <div className="space-y-1.5">
                {results.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded bg-[#1B1D22] border border-[#2A2D33] p-2.5"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <ImageIcon className="h-4 w-4 shrink-0 text-[#8B8F98]" />
                      <div className="truncate">
                        <span className="text-xs font-medium text-[#ECEDEF]">{item.originalName}</span>
                        <p className="text-[10px] text-[#8B8F98] font-mono">
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
                        className="flex items-center gap-1 rounded bg-[#131418] hover:bg-[#181920] border border-[#2A2D33] px-2.5 py-1 text-xs text-[#ECEDEF] transition-colors"
                      >
                        <Download className="h-3 w-3 text-[#8B8F98]" />
                        <span>Save</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 rounded bg-[#331614] border border-[#F0564B]/40 p-3 text-xs text-[#F0564B]">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

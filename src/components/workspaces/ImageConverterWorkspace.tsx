import React, { useState, useRef } from 'react';
import { ImageEngine } from '../../engines/imageEngine';
import { formatBytes, downloadBlob } from '../../lib/utils';
import JSZip from 'jszip';
import { Upload, Repeat, Archive, CheckCircle, AlertCircle, Loader2, Image as ImageIcon } from 'lucide-react';

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

      // If single file, trigger direct download
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
          <Repeat className="h-6 w-6" />
        </div>
        <h3 className="mt-4 text-sm font-semibold text-zinc-200">
          Upload Images to Convert Format
        </h3>
        <p className="mt-1 text-xs text-zinc-500">
          Convert to WebP, PNG, JPEG, AVIF, BMP, or ICO in your browser.
        </p>
      </div>

      {files.length > 0 && (
        <div className="rounded-2xl border border-surface-border bg-surface p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-surface-border pb-4">
            <span className="text-sm font-medium text-zinc-200">
              {files.length} {files.length === 1 ? 'Image Selected' : 'Images Selected'}
            </span>
            <button
              onClick={() => {
                setFiles([]);
                setResults([]);
              }}
              className="text-xs text-zinc-400 hover:text-zinc-200"
            >
              Clear Selection
            </button>
          </div>

          {/* Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Target Format
              </label>
              <select
                value={targetFormat}
                onChange={(e) => setTargetFormat(e.target.value as any)}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3.5 py-2.5 text-xs text-zinc-100 focus:border-brand-500 focus:outline-none"
              >
                <option value="image/webp">WebP (Modern & Lightweight)</option>
                <option value="image/png">PNG (Lossless Transparency)</option>
                <option value="image/jpeg">JPEG / JPG (Standard Photo)</option>
                <option value="image/avif">AVIF (Ultra High Efficiency)</option>
                <option value="image/bmp">BMP (Bitmap)</option>
                <option value="image/x-icon">ICO (Favicon)</option>
              </select>
            </div>

            {targetFormat !== 'image/png' && (
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-medium text-zinc-300">
                    Quality Preset
                  </label>
                  <span className="font-mono text-xs text-brand-400">
                    {Math.round(quality * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="1.0"
                  step="0.05"
                  value={quality}
                  onChange={(e) => setQuality(parseFloat(e.target.value))}
                  className="w-full accent-brand-500"
                />
              </div>
            )}
          </div>

          <div className="pt-2">
            <button
              onClick={handleConvert}
              disabled={isProcessing}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-brand-500 py-3 text-sm font-semibold text-white shadow-glow-sm transition-all hover:bg-brand-600 active:scale-[0.98] disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Converting in Memory...</span>
                </>
              ) : (
                <span>Convert {files.length} {files.length === 1 ? 'Image' : 'Images'}</span>
              )}
            </button>
          </div>

          {/* Results List */}
          {results.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-surface-border">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle className="h-4 w-4" />
                  Conversion Completed
                </span>
                {results.length > 1 && (
                  <button
                    onClick={handleDownloadZip}
                    className="flex items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs text-zinc-200 hover:bg-zinc-700"
                  >
                    <Archive className="h-3.5 w-3.5" />
                    Download All as ZIP
                  </button>
                )}
              </div>

              <div className="space-y-2">
                {results.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/60 p-3 text-xs"
                  >
                    <div className="flex items-center gap-3 truncate">
                      {item.dataUrl && (
                        <img
                          src={item.dataUrl}
                          alt="preview"
                          className="h-9 w-9 rounded object-cover border border-zinc-800"
                        />
                      )}
                      <div className="truncate">
                        <p className="truncate font-medium text-zinc-200">{item.originalName}</p>
                        <p className="text-zinc-500 font-mono text-[11px]">
                          {formatBytes(item.originalSize)} → <span className="text-emerald-400">{formatBytes(item.newSize || 0)}</span>
                        </p>
                      </div>
                    </div>

                    {item.newBlob && (
                      <button
                        onClick={() => {
                          const ext = getExtension(targetFormat);
                          downloadBlob(item.newBlob!, `${item.originalName.replace(/\.[^/.]+$/, '')}.${ext}`);
                        }}
                        className="rounded-lg bg-zinc-800 px-3 py-1.5 text-xs text-zinc-200 hover:bg-zinc-700"
                      >
                        Download
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

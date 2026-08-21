import React, { useState, useRef } from 'react';
import { VideoEngine } from '../../engines/videoEngine';
import { formatBytes, downloadBlob } from '../../lib/utils';
import { Upload, Music, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export const AudioExtractorWorkspace: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (selectedFile: File) => {
    if (!selectedFile.type.startsWith('video/') && !/\.(mp4|webm|mov|mkv)$/i.test(selectedFile.name)) {
      setError('Please select a valid video file.');
      return;
    }

    setError(null);
    setAudioBlob(null);
    setAudioUrl(null);
    setFile(selectedFile);
  };

  const handleExtract = async () => {
    if (!file) return;
    setIsProcessing(true);
    setError(null);

    try {
      const wav = await VideoEngine.extractAudioToWav(file);
      setAudioBlob(wav);
      setAudioUrl(URL.createObjectURL(wav));
    } catch (err: any) {
      setError('Failed to extract audio track: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      {!file ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="group relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-surface-border bg-surface/60 p-8 sm:p-12 hover:border-zinc-700 hover:bg-surface transition-all"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) handleFile(e.target.files[0]);
              e.target.value = '';
            }}
          />
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-400 group-hover:scale-105 group-hover:border-brand-500/50 group-hover:text-brand-400 transition-all">
            <Music className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-sm font-semibold text-zinc-200">
            Upload Video to Extract Audio
          </h3>
          <p className="mt-1 text-xs text-zinc-500">
            Extract high-fidelity audio streams into standalone WAV sound files.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-surface-border bg-surface p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-surface-border pb-4">
            <div>
              <span className="text-sm font-medium text-zinc-200">{file.name}</span>
              <p className="text-xs text-zinc-400 font-mono mt-0.5">
                Video Size: {formatBytes(file.size)}
              </p>
            </div>
            <button
              onClick={() => {
                setFile(null);
                setAudioBlob(null);
                setAudioUrl(null);
              }}
              className="text-xs text-zinc-400 hover:text-zinc-200"
            >
              Choose different video
            </button>
          </div>

          {/* Audio Player Preview if extracted */}
          {audioUrl && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-4 space-y-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                Audio Stream Extracted
              </span>
              <audio src={audioUrl} controls className="w-full" />
            </div>
          )}

          {/* Action */}
          <div className="pt-2">
            {!audioBlob ? (
              <button
                onClick={handleExtract}
                disabled={isProcessing}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-brand-500 py-3 text-sm font-semibold text-white shadow-glow-sm transition-all hover:bg-brand-600 active:scale-[0.98] disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Decoding Audio Stream in Memory...</span>
                  </>
                ) : (
                  <>
                    <Music className="h-4 w-4" />
                    <span>Extract Audio Track</span>
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={() => {
                  downloadBlob(audioBlob, `${file.name.replace(/\.[^/.]+$/, '')}.wav`);
                }}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3 text-sm font-semibold text-white shadow-glow-sm transition-all hover:bg-emerald-600 active:scale-[0.98]"
              >
                <CheckCircle className="h-4 w-4" />
                <span>Download Audio File ({formatBytes(audioBlob.size)})</span>
              </button>
            )}
          </div>

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

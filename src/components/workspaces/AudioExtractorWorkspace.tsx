import React, { useState, useRef, useEffect } from 'react';
import { VideoEngine, type ExtractedAudioTrack } from '../../engines/videoEngine';
import { formatBytes, formatDuration, downloadBlob } from '../../lib/utils';
import JSZip from 'jszip';
import { Music, CheckCircle, AlertCircle, Loader2, Download, Layers, Globe, Radio } from 'lucide-react';

interface ExtractedTrackWithUrl extends ExtractedAudioTrack {
  audioUrl: string;
}

export const AudioExtractorWorkspace: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [tracks, setTracks] = useState<ExtractedTrackWithUrl[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Revoke URLs on cleanup
  useEffect(() => {
    return () => {
      tracks.forEach((t) => URL.revokeObjectURL(t.audioUrl));
    };
  }, [tracks]);

  const handleFile = (selectedFile: File) => {
    if (!selectedFile.type.startsWith('video/') && !/\.(mp4|webm|mov|mkv|avi|m4v|ts)$/i.test(selectedFile.name)) {
      setError('Please select a valid video file (MP4, WebM, MOV, MKV, AVI, TS).');
      return;
    }

    // Revoke old URLs
    tracks.forEach((t) => URL.revokeObjectURL(t.audioUrl));

    setError(null);
    setTracks([]);
    setFile(selectedFile);
  };

  const handleExtractAll = async () => {
    if (!file) return;
    setIsProcessing(true);
    setError(null);

    try {
      const extracted = await VideoEngine.extractAllAudioTracks(file);
      const withUrls: ExtractedTrackWithUrl[] = extracted.map((t) => ({
        ...t,
        audioUrl: URL.createObjectURL(t.blob),
      }));
      setTracks(withUrls);
    } catch (err: any) {
      setError('Failed to extract audio tracks: ' + (err?.message || err));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadSingleTrack = (track: ExtractedTrackWithUrl) => {
    if (!file) return;
    const baseName = file.name.replace(/\.[^/.]+$/, '');
    const cleanTrackName = track.name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
    downloadBlob(track.blob, `${baseName}_${cleanTrackName}.wav`);
  };

  const handleDownloadAllZip = async () => {
    if (!file || tracks.length === 0) return;
    setIsZipping(true);

    try {
      const zip = new JSZip();
      const baseName = file.name.replace(/\.[^/.]+$/, '');

      tracks.forEach((track, index) => {
        const cleanName = `${String(index + 1).padStart(2, '0')}_${track.name.replace(/[^a-zA-Z0-9_-]/g, '_')}.wav`;
        zip.file(cleanName, track.blob);
      });

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      downloadBlob(zipBlob, `${baseName}_all_audio_tracks.zip`);
    } catch (err: any) {
      setError('Failed to create ZIP package: ' + (err?.message || err));
    } finally {
      setIsZipping(false);
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
            accept="video/*,.mp4,.webm,.mov,.mkv,.avi,.m4v,.ts"
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
            Upload Video to Extract Audio Tracks
          </h3>
          <p className="mt-1 text-xs text-zinc-500 max-w-sm text-center">
            Demuxes multi-language dubs, commentary, and original audio streams into separate lossless 16-bit WAV files.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-surface-border bg-surface p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-surface-border pb-4">
            <div>
              <span className="text-sm font-medium text-zinc-200">{file.name}</span>
              <p className="text-xs text-zinc-400 font-mono mt-0.5">
                Video File Size: {formatBytes(file.size)}
              </p>
            </div>
            <button
              onClick={() => {
                tracks.forEach((t) => URL.revokeObjectURL(t.audioUrl));
                setFile(null);
                setTracks([]);
              }}
              className="text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              Choose different video
            </button>
          </div>

          {/* Initial Extract Button */}
          {tracks.length === 0 && (
            <div className="pt-2">
              <button
                onClick={handleExtractAll}
                disabled={isProcessing}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-brand-500 py-3 text-sm font-semibold text-white shadow-glow-sm transition-all hover:bg-brand-600 active:scale-[0.98] disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Demuxing & Extracting All Audio Streams...</span>
                  </>
                ) : (
                  <>
                    <Layers className="h-4 w-4" />
                    <span>Extract All Audio Tracks & Dubs</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Extracted Audio Tracks List */}
          {tracks.length > 0 && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-surface-border pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <CheckCircle className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-zinc-100">
                      {tracks.length} {tracks.length === 1 ? 'Audio Track' : 'Audio Tracks (including Dubs)'} Extracted
                    </h4>
                    <p className="text-[11px] text-zinc-400 font-mono">
                      Duration: {formatDuration(tracks[0].duration)} · Lossless 16-bit PCM WAV
                    </p>
                  </div>
                </div>

                {tracks.length > 1 && (
                  <button
                    onClick={handleDownloadAllZip}
                    disabled={isZipping}
                    className="flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-600 active:scale-95 transition-all shadow-glow-sm"
                  >
                    {isZipping ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Creating ZIP...</span>
                      </>
                    ) : (
                      <>
                        <Download className="h-3.5 w-3.5" />
                        <span>Download All ({tracks.length} Tracks ZIP)</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Individual Track Cards */}
              <div className="space-y-3">
                {tracks.map((track, idx) => (
                  <div
                    key={track.id}
                    className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4 space-y-3 hover:border-zinc-700 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-zinc-800 font-mono text-xs font-bold text-zinc-300 border border-zinc-700">
                          {idx + 1}
                        </span>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h5 className="text-sm font-semibold text-zinc-100">
                              {track.name}
                            </h5>
                            {track.language && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-brand-500/10 px-2 py-0.5 text-[10px] font-medium text-brand-400 border border-brand-500/20">
                                <Globe className="h-2.5 w-2.5" />
                                {track.language}
                              </span>
                            )}
                            {track.codec && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] font-mono text-zinc-400 border border-zinc-700">
                                <Radio className="h-2.5 w-2.5" />
                                {track.codec}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-zinc-400 mt-0.5">
                            {track.description} · {formatBytes(track.blob.size)}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDownloadSingleTrack(track)}
                        className="self-start sm:self-auto flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:bg-zinc-700 hover:text-white transition-all active:scale-95 shrink-0"
                      >
                        <Download className="h-3.5 w-3.5" />
                        <span>Download WAV</span>
                      </button>
                    </div>

                    {/* Integrated HTML5 Audio Player for preview */}
                    <div className="pt-1">
                      <audio
                        src={track.audioUrl}
                        controls
                        className="w-full h-9 brightness-90 contrast-125"
                      />
                    </div>
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

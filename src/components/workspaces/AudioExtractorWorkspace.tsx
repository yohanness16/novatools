import React, { useState, useRef, useEffect } from 'react';
import { VideoEngine, type ExtractedAudioTrack } from '../../engines/videoEngine';
import { formatBytes, formatDuration, downloadBlob } from '../../lib/utils';
import JSZip from 'jszip';
import { Music, CheckCircle2, AlertCircle, Loader2, Download, Layers, Globe, Radio } from 'lucide-react';

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
    <div className="w-full space-y-4">
      {!file ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="group relative flex cursor-pointer flex-col items-center justify-center rounded border border-dashed border-[#2A2D33] bg-[#1B1D22] p-6 sm:p-10 hover:border-[#4F8CFF] hover:bg-[#151820] transition-colors"
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
          <div className="flex h-10 w-10 items-center justify-center rounded bg-[#131418] border border-[#2A2D33] text-[#8B8F98] group-hover:text-[#4F8CFF] group-hover:border-[#4F8CFF]/40 transition-colors">
            <Music className="h-5 w-5" />
          </div>
          <h3 className="mt-3 text-xs font-semibold text-[#ECEDEF]">
            Drop video to extract audio, or <span className="text-[#4F8CFF] underline">browse files</span>
          </h3>
          <p className="mt-0.5 font-mono text-[11px] text-[#8B8F98]">
            Demux multi-language audio streams & dubs into lossless 16-bit WAV files.
          </p>
        </div>
      ) : (
        <div className="rounded border border-[#2A2D33] bg-[#131418] p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#2A2D33] pb-3">
            <div>
              <span className="text-xs font-medium text-[#ECEDEF]">{file.name}</span>
              <p className="text-[10px] text-[#8B8F98] font-mono mt-0.5">
                Video Size: {formatBytes(file.size)}
              </p>
            </div>
            <button
              onClick={() => {
                tracks.forEach((t) => URL.revokeObjectURL(t.audioUrl));
                setFile(null);
                setTracks([]);
              }}
              className="font-mono text-[11px] text-[#8B8F98] hover:text-[#ECEDEF] transition-colors"
            >
              Choose different video
            </button>
          </div>

          {/* Initial Extract Button */}
          {tracks.length === 0 && (
            <div>
              <button
                onClick={handleExtractAll}
                disabled={isProcessing}
                className="w-full flex items-center justify-center gap-2 rounded bg-[#4F8CFF] hover:bg-[#3B79F0] py-2.5 px-4 text-xs font-semibold text-white transition-colors disabled:opacity-40"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Demuxing Audio Streams in Local Memory...</span>
                  </>
                ) : (
                  <>
                    <Layers className="h-3.5 w-3.5" />
                    <span>Extract All Audio Tracks & Dubs</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Extracted Audio Tracks List */}
          {tracks.length > 0 && (
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#2A2D33] pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="flex h-5 w-5 items-center justify-center rounded bg-[#122D1F] text-[#3FBE73] border border-[#3FBE73]/30">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-[#ECEDEF]">
                      {tracks.length} {tracks.length === 1 ? 'Audio Track' : 'Audio Tracks'} Extracted
                    </h4>
                    <p className="text-[10px] text-[#8B8F98] font-mono">
                      Duration: {formatDuration(tracks[0].duration)} · Lossless 16-bit PCM WAV
                    </p>
                  </div>
                </div>

                {tracks.length > 1 && (
                  <button
                    onClick={handleDownloadAllZip}
                    disabled={isZipping}
                    className="flex items-center gap-1.5 rounded bg-[#4F8CFF] hover:bg-[#3B79F0] px-3 py-1.5 text-xs font-semibold text-white transition-colors"
                  >
                    {isZipping ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin" />
                        <span>Creating ZIP...</span>
                      </>
                    ) : (
                      <>
                        <Download className="h-3 w-3" />
                        <span>Download All ZIP</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Individual Track Cards */}
              <div className="space-y-2">
                {tracks.map((track, idx) => (
                  <div
                    key={track.id}
                    className="rounded bg-[#1B1D22] border border-[#2A2D33] p-3 space-y-2"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-[#131418] font-mono text-[10px] text-[#8B8F98] border border-[#2A2D33]">
                          {idx + 1}
                        </span>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-semibold text-[#ECEDEF]">
                              {track.name}
                            </span>
                            {track.language && (
                              <span className="inline-flex items-center gap-1 rounded bg-[#16233F] px-1.5 py-0.5 text-[10px] font-mono text-[#4F8CFF] border border-[#4F8CFF]/20">
                                <Globe className="h-2.5 w-2.5" />
                                {track.language}
                              </span>
                            )}
                            {track.codec && (
                              <span className="inline-flex items-center gap-1 rounded bg-[#131418] px-1.5 py-0.5 text-[10px] font-mono text-[#8B8F98] border border-[#2A2D33]">
                                <Radio className="h-2.5 w-2.5" />
                                {track.codec}
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-[#8B8F98] font-mono mt-0.5">
                            {track.description} · {formatBytes(track.blob.size)}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDownloadSingleTrack(track)}
                        className="self-start sm:self-auto flex items-center gap-1 rounded bg-[#131418] hover:bg-[#181920] border border-[#2A2D33] px-2.5 py-1 text-xs font-medium text-[#ECEDEF] transition-colors"
                      >
                        <Download className="h-3 w-3 text-[#8B8F98]" />
                        <span>Download WAV</span>
                      </button>
                    </div>

                    <div className="pt-0.5">
                      <audio
                        src={track.audioUrl}
                        controls
                        className="w-full h-8"
                      />
                    </div>
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

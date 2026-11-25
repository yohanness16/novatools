import React, { useState, useRef, useEffect } from 'react';
import { VideoEngine, type ExtractedAudioTrack } from '../../engines/videoEngine';
import { formatBytes, formatDuration, downloadBlob } from '../../lib/utils';
import { AudioVisualizerScreen } from './AudioVisualizerScreen';
import { WorkspaceDropzone, WorkspaceAlert } from './WorkspaceUI';
import JSZip from 'jszip';
import { Music, CheckCircle2, Loader2, Download, Layers, Globe, Radio, Play, Pause, Activity } from 'lucide-react';

interface ExtractedTrackWithUrl extends ExtractedAudioTrack {
  audioUrl: string;
}

export const AudioExtractorWorkspace: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [tracks, setTracks] = useState<ExtractedTrackWithUrl[]>([]);
  const [selectedTrackIndex, setSelectedTrackIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

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
    setIsPlaying(false);
    setSelectedTrackIndex(0);
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
      setSelectedTrackIndex(0);
      setIsPlaying(false);
    } catch (err: any) {
      setError('Failed to extract audio tracks: ' + (err?.message || err));
    } finally {
      setIsProcessing(false);
    }
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch((e) => console.debug('Audio play failed:', e));
    }
  };

  const handleSelectTrack = (index: number) => {
    setSelectedTrackIndex(index);
    setIsPlaying(false);
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

  const currentActiveTrack = tracks[selectedTrackIndex];

  return (
    <div className="w-full space-y-5">
      {!file ? (
        <WorkspaceDropzone
          onClick={() => fileInputRef.current?.click()}
          onFilesDrop={(files) => files[0] && handleFile(files[0])}
          icon={<Music className="h-5 w-5" />}
          title="Drop video to extract audio, or"
          subtitle="Demux multi-language audio streams & dubs into lossless 16-bit WAV files."
          badgeText="100% Local Processing"
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
        </WorkspaceDropzone>
      ) : (
        <div className="nt-card p-5 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--nt-border)] pb-3">
            <div>
              <span className="text-sm font-extrabold text-[#141413] dark:text-[#FAF7F0]">{file.name}</span>
              <p className="text-xs text-[#746D61] dark:text-[#938B7D] font-mono mt-0.5">
                Video Size: {formatBytes(file.size)}
              </p>
            </div>
            <button
              onClick={() => {
                tracks.forEach((t) => URL.revokeObjectURL(t.audioUrl));
                setFile(null);
                setTracks([]);
                setIsPlaying(false);
              }}
              className="nt-btn-secondary px-3 py-1.5 font-mono text-[11px] font-semibold"
            >
              Choose different video
            </button>
          </div>

          {tracks.length === 0 && (
            <button
              onClick={handleExtractAll}
              disabled={isProcessing}
              className="w-full flex items-center justify-center gap-2 nt-btn-yellow py-3 px-4 text-xs disabled:opacity-40"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Demuxing Audio Streams in Local Memory...</span>
                </>
              ) : (
                <>
                  <Layers className="h-4 w-4" />
                  <span>Extract All Audio Tracks & Dubs</span>
                </>
              )}
            </button>
          )}

          {tracks.length > 0 && currentActiveTrack && (
            <div className="space-y-4">
              <audio
                ref={audioRef}
                src={currentActiveTrack.audioUrl}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onEnded={() => setIsPlaying(false)}
                className="hidden"
              />

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-[#141413] dark:text-[#FAF7F0] flex items-center gap-1.5 font-mono">
                    <Activity className="h-3.5 w-3.5 text-[#CA8A04] dark:text-[#FACC15]" />
                    <span>Live Waveform & Track Monitor</span>
                  </label>
                  <span className="text-[11px] font-mono text-[#746D61] dark:text-[#938B7D]">
                    Track {selectedTrackIndex + 1} of {tracks.length}
                  </span>
                </div>

                <AudioVisualizerScreen
                  audioElement={audioRef.current}
                  isPlaying={isPlaying}
                  onTogglePlay={togglePlay}
                  sourceLabel={`${currentActiveTrack.name} (${currentActiveTrack.language || 'Default'})`}
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--nt-border)] pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="nt-badge-success flex h-6 w-6 items-center justify-center">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-[#141413] dark:text-[#FAF7F0]">
                      {tracks.length} {tracks.length === 1 ? 'Audio Track' : 'Audio Tracks'} Extracted
                    </h4>
                    <p className="text-[11px] text-[#746D61] dark:text-[#938B7D] font-mono">
                      Duration: {formatDuration(tracks[0].duration)} · Lossless 16-bit PCM WAV
                    </p>
                  </div>
                </div>

                {tracks.length > 1 && (
                  <button
                    onClick={handleDownloadAllZip}
                    disabled={isZipping}
                    className="nt-btn-yellow flex items-center gap-1.5 px-3.5 py-2 text-xs"
                  >
                    {isZipping ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Creating ZIP...</span>
                      </>
                    ) : (
                      <>
                        <Download className="h-3.5 w-3.5" />
                        <span>Download All ZIP</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              <div className="nt-well p-2.5 space-y-2">
                {tracks.map((track, idx) => {
                  const isSelected = idx === selectedTrackIndex;
                  return (
                    <div
                      key={track.id}
                      onClick={() => handleSelectTrack(idx)}
                      className={`nt-card p-3.5 cursor-pointer transition-all ${
                        isSelected
                          ? '!border-[#141413] dark:!border-[#FACC15] !bg-[#FEF7D6] dark:!bg-[#FACC15]/10'
                          : ''
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (isSelected) {
                                togglePlay();
                              } else {
                                handleSelectTrack(idx);
                                setTimeout(() => {
                                  audioRef.current?.play().catch(() => {});
                                }, 50);
                              }
                            }}
                            className={`flex h-8 w-8 items-center justify-center rounded-xl transition-all cursor-pointer ${
                              isSelected && isPlaying
                                ? 'bg-[#15803D] text-white'
                                : 'bg-[#141413] text-[#FACC15]'
                            }`}
                            title={isSelected && isPlaying ? 'Pause track' : 'Play & Monitor track'}
                          >
                            {isSelected && isPlaying ? (
                              <Pause className="h-3.5 w-3.5" />
                            ) : (
                              <Play className="h-3.5 w-3.5 ml-0.5" />
                            )}
                          </button>

                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-extrabold text-[#141413] dark:text-[#FAF7F0]">
                                {track.name}
                              </span>
                              {track.language && (
                                <span className="nt-badge-yellow inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono font-bold">
                                  <Globe className="h-2.5 w-2.5" />
                                  {track.language}
                                </span>
                              )}
                              {track.codec && (
                                <span className="rounded-md bg-[#EAE3D4] dark:bg-[#141311] px-1.5 py-0.5 text-[10px] font-mono text-[#454038] dark:text-[#CBC4B6] border border-[var(--nt-border)] inline-flex items-center gap-1">
                                  <Radio className="h-2.5 w-2.5" />
                                  {track.codec}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-[#746D61] dark:text-[#938B7D] font-mono mt-0.5">
                              {track.description} · {formatBytes(track.blob.size)}
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownloadSingleTrack(track);
                          }}
                          className="nt-btn-secondary self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold"
                        >
                          <Download className="h-3.5 w-3.5" />
                          <span>Download WAV</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {error && <WorkspaceAlert variant="error" message={error} />}
        </div>
      )}
    </div>
  );
};

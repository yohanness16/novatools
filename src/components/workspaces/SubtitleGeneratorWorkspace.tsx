import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  SubtitleEngine,
  type SubtitleCue,
  type TranscriptionProgress,
  cuesToSrt,
  cuesToVtt,
  cuesToTxt,
  cuesToJson,
  parseSrt,
  parseVtt,
  formatTimeVtt,
} from '../../engines/subtitleEngine';
import { formatBytes, formatDuration, downloadBlob } from '../../lib/utils';
import JSZip from 'jszip';
import {
  Subtitles,
  Upload,
  Play,
  Pause,
  Plus,
  Trash2,
  Download,
  Copy,
  Check,
  Search,
  RotateCcw,
  Sparkles,
  Loader2,
  AlertCircle,
  FileText,
  Clock,
  Globe,
  Settings2,
  Volume2,
  Eye,
} from 'lucide-react';

const SUPPORTED_LANGUAGES = [
  { code: 'auto', label: 'Auto-Detect Language' },
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Spanish (Español)' },
  { code: 'fr', label: 'French (Français)' },
  { code: 'de', label: 'German (Deutsch)' },
  { code: 'ja', label: 'Japanese (日本語)' },
  { code: 'zh', label: 'Chinese (中文)' },
  { code: 'pt', label: 'Portuguese (Português)' },
  { code: 'it', label: 'Italian (Italiano)' },
  { code: 'ru', label: 'Russian (Русский)' },
  { code: 'ar', label: 'Arabic (العربية)' },
  { code: 'hi', label: 'Hindi (हिन्दी)' },
  { code: 'ko', label: 'Korean (한국어)' },
  { code: 'tr', label: 'Turkish (Türkçe)' },
  { code: 'nl', label: 'Dutch (Nederlands)' },
  { code: 'pl', label: 'Polish (Polski)' },
  { code: 'id', label: 'Indonesian (Bahasa)' },
  { code: 'vi', label: 'Vietnamese (Tiếng Việt)' },
];

export const SubtitleGeneratorWorkspace: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [isVideo, setIsVideo] = useState(true);

  const [language, setLanguage] = useState<string>('auto');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressInfo, setProgressInfo] = useState<TranscriptionProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [cues, setCues] = useState<SubtitleCue[]>([]);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showSubtitleOverlay, setShowSubtitleOverlay] = useState<boolean>(true);

  const mediaRef = useRef<HTMLVideoElement | HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cueListRef = useRef<HTMLDivElement>(null);

  // Clean up object URLs
  useEffect(() => {
    return () => {
      if (mediaUrl) URL.revokeObjectURL(mediaUrl);
    };
  }, [mediaUrl]);

  const handleFile = async (selectedFile: File) => {
    setError(null);
    setCues([]);

    // Check if user uploaded a subtitle file directly
    if (selectedFile.name.endsWith('.srt') || selectedFile.name.endsWith('.vtt')) {
      try {
        const text = await selectedFile.text();
        const parsed = selectedFile.name.endsWith('.srt') ? parseSrt(text) : parseVtt(text);
        if (parsed.length === 0) {
          setError('No subtitle cues found in this file.');
          return;
        }
        setCues(parsed);
        setFile(selectedFile);
        setIsVideo(false);
        return;
      } catch (err: any) {
        setError('Failed to parse subtitle file: ' + err.message);
        return;
      }
    }

    const isVid = selectedFile.type.startsWith('video/') || /\.(mp4|webm|mov|mkv|avi|m4v|ts)$/i.test(selectedFile.name);
    const isAud = selectedFile.type.startsWith('audio/') || /\.(mp3|wav|m4a|aac|ogg|flac|webm)$/i.test(selectedFile.name);

    if (!isVid && !isAud) {
      setError('Please select a valid video (MP4, WebM, MOV, MKV) or audio (MP3, WAV, M4A) file, or .srt/.vtt file.');
      return;
    }

    if (mediaUrl) URL.revokeObjectURL(mediaUrl);
    const url = URL.createObjectURL(selectedFile);
    setMediaUrl(url);
    setIsVideo(isVid);
    setFile(selectedFile);
  };

  const handleGenerate = async () => {
    if (!file) return;
    setIsProcessing(true);
    setError(null);
    setProgressInfo({
      status: 'decoding',
      progress: 5,
      message: 'Preparing audio stream...',
    });

    try {
      const generated = await SubtitleEngine.generateSubtitles(
        file,
        {
          language,
          maxCharsPerCue: 75,
        },
        (progress) => {
          setProgressInfo(progress);
        }
      );
      setCues(generated);
    } catch (err: any) {
      setError('Transcription failed: ' + (err?.message || err));
    } finally {
      setIsProcessing(false);
    }
  };

  const activeCue = useMemo(() => {
    return cues.find((c) => currentTime >= c.start && currentTime <= c.end);
  }, [cues, currentTime]);

  const filteredCues = useMemo(() => {
    if (!searchQuery.trim()) return cues;
    const q = searchQuery.toLowerCase();
    return cues.filter((c) => c.text.toLowerCase().includes(q));
  }, [cues, searchQuery]);

  const handleTimeUpdate = () => {
    if (mediaRef.current) {
      setCurrentTime(mediaRef.current.currentTime);
    }
  };

  const handleSeek = (time: number) => {
    if (mediaRef.current) {
      mediaRef.current.currentTime = Math.max(0, Math.min(time, duration));
      if (!isPlaying) {
        mediaRef.current.play().catch(() => {});
        setIsPlaying(true);
      }
    }
  };

  const togglePlay = () => {
    if (!mediaRef.current) return;
    if (isPlaying) {
      mediaRef.current.pause();
      setIsPlaying(false);
    } else {
      mediaRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const updateCueText = (id: string, text: string) => {
    setCues((prev) => prev.map((c) => (c.id === id ? { ...c, text } : c)));
  };

  const updateCueTimes = (id: string, deltaStart: number, deltaEnd: number) => {
    setCues((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const newStart = Math.max(0, Number((c.start + deltaStart).toFixed(2)));
        const newEnd = Math.max(newStart + 0.1, Number((c.end + deltaEnd).toFixed(2)));
        return { ...c, start: newStart, end: newEnd };
      })
    );
  };

  const addCue = (afterIndex: number) => {
    const prevCue = cues[afterIndex];
    const newStart = prevCue ? Number((prevCue.end + 0.1).toFixed(2)) : 0;
    const newEnd = Number((newStart + 2.5).toFixed(2));
    const newCue: SubtitleCue = {
      id: Math.random().toString(36).substring(2, 9),
      start: newStart,
      end: newEnd,
      text: 'New subtitle cue...',
    };

    const nextCues = [...cues];
    nextCues.splice(afterIndex + 1, 0, newCue);
    setCues(nextCues);
  };

  const deleteCue = (id: string) => {
    setCues((prev) => prev.filter((c) => c.id !== id));
  };

  const handleDownload = (format: 'srt' | 'vtt' | 'txt' | 'json') => {
    if (!file || cues.length === 0) return;
    const baseName = file.name.replace(/\.[^/.]+$/, '');

    let content = '';
    let mimeType = 'text/plain';
    let ext = format;

    switch (format) {
      case 'srt':
        content = cuesToSrt(cues);
        mimeType = 'application/x-subrip';
        break;
      case 'vtt':
        content = cuesToVtt(cues);
        mimeType = 'text/vtt';
        break;
      case 'txt':
        content = cuesToTxt(cues, false);
        break;
      case 'json':
        content = cuesToJson(cues);
        mimeType = 'application/json';
        break;
    }

    const blob = new Blob([content], { type: mimeType });
    downloadBlob(blob, `${baseName}.${ext}`);
  };

  const handleDownloadZip = async () => {
    if (!file || cues.length === 0) return;
    const baseName = file.name.replace(/\.[^/.]+$/, '');
    const zip = new JSZip();

    zip.file(`${baseName}.srt`, cuesToSrt(cues));
    zip.file(`${baseName}.vtt`, cuesToVtt(cues));
    zip.file(`${baseName}.txt`, cuesToTxt(cues, false));
    zip.file(`${baseName}.json`, cuesToJson(cues));

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    downloadBlob(zipBlob, `${baseName}_all_subtitles.zip`);
  };

  const handleCopyClipboard = async (format: 'srt' | 'vtt' | 'txt') => {
    let text = '';
    if (format === 'srt') text = cuesToSrt(cues);
    else if (format === 'vtt') text = cuesToVtt(cues);
    else text = cuesToTxt(cues, false);

    await navigator.clipboard.writeText(text);
    setCopiedFormat(format);
    setTimeout(() => setCopiedFormat(null), 2000);
  };

  return (
    <div className="w-full space-y-6">
      {!file ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="group relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-surface-border bg-surface/60 p-8 sm:p-14 hover:border-zinc-700 hover:bg-surface transition-all"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*,audio/*,.mp4,.webm,.mov,.mkv,.mp3,.wav,.m4a,.ogg,.flac,.srt,.vtt"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) handleFile(e.target.files[0]);
              e.target.value = '';
            }}
          />
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-400 group-hover:scale-105 group-hover:border-brand-500/50 group-hover:text-brand-400 transition-all shadow-lg">
            <Subtitles className="h-7 w-7" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-zinc-200">
            Upload Video or Audio to Generate Subtitles
          </h3>
          <p className="mt-1 text-xs text-zinc-400 max-w-md text-center">
            Supports MP4, WebM, MKV, MOV, MP3, WAV, M4A, or import existing .SRT / .VTT files. 100% in-browser AI transcription with zero server uploads.
          </p>
          <div className="mt-4 flex items-center gap-2 text-[11px] font-mono text-zinc-500 bg-zinc-900/80 px-3 py-1.5 rounded-full border border-zinc-800">
            <Sparkles className="h-3.5 w-3.5 text-brand-400" />
            <span>OpenAI Whisper AI (WebAssembly) · 100+ Languages</span>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-surface-border bg-surface p-4 sm:p-6 space-y-6">
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-surface-border pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-zinc-200">{file.name}</span>
                <span className="rounded-md bg-zinc-800 px-2 py-0.5 text-[10px] font-mono text-zinc-400 border border-zinc-700">
                  {formatBytes(file.size)}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                {cues.length > 0
                  ? `${cues.length} Subtitle Cues Generated`
                  : 'Ready to generate AI subtitles'}
              </p>
            </div>

            <button
              onClick={() => {
                if (mediaUrl) URL.revokeObjectURL(mediaUrl);
                setFile(null);
                setMediaUrl(null);
                setCues([]);
              }}
              className="text-xs text-zinc-400 hover:text-zinc-200 self-start sm:self-auto transition-colors"
            >
              Choose different file
            </button>
          </div>

          {/* Initial Controls / Transcribe Button */}
          {cues.length === 0 && (
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-zinc-300 flex items-center gap-1.5 mb-1.5">
                    <Globe className="h-3.5 w-3.5 text-brand-400" />
                    Audio Spoken Language
                  </label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    disabled={isProcessing}
                    className="w-full rounded-xl border border-surface-border bg-zinc-900/90 px-3 py-2.5 text-xs text-zinc-200 focus:border-brand-500 focus:outline-none transition-colors"
                  >
                    {SUPPORTED_LANGUAGES.map((lang) => (
                      <option key={lang.code} value={lang.code}>
                        {lang.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col justify-end">
                  <button
                    onClick={handleGenerate}
                    disabled={isProcessing}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-brand-500 py-2.5 px-4 text-xs font-semibold text-white shadow-glow-sm hover:bg-brand-600 active:scale-[0.98] transition-all disabled:opacity-50"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Transcribing in Browser...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        <span>Generate AI Subtitles</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Progress Box */}
              {isProcessing && progressInfo && (
                <div className="rounded-xl border border-brand-500/30 bg-brand-500/10 p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-zinc-200 flex items-center gap-2">
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-brand-400" />
                      {progressInfo.message}
                    </span>
                    <span className="font-mono text-brand-400 font-bold">{progressInfo.progress}%</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
                    <div
                      className="h-full bg-brand-500 transition-all duration-300 rounded-full"
                      style={{ width: `${progressInfo.progress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Subtitle Studio Layout */}
          {cues.length > 0 && (
            <div className="space-y-6">
              {/* Studio Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Media Player Column (5 Cols) */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="relative rounded-xl overflow-hidden bg-black border border-zinc-800 aspect-video flex items-center justify-center">
                    {isVideo && mediaUrl ? (
                      <video
                        ref={mediaRef as any}
                        src={mediaUrl}
                        onTimeUpdate={handleTimeUpdate}
                        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
                        onPlay={() => setIsPlaying(true)}
                        onPause={() => setIsPlaying(false)}
                        className="w-full h-full object-contain"
                      />
                    ) : mediaUrl ? (
                      <div className="flex flex-col items-center justify-center p-6 text-center space-y-3">
                        <Volume2 className="h-12 w-12 text-brand-400 animate-pulse" />
                        <audio
                          ref={mediaRef as any}
                          src={mediaUrl}
                          onTimeUpdate={handleTimeUpdate}
                          onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
                          onPlay={() => setIsPlaying(true)}
                          onPause={() => setIsPlaying(false)}
                        />
                        <span className="text-xs text-zinc-400 font-mono">Audio Playback Stream</span>
                      </div>
                    ) : (
                      <div className="text-zinc-600 text-xs font-mono">No Media Loaded</div>
                    )}

                    {/* Live Subtitle Overlay */}
                    {showSubtitleOverlay && activeCue && (
                      <div className="absolute bottom-4 inset-x-4 flex justify-center pointer-events-none">
                        <span className="rounded-lg bg-black/85 px-3 py-1.5 text-center text-xs sm:text-sm font-semibold text-white shadow-lg backdrop-blur-sm border border-white/10 max-w-[90%] leading-relaxed">
                          {activeCue.text}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Playback Controls Bar */}
                  <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={togglePlay}
                          className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 text-white hover:bg-brand-600 active:scale-95 transition-all"
                        >
                          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
                        </button>
                        <span className="text-xs font-mono text-zinc-300">
                          {formatTimeVtt(currentTime)} / {formatTimeVtt(duration)}
                        </span>
                      </div>

                      <button
                        onClick={() => setShowSubtitleOverlay(!showSubtitleOverlay)}
                        className={`flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-md border transition-colors ${
                          showSubtitleOverlay
                            ? 'bg-brand-500/10 border-brand-500/30 text-brand-400'
                            : 'bg-zinc-800 border-zinc-700 text-zinc-400'
                        }`}
                      >
                        <Eye className="h-3 w-3" />
                        <span>Overlay {showSubtitleOverlay ? 'ON' : 'OFF'}</span>
                      </button>
                    </div>

                    <input
                      type="range"
                      min={0}
                      max={duration || 1}
                      step={0.05}
                      value={currentTime}
                      onChange={(e) => handleSeek(parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-brand-500"
                    />
                  </div>
                </div>

                {/* Subtitle Cue List & Editor (7 Cols) */}
                <div className="lg:col-span-7 space-y-3">
                  {/* Editor Toolbar */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="relative flex-1 min-w-[180px]">
                      <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-500" />
                      <input
                        type="text"
                        placeholder="Search transcript..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full rounded-lg border border-zinc-800 bg-zinc-900/90 pl-8 pr-3 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-500 focus:border-brand-500 focus:outline-none"
                      />
                    </div>

                    <button
                      onClick={() => addCue(cues.length - 1)}
                      className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:bg-zinc-700 hover:text-white transition-all active:scale-95 shrink-0"
                    >
                      <Plus className="h-3.5 w-3.5 text-brand-400" />
                      <span>Add Cue</span>
                    </button>
                  </div>

                  {/* Scrollable Cue Cards */}
                  <div
                    ref={cueListRef}
                    className="max-h-[480px] overflow-y-auto space-y-2.5 pr-1 focus:outline-none custom-scrollbar"
                  >
                    {filteredCues.map((cue, idx) => {
                      const isActive = currentTime >= cue.start && currentTime <= cue.end;

                      return (
                        <div
                          key={cue.id}
                          className={`rounded-xl border p-3 transition-all space-y-2 ${
                            isActive
                              ? 'border-brand-500/60 bg-brand-500/10 shadow-glow-sm'
                              : 'border-zinc-800/80 bg-zinc-900/60 hover:border-zinc-700'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            {/* Cue Index & Jump Button */}
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleSeek(cue.start)}
                                className={`flex h-5 w-5 items-center justify-center rounded-md text-[10px] font-bold font-mono transition-all ${
                                  isActive
                                    ? 'bg-brand-500 text-white'
                                    : 'bg-zinc-800 text-zinc-400 hover:bg-brand-500 hover:text-white'
                                }`}
                              >
                                {idx + 1}
                              </button>

                              {/* Timestamp Controls */}
                              <div className="flex items-center gap-1 font-mono text-[11px] text-zinc-400">
                                <button
                                  onClick={() => updateCueTimes(cue.id, -0.1, 0)}
                                  className="px-1 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px]"
                                  title="Nudge start -0.1s"
                                >
                                  -
                                </button>
                                <span className="font-semibold text-zinc-200">{formatTimeVtt(cue.start)}</span>
                                <button
                                  onClick={() => updateCueTimes(cue.id, 0.1, 0)}
                                  className="px-1 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px]"
                                  title="Nudge start +0.1s"
                                >
                                  +
                                </button>

                                <span className="mx-1 text-zinc-600">→</span>

                                <button
                                  onClick={() => updateCueTimes(cue.id, 0, -0.1)}
                                  className="px-1 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px]"
                                  title="Nudge end -0.1s"
                                >
                                  -
                                </button>
                                <span className="font-semibold text-zinc-200">{formatTimeVtt(cue.end)}</span>
                                <button
                                  onClick={() => updateCueTimes(cue.id, 0, 0.1)}
                                  className="px-1 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px]"
                                  title="Nudge end +0.1s"
                                >
                                  +
                                </button>
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => addCue(idx)}
                                className="p-1 rounded-md text-zinc-500 hover:text-brand-400 hover:bg-zinc-800 transition-colors"
                                title="Insert cue below"
                              >
                                <Plus className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => deleteCue(cue.id)}
                                className="p-1 rounded-md text-zinc-500 hover:text-red-400 hover:bg-zinc-800 transition-colors"
                                title="Delete cue"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Editable Cue Text */}
                          <textarea
                            value={cue.text}
                            rows={2}
                            onChange={(e) => updateCueText(cue.id, e.target.value)}
                            className="w-full resize-none rounded-lg border border-zinc-800/80 bg-zinc-950/60 p-2 text-xs text-zinc-100 placeholder:text-zinc-600 focus:border-brand-500 focus:outline-none leading-relaxed transition-colors"
                          />
                        </div>
                      );
                    })}

                    {filteredCues.length === 0 && (
                      <div className="text-center py-8 text-xs text-zinc-500">
                        No subtitle cues match "{searchQuery}"
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Export Actions Footer */}
              <div className="rounded-xl border border-surface-border bg-zinc-900/60 p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h5 className="text-xs font-semibold text-zinc-200">Export Subtitles</h5>
                    <p className="text-[11px] text-zinc-400">Download formatted subtitle files or copy text</p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => handleDownload('srt')}
                      className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-semibold text-zinc-200 hover:bg-zinc-700 hover:text-white active:scale-95 transition-all"
                    >
                      <Download className="h-3.5 w-3.5 text-brand-400" />
                      <span>Download .SRT</span>
                    </button>

                    <button
                      onClick={() => handleDownload('vtt')}
                      className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-semibold text-zinc-200 hover:bg-zinc-700 hover:text-white active:scale-95 transition-all"
                    >
                      <Download className="h-3.5 w-3.5 text-brand-400" />
                      <span>Download .VTT</span>
                    </button>

                    <button
                      onClick={() => handleDownload('txt')}
                      className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-semibold text-zinc-200 hover:bg-zinc-700 hover:text-white active:scale-95 transition-all"
                    >
                      <FileText className="h-3.5 w-3.5 text-zinc-400" />
                      <span>Download .TXT</span>
                    </button>

                    <button
                      onClick={handleDownloadZip}
                      className="flex items-center gap-1.5 rounded-lg bg-brand-500 px-3.5 py-1.5 text-xs font-semibold text-white shadow-glow-sm hover:bg-brand-600 active:scale-95 transition-all"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Download All (ZIP)</span>
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-zinc-800/80 text-[11px] text-zinc-400">
                  <span>Quick Copy:</span>
                  <button
                    onClick={() => handleCopyClipboard('srt')}
                    className="text-brand-400 hover:underline flex items-center gap-1"
                  >
                    {copiedFormat === 'srt' ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                    SRT
                  </button>
                  <span>·</span>
                  <button
                    onClick={() => handleCopyClipboard('vtt')}
                    className="text-brand-400 hover:underline flex items-center gap-1"
                  >
                    {copiedFormat === 'vtt' ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                    WebVTT
                  </button>
                  <span>·</span>
                  <button
                    onClick={() => handleCopyClipboard('txt')}
                    className="text-brand-400 hover:underline flex items-center gap-1"
                  >
                    {copiedFormat === 'txt' ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                    Plain Text
                  </button>
                </div>
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

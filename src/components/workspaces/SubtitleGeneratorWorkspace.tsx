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
import {
  TranslationEngine,
  type TranslationProgress,
} from '../../engines/translationEngine';
import {
  SUPPORTED_LANGUAGES,
  type LanguageOption,
  getLanguageByCode,
  searchLanguages,
  POPULAR_LANGUAGES,
  AFRICAN_LANGUAGES,
} from '../../lib/languages';
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
  Languages,
  Volume2,
  Eye,
  ChevronDown,
  X,
  Layers,
  ArrowRight,
} from 'lucide-react';

interface SubtitleTrackData {
  code: string;
  name: string;
  nativeName: string;
  cues: SubtitleCue[];
}

export const SubtitleGeneratorWorkspace: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [isVideo, setIsVideo] = useState(true);

  // Audio Speech Recognition Settings
  const [selectedLanguage, setSelectedLanguage] = useState<string>('auto');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressInfo, setProgressInfo] = useState<TranscriptionProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Multilingual Subtitle Tracks
  const [tracks, setTracks] = useState<Record<string, SubtitleTrackData>>({});
  const [activeTrackLang, setActiveTrackLang] = useState<string>('original');

  // Translation Modal & Progress State
  const [isTranslateModalOpen, setIsTranslateModalOpen] = useState(false);
  const [targetTranslateLang, setTargetTranslateLang] = useState<string>('am'); // Default Amharic
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationProgress, setTranslationProgress] = useState<TranslationProgress | null>(null);

  // Searchable Language Picker Modal/Popover State
  const [isLangPickerOpen, setIsLangPickerOpen] = useState(false);
  const [langPickerMode, setLangPickerMode] = useState<'transcribe' | 'translate'>('transcribe');
  const [langSearchQuery, setLangSearchQuery] = useState('');
  const [langRegionFilter, setLangRegionFilter] = useState<string>('all');

  // Player & Editor State
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

  // Current active cues from the selected track
  const currentCues: SubtitleCue[] = useMemo(() => {
    return tracks[activeTrackLang]?.cues || [];
  }, [tracks, activeTrackLang]);

  const handleFile = async (selectedFile: File) => {
    setError(null);
    setTracks({});
    setActiveTrackLang('original');

    // Check if user uploaded a subtitle file directly
    if (selectedFile.name.endsWith('.srt') || selectedFile.name.endsWith('.vtt')) {
      try {
        const text = await selectedFile.text();
        const parsed = selectedFile.name.endsWith('.srt') ? parseSrt(text) : parseVtt(text);
        if (parsed.length === 0) {
          setError('No subtitle cues found in this file.');
          return;
        }
        setTracks({
          original: {
            code: 'original',
            name: 'Original Subtitles',
            nativeName: 'Original',
            cues: parsed,
          },
        });
        setActiveTrackLang('original');
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
          language: selectedLanguage,
          maxCharsPerCue: 75,
        },
        (progress) => {
          setProgressInfo(progress);
        }
      );

      const langMeta = getLanguageByCode(selectedLanguage);
      const trackCode = selectedLanguage === 'auto' ? 'original' : selectedLanguage;
      const trackName = langMeta ? `${langMeta.name} (${langMeta.nativeName})` : 'Original Speech';

      setTracks({
        [trackCode]: {
          code: trackCode,
          name: trackName,
          nativeName: langMeta?.nativeName || 'Original',
          cues: generated,
        },
      });
      setActiveTrackLang(trackCode);
    } catch (err: any) {
      setError('Transcription failed: ' + (err?.message || err));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTranslateSubtitles = async () => {
    if (currentCues.length === 0 || !targetTranslateLang) return;
    setIsTranslating(true);
    setError(null);

    const targetLangMeta = getLanguageByCode(targetTranslateLang);
    const targetName = targetLangMeta ? `${targetLangMeta.name} (${targetLangMeta.nativeName})` : targetTranslateLang;

    try {
      const sourceCode = activeTrackLang === 'original' ? 'auto' : activeTrackLang;
      const translated = await TranslationEngine.translateSubtitleCues(
        currentCues,
        targetTranslateLang,
        sourceCode,
        (progress) => {
          setTranslationProgress(progress);
        }
      );

      // Save as new track
      setTracks((prev) => ({
        ...prev,
        [targetTranslateLang]: {
          code: targetTranslateLang,
          name: targetName,
          nativeName: targetLangMeta?.nativeName || targetTranslateLang,
          cues: translated,
        },
      }));

      // Switch to new track
      setActiveTrackLang(targetTranslateLang);
      setIsTranslateModalOpen(false);
    } catch (err: any) {
      setError('Translation failed: ' + (err?.message || err));
    } finally {
      setIsTranslating(false);
      setTranslationProgress(null);
    }
  };

  const activeCue = useMemo(() => {
    return currentCues.find((c) => currentTime >= c.start && currentTime <= c.end);
  }, [currentCues, currentTime]);

  const filteredCues = useMemo(() => {
    if (!searchQuery.trim()) return currentCues;
    const q = searchQuery.toLowerCase();
    return currentCues.filter((c) => c.text.toLowerCase().includes(q));
  }, [currentCues, searchQuery]);

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
    setTracks((prev) => {
      const currentTrack = prev[activeTrackLang];
      if (!currentTrack) return prev;
      return {
        ...prev,
        [activeTrackLang]: {
          ...currentTrack,
          cues: currentTrack.cues.map((c) => (c.id === id ? { ...c, text } : c)),
        },
      };
    });
  };

  const updateCueTimes = (id: string, deltaStart: number, deltaEnd: number) => {
    setTracks((prev) => {
      const currentTrack = prev[activeTrackLang];
      if (!currentTrack) return prev;
      return {
        ...prev,
        [activeTrackLang]: {
          ...currentTrack,
          cues: currentTrack.cues.map((c) => {
            if (c.id !== id) return c;
            const newStart = Math.max(0, Number((c.start + deltaStart).toFixed(2)));
            const newEnd = Math.max(newStart + 0.1, Number((c.end + deltaEnd).toFixed(2)));
            return { ...c, start: newStart, end: newEnd };
          }),
        },
      };
    });
  };

  const addCue = (afterIndex: number) => {
    const prevCue = currentCues[afterIndex];
    const newStart = prevCue ? Number((prevCue.end + 0.1).toFixed(2)) : 0;
    const newEnd = Number((newStart + 2.5).toFixed(2));
    const newCue: SubtitleCue = {
      id: Math.random().toString(36).substring(2, 9),
      start: newStart,
      end: newEnd,
      text: 'New subtitle cue...',
    };

    const nextCues = [...currentCues];
    nextCues.splice(afterIndex + 1, 0, newCue);

    setTracks((prev) => {
      const currentTrack = prev[activeTrackLang];
      if (!currentTrack) return prev;
      return {
        ...prev,
        [activeTrackLang]: {
          ...currentTrack,
          cues: nextCues,
        },
      };
    });
  };

  const deleteCue = (id: string) => {
    setTracks((prev) => {
      const currentTrack = prev[activeTrackLang];
      if (!currentTrack) return prev;
      return {
        ...prev,
        [activeTrackLang]: {
          ...currentTrack,
          cues: currentTrack.cues.filter((c) => c.id !== id),
        },
      };
    });
  };

  const handleDownload = (format: 'srt' | 'vtt' | 'txt' | 'json') => {
    if (!file || currentCues.length === 0) return;
    const baseName = file.name.replace(/\.[^/.]+$/, '');
    const langSuffix = activeTrackLang !== 'original' ? `_${activeTrackLang}` : '';

    let content = '';
    let mimeType = 'text/plain';
    let ext = format;

    switch (format) {
      case 'srt':
        content = cuesToSrt(currentCues);
        mimeType = 'application/x-subrip';
        break;
      case 'vtt':
        content = cuesToVtt(currentCues);
        mimeType = 'text/vtt';
        break;
      case 'txt':
        content = cuesToTxt(currentCues, false);
        break;
      case 'json':
        content = cuesToJson(currentCues);
        mimeType = 'application/json';
        break;
    }

    const blob = new Blob([content], { type: mimeType });
    downloadBlob(blob, `${baseName}${langSuffix}.${ext}`);
  };

  const handleDownloadZip = async () => {
    if (!file || Object.keys(tracks).length === 0) return;
    const baseName = file.name.replace(/\.[^/.]+$/, '');
    const zip = new JSZip();

    // Include all language tracks in ZIP
    Object.entries(tracks).forEach(([langCode, track]) => {
      const folderName = langCode === 'original' ? 'original' : `${langCode}_${track.name.replace(/\s+/g, '_')}`;
      const folder = zip.folder(folderName) || zip;
      folder.file(`${baseName}_${langCode}.srt`, cuesToSrt(track.cues));
      folder.file(`${baseName}_${langCode}.vtt`, cuesToVtt(track.cues));
      folder.file(`${baseName}_${langCode}.txt`, cuesToTxt(track.cues, false));
      folder.file(`${baseName}_${langCode}.json`, cuesToJson(track.cues));
    });

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    downloadBlob(zipBlob, `${baseName}_multilingual_subtitles.zip`);
  };

  const handleCopyClipboard = async (format: 'srt' | 'vtt' | 'txt') => {
    let text = '';
    if (format === 'srt') text = cuesToSrt(currentCues);
    else if (format === 'vtt') text = cuesToVtt(currentCues);
    else text = cuesToTxt(currentCues, false);

    await navigator.clipboard.writeText(text);
    setCopiedFormat(format);
    setTimeout(() => setCopiedFormat(null), 2000);
  };

  // Filtered languages for modal selector
  const filteredLanguages = useMemo(() => {
    let list = SUPPORTED_LANGUAGES;
    if (langRegionFilter === 'popular') list = POPULAR_LANGUAGES;
    else if (langRegionFilter === 'african') list = AFRICAN_LANGUAGES;
    else if (langRegionFilter !== 'all') {
      list = SUPPORTED_LANGUAGES.filter((l) => l.region === langRegionFilter);
    }

    if (!langSearchQuery.trim()) return list;
    const q = langSearchQuery.trim().toLowerCase();
    return list.filter(
      (l) =>
        l.code.toLowerCase().includes(q) ||
        l.name.toLowerCase().includes(q) ||
        l.nativeName.toLowerCase().includes(q)
    );
  }, [langSearchQuery, langRegionFilter]);

  const selectedLangOption = getLanguageByCode(selectedLanguage);
  const targetTranslateLangOption = getLanguageByCode(targetTranslateLang);
  const trackEntries = Object.entries(tracks);

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
          <div className="mt-4 flex items-center gap-2 text-[11px] font-mono text-zinc-500 bg-zinc-900/80 px-3 py-1.5 rounded-full border border-zinc-800 flex-wrap justify-center">
            <Sparkles className="h-3.5 w-3.5 text-brand-400" />
            <span>OpenAI Whisper AI (WebAssembly) · 100+ Languages Supported</span>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-surface-border bg-surface p-4 sm:p-6 space-y-6">
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-surface-border pb-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold text-zinc-200">{file.name}</span>
                <span className="rounded-md bg-zinc-800 px-2 py-0.5 text-[10px] font-mono text-zinc-400 border border-zinc-700">
                  {formatBytes(file.size)}
                </span>
                {trackEntries.length > 0 && (
                  <span className="rounded-md bg-brand-500/10 px-2 py-0.5 text-[10px] font-medium text-brand-400 border border-brand-500/30 flex items-center gap-1">
                    <Languages className="h-3 w-3" />
                    {trackEntries.length} {trackEntries.length === 1 ? 'Language Track' : 'Language Tracks'}
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                {currentCues.length > 0
                  ? `${currentCues.length} Subtitle Cues in Active Track`
                  : 'Ready to generate AI subtitles'}
              </p>
            </div>

            <button
              onClick={() => {
                if (mediaUrl) URL.revokeObjectURL(mediaUrl);
                setFile(null);
                setMediaUrl(null);
                setTracks({});
                setActiveTrackLang('original');
              }}
              className="text-xs text-zinc-400 hover:text-zinc-200 self-start sm:self-auto transition-colors"
            >
              Choose different file
            </button>
          </div>

          {/* Initial Controls / Transcribe Button */}
          {trackEntries.length === 0 && (
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-zinc-300 flex items-center justify-between mb-1.5">
                    <span className="flex items-center gap-1.5">
                      <Globe className="h-3.5 w-3.5 text-brand-400" />
                      Spoken Audio Language
                    </span>
                    <span className="text-[10px] text-brand-400 font-mono">100+ Languages</span>
                  </label>
                  
                  {/* Language Selector Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setLangPickerMode('transcribe');
                      setLangSearchQuery('');
                      setLangRegionFilter('all');
                      setIsLangPickerOpen(true);
                    }}
                    disabled={isProcessing}
                    className="w-full flex items-center justify-between rounded-xl border border-surface-border bg-zinc-900/90 px-3.5 py-2.5 text-xs text-zinc-200 hover:border-zinc-700 focus:border-brand-500 focus:outline-none transition-colors"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="font-semibold text-zinc-100">
                        {selectedLanguage === 'auto' ? 'Auto-Detect Language' : selectedLangOption?.name || selectedLanguage}
                      </span>
                      {selectedLangOption?.nativeName && selectedLanguage !== 'auto' && (
                        <span className="text-zinc-400 font-normal">({selectedLangOption.nativeName})</span>
                      )}
                    </div>
                    <ChevronDown className="h-4 w-4 text-zinc-400 shrink-0 ml-2" />
                  </button>
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
          {trackEntries.length > 0 && (
            <div className="space-y-6">
              {/* Studio Top Control Strip: Track Switcher & Translate Action */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-zinc-900/90 p-3 rounded-xl border border-zinc-800/90">
                {/* Track Selector Tabs */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-zinc-400 flex items-center gap-1.5 font-medium mr-1">
                    <Layers className="h-3.5 w-3.5 text-brand-400" />
                    Language Track:
                  </span>
                  {trackEntries.map(([langCode, track]) => {
                    const isSelected = activeTrackLang === langCode;
                    return (
                      <button
                        key={langCode}
                        onClick={() => setActiveTrackLang(langCode)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          isSelected
                            ? 'bg-brand-500 text-white shadow-glow-sm'
                            : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white border border-zinc-700'
                        }`}
                      >
                        <span>{track.name}</span>
                        {isSelected && <Check className="h-3 w-3" />}
                      </button>
                    );
                  })}
                </div>

                {/* Translate Subtitles Trigger Button */}
                <button
                  onClick={() => {
                    // Smart default target: if active is Amharic, default to English; otherwise Amharic
                    setTargetTranslateLang(activeTrackLang === 'am' ? 'en' : 'am');
                    setIsTranslateModalOpen(true);
                  }}
                  className="flex items-center gap-2 rounded-lg bg-indigo-600/20 border border-indigo-500/40 px-3.5 py-1.5 text-xs font-semibold text-indigo-300 hover:bg-indigo-600/30 hover:border-indigo-500 transition-all self-start md:self-auto shrink-0"
                >
                  <Languages className="h-3.5 w-3.5 text-indigo-400" />
                  <span>Translate Subtitles (1-Click AI)</span>
                </button>
              </div>

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
                      onClick={() => addCue(currentCues.length - 1)}
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
                            className="w-full resize-none rounded-lg border border-zinc-800/80 bg-zinc-950/60 p-2 text-xs text-zinc-100 placeholder:text-zinc-600 focus:border-brand-500 focus:outline-none leading-relaxed transition-colors font-sans"
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
                    <h5 className="text-xs font-semibold text-zinc-200">
                      Export Subtitles ({tracks[activeTrackLang]?.name || 'Current Track'})
                    </h5>
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
                      <span>Download All Tracks (ZIP)</span>
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

      {/* Searchable Language Selection Modal */}
      {isLangPickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl border border-zinc-700 bg-zinc-900 p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-brand-400" />
                <h4 className="text-sm font-semibold text-zinc-100">
                  {langPickerMode === 'transcribe' ? 'Select Audio Spoken Language' : 'Select Target Translation Language'}
                </h4>
              </div>
              <button
                onClick={() => setIsLangPickerOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
              <input
                type="text"
                autoFocus
                placeholder="Search language name, native script (e.g. አማርኛ, Español), or code (am, es)..."
                value={langSearchQuery}
                onChange={(e) => setLangSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 pl-9 pr-4 py-2 text-xs text-zinc-100 placeholder:text-zinc-500 focus:border-brand-500 focus:outline-none"
              />
            </div>

            {/* Region Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] scrollbar-none">
              {[
                { id: 'all', label: 'All (100+)' },
                { id: 'popular', label: 'Popular' },
                { id: 'african', label: 'African' },
                { id: 'european', label: 'European' },
                { id: 'asian', label: 'Asian' },
                { id: 'middle-eastern', label: 'Middle Eastern' },
                { id: 'americas', label: 'Americas' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setLangRegionFilter(tab.id)}
                  className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors ${
                    langRegionFilter === tab.id
                      ? 'bg-brand-500 text-white'
                      : 'bg-zinc-800/80 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Language Grid */}
            <div className="max-h-[300px] overflow-y-auto space-y-1 pr-1 custom-scrollbar">
              {filteredLanguages.map((lang) => {
                const isSelected =
                  langPickerMode === 'transcribe'
                    ? selectedLanguage === lang.code
                    : targetTranslateLang === lang.code;

                return (
                  <button
                    key={lang.code}
                    onClick={() => {
                      if (langPickerMode === 'transcribe') {
                        setSelectedLanguage(lang.code);
                      } else {
                        setTargetTranslateLang(lang.code);
                      }
                      setIsLangPickerOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left text-xs transition-colors ${
                      isSelected
                        ? 'bg-brand-500/20 text-brand-300 border border-brand-500/40'
                        : 'hover:bg-zinc-800/70 text-zinc-200 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{lang.name}</span>
                      <span className="text-zinc-400 font-normal">({lang.nativeName})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] uppercase text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded">
                        {lang.code}
                      </span>
                      {isSelected && <Check className="h-3.5 w-3.5 text-brand-400 shrink-0" />}
                    </div>
                  </button>
                );
              })}

              {filteredLanguages.length === 0 && (
                <div className="py-8 text-center text-xs text-zinc-500">
                  No languages found matching "{langSearchQuery}"
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 1-Click AI Translation Modal */}
      {isTranslateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-zinc-700 bg-zinc-900 p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Languages className="h-4 w-4 text-indigo-400" />
                <h4 className="text-sm font-semibold text-zinc-100">Translate Subtitles</h4>
              </div>
              {!isTranslating && (
                <button
                  onClick={() => setIsTranslateModalOpen(false)}
                  className="p-1 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="space-y-4">
              <p className="text-xs text-zinc-300 leading-relaxed">
                Translate all <span className="font-semibold text-white">{currentCues.length}</span> subtitle cues from{' '}
                <span className="text-brand-400 font-medium">
                  {tracks[activeTrackLang]?.name || 'Current Track'}
                </span>{' '}
                while preserving exact millisecond timestamps.
              </p>

              {/* Target Language Selection */}
              <div>
                <label className="text-xs font-medium text-zinc-300 block mb-1.5">
                  Target Language
                </label>
                <button
                  type="button"
                  disabled={isTranslating}
                  onClick={() => {
                    setLangPickerMode('translate');
                    setLangSearchQuery('');
                    setLangRegionFilter('all');
                    setIsLangPickerOpen(true);
                  }}
                  className="w-full flex items-center justify-between rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2.5 text-xs text-zinc-100 hover:border-zinc-600 transition-colors"
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="font-semibold">{targetTranslateLangOption?.name || targetTranslateLang}</span>
                    <span className="text-zinc-400">({targetTranslateLangOption?.nativeName || targetTranslateLang})</span>
                  </div>
                  <ChevronDown className="h-4 w-4 text-zinc-400 shrink-0" />
                </button>
              </div>

              {/* Translation Progress */}
              {isTranslating && translationProgress && (
                <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-indigo-200 flex items-center gap-2">
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-400" />
                      Translating cues ({translationProgress.currentCue}/{translationProgress.totalCues})...
                    </span>
                    <span className="font-mono text-indigo-400 font-bold">
                      {translationProgress.progress}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
                    <div
                      className="h-full bg-indigo-500 transition-all duration-300 rounded-full"
                      style={{ width: `${translationProgress.progress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  disabled={isTranslating}
                  onClick={() => setIsTranslateModalOpen(false)}
                  className="px-3 py-2 rounded-xl text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={isTranslating || !targetTranslateLang}
                  onClick={handleTranslateSubtitles}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-glow-sm transition-all disabled:opacity-50"
                >
                  {isTranslating ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Translating...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>Start Translation</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

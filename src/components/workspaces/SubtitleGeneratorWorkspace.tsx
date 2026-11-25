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
import { WorkspaceDropzone, WorkspaceAlert, WorkspaceProgress } from './WorkspaceUI';
import { useHandoffFiles } from '../../lib/useHandoffFiles';
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
        <WorkspaceDropzone
          onClick={() => fileInputRef.current?.click()}
          onFilesDrop={(files) => {
            if (files[0]) handleFile(files[0]);
          }}
          icon={<Subtitles className="h-5 w-5" />}
          title="Drop video or audio to generate subtitles, or"
          highlightText="browse files"
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
        </WorkspaceDropzone>
      ) : (
        <div className="nt-card p-5 sm:p-6 space-y-5">
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--nt-border)] pb-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EFF6FF] dark:bg-[#3B82F6]/15 text-[#2563EB] dark:text-[#60A5FA] shadow-card">
                <Subtitles className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-extrabold text-[#111214] dark:text-[#F3F4F6] break-all">
                    {file.name}
                  </span>
                  <span className="nt-well px-2 py-0.5 text-[10px] font-mono font-semibold text-[#4B5563] dark:text-[#D1D5DB]">
                    {formatBytes(file.size)}
                  </span>
                  {trackEntries.length > 0 && (
                    <span className="nt-badge-yellow px-2.5 py-0.5 text-[10px] font-bold flex items-center gap-1">
                      <Languages className="h-3 w-3" />
                      {trackEntries.length} {trackEntries.length === 1 ? 'Language Track' : 'Language Tracks'}
                    </span>
                  )}
                </div>
                <p className="text-xs font-mono text-[#6B7280] dark:text-[#9CA3AF] mt-0.5">
                  {currentCues.length > 0
                    ? `${currentCues.length} subtitle cues in active track`
                    : 'Ready to transcribe & generate subtitles'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                if (mediaUrl) URL.revokeObjectURL(mediaUrl);
                setFile(null);
                setMediaUrl(null);
                setTracks({});
                setActiveTrackLang('original');
              }}
              className="nt-btn-secondary px-3 py-1.5 text-xs font-semibold self-start sm:self-auto"
            >
              Choose different file
            </button>
          </div>

          {/* Initial Controls / Transcribe Button */}
          {trackEntries.length === 0 && (
            <div className="space-y-4 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="nt-well p-4 space-y-2">
                  <label className="text-xs font-bold text-[#111214] dark:text-[#F3F4F6] flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Globe className="h-3.5 w-3.5 text-[#2563EB] dark:text-[#60A5FA]" />
                      Spoken Audio Language
                    </span>
                    <span className="font-mono text-[10px] text-[#6B7280] dark:text-[#9CA3AF]">100+ Languages</span>
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
                    className="nt-input w-full flex items-center justify-between px-3.5 py-2.5 text-xs hover:border-[#141413] dark:hover:border-[#FACC15] transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="font-bold text-[#111214] dark:text-[#F3F4F6]">
                        {selectedLanguage === 'auto' ? 'Auto-Detect Language' : selectedLangOption?.name || selectedLanguage}
                      </span>
                      {selectedLangOption?.nativeName && selectedLanguage !== 'auto' && (
                        <span className="text-[#6B7280] dark:text-[#9CA3AF] font-normal">({selectedLangOption.nativeName})</span>
                      )}
                    </div>
                    <ChevronDown className="h-4 w-4 text-[#746D61] shrink-0 ml-2" />
                  </button>
                </div>

                <div className="flex flex-col justify-end">
                  <button
                    type="button"
                    onClick={handleGenerate}
                    disabled={isProcessing}
                    className="nt-btn-yellow w-full flex items-center justify-center gap-2 py-3.5 px-5 text-xs sm:text-sm disabled:opacity-50"
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
                <WorkspaceProgress message={progressInfo.message} progress={progressInfo.progress} />
              )}
            </div>
          )}

          {/* Subtitle Studio Layout */}
          {trackEntries.length > 0 && (
            <div className="space-y-5">
              {/* Studio Top Control Strip: Track Switcher & Translate Action */}
              <div className="nt-well flex flex-col md:flex-row md:items-center justify-between gap-3 p-3.5">
                {/* Track Selector Tabs */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-[#4B5563] dark:text-[#D1D5DB] flex items-center gap-1.5 font-bold mr-1">
                    <Layers className="h-3.5 w-3.5 text-[#2563EB] dark:text-[#60A5FA]" />
                    Track:
                  </span>
                  {trackEntries.map(([langCode, track]) => {
                    const isSelected = activeTrackLang === langCode;
                    return (
                      <button
                        key={langCode}
                        type="button"
                        onClick={() => setActiveTrackLang(langCode)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold transition-all ${
                          isSelected ? 'nt-btn-yellow' : 'nt-btn-secondary'
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
                  type="button"
                  onClick={() => {
                    setTargetTranslateLang(activeTrackLang === 'am' ? 'en' : 'am');
                    setIsTranslateModalOpen(true);
                  }}
                  className="nt-btn-primary flex items-center gap-2 px-3.5 py-2 text-xs font-bold self-start md:self-auto shrink-0"
                >
                  <Languages className="h-3.5 w-3.5 text-[#2563EB]" />
                  <span>Translate Subtitles (1-Click AI)</span>
                </button>
              </div>

              {/* Studio Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                {/* Media Player Column (5 Cols) */}
                <div className="lg:col-span-5 space-y-3.5">
                  <div className="relative rounded-2xl overflow-hidden bg-[#141311] border border-[var(--nt-border)] shadow-card aspect-video flex items-center justify-center">
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
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1F1D19] border border-white/10 text-[#2563EB]">
                          <Volume2 className="h-6 w-6 animate-pulse" />
                        </div>
                        <audio
                          ref={mediaRef as any}
                          src={mediaUrl}
                          onTimeUpdate={handleTimeUpdate}
                          onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
                          onPlay={() => setIsPlaying(true)}
                          onPause={() => setIsPlaying(false)}
                        />
                        <span className="text-xs text-[#938B7D] font-mono">Audio Playback Stream</span>
                      </div>
                    ) : (
                      <div className="text-[#746D61] text-xs font-mono">No Media Loaded</div>
                    )}

                    {/* Live Subtitle Overlay */}
                    {showSubtitleOverlay && activeCue && (
                      <div className="absolute bottom-3.5 inset-x-3.5 flex justify-center pointer-events-none">
                        <span className="rounded-lg bg-[#141413]/92 px-3 py-1.5 text-center text-xs sm:text-sm font-semibold text-[#FAF7F0] shadow-card backdrop-blur-sm border border-[#FACC15]/40 max-w-[92%] leading-relaxed">
                          {activeCue.text}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Playback Controls Bar */}
                  <div className="nt-well p-3.5 space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <button
                          type="button"
                          onClick={togglePlay}
                          className="nt-btn-yellow flex h-8 w-8 items-center justify-center"
                          aria-label={isPlaying ? 'Pause' : 'Play'}
                        >
                          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
                        </button>
                        <span className="text-xs font-mono font-semibold text-[#111214] dark:text-[#F3F4F6]">
                          {formatTimeVtt(currentTime)} / {formatTimeVtt(duration)}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => setShowSubtitleOverlay(!showSubtitleOverlay)}
                        className={`flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 transition-all cursor-pointer ${
                          showSubtitleOverlay
                            ? 'nt-badge-yellow'
                            : 'nt-subcard text-[#6B7280] dark:text-[#9CA3AF]'
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
                      className="w-full h-1.5 bg-white dark:bg-[#13151A] rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                </div>

                {/* Subtitle Cue List & Editor (7 Cols) */}
                <div className="lg:col-span-7 space-y-3">
                  {/* Editor Toolbar */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="relative flex-1 min-w-[180px]">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#746D61]" />
                      <input
                        type="text"
                        placeholder="Search transcript cues..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="nt-input w-full pl-8 pr-3 py-1.5 text-xs"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => addCue(currentCues.length - 1)}
                      className="nt-btn-secondary flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold shrink-0"
                    >
                      <Plus className="h-3.5 w-3.5 text-[#2563EB] dark:text-[#60A5FA]" />
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
                          className={`rounded-xl border p-3 transition-all space-y-2 shadow-sm ${
                            isActive
                              ? 'border-[#2563EB] bg-[#FEF7D6]/75 dark:bg-[#2563EB]/10 ring-1 ring-[#FACC15]/40'
                              : 'nt-subcard hover:border-[var(--nt-border-strong)]'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            {/* Cue Index & Jump Button */}
                            <div className="flex items-center gap-2 flex-wrap">
                              <button
                                type="button"
                                onClick={() => handleSeek(cue.start)}
                                className={`flex h-6 w-6 items-center justify-center rounded-md text-[10px] font-extrabold font-mono transition-all cursor-pointer ${
                                  isActive
                                    ? 'bg-[#EFF6FF] dark:bg-[#3B82F6]/15 text-[#2563EB] dark:text-[#60A5FA]'
                                    : 'bg-[#F3F4F6] dark:bg-[#1A1D24] text-[#4B5563] dark:text-[#D1D5DB] hover:bg-[#141413] hover:text-[#2563EB]'
                                }`}
                              >
                                {idx + 1}
                              </button>

                              {/* Timestamp Controls */}
                              <div className="flex items-center gap-1 font-mono text-[11px] text-[#6B7280] dark:text-[#9CA3AF]">
                                <button
                                  type="button"
                                  onClick={() => updateCueTimes(cue.id, -0.1, 0)}
                                  className="nt-btn-secondary px-1.5 py-0.5 text-[10px] font-bold"
                                  title="Nudge start -0.1s"
                                >
                                  -
                                </button>
                                <span className="font-bold text-[#111214] dark:text-[#F3F4F6] px-1">
                                  {formatTimeVtt(cue.start)}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => updateCueTimes(cue.id, 0.1, 0)}
                                  className="nt-btn-secondary px-1.5 py-0.5 text-[10px] font-bold"
                                  title="Nudge start +0.1s"
                                >
                                  +
                                </button>

                                <span className="mx-1 text-[#746D61]">→</span>

                                <button
                                  type="button"
                                  onClick={() => updateCueTimes(cue.id, 0, -0.1)}
                                  className="nt-btn-secondary px-1.5 py-0.5 text-[10px] font-bold"
                                  title="Nudge end -0.1s"
                                >
                                  -
                                </button>
                                <span className="font-bold text-[#111214] dark:text-[#F3F4F6] px-1">
                                  {formatTimeVtt(cue.end)}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => updateCueTimes(cue.id, 0, 0.1)}
                                  className="nt-btn-secondary px-1.5 py-0.5 text-[10px] font-bold"
                                  title="Nudge end +0.1s"
                                >
                                  +
                                </button>
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => addCue(idx)}
                                className="p-1.5 rounded-lg text-[#746D61] hover:text-[#2563EB] dark:hover:text-[#60A5FA] hover:bg-[#EAE3D4] dark:hover:bg-[#1F1D19] transition-colors cursor-pointer"
                                title="Insert cue below"
                              >
                                <Plus className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => deleteCue(cue.id)}
                                className="p-1.5 rounded-lg text-[#746D61] hover:text-[#B91C1C] dark:hover:text-[#F87171] hover:bg-[#FEF2F2] dark:hover:bg-red-950/40 transition-colors cursor-pointer"
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
                            className="nt-input w-full resize-none p-2.5 text-xs leading-relaxed font-sans"
                          />
                        </div>
                      );
                    })}

                    {filteredCues.length === 0 && (
                      <div className="nt-well text-center py-8 text-xs text-[#6B7280] dark:text-[#9CA3AF] font-mono">
                        No subtitle cues match &quot;{searchQuery}&quot;
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Export Actions Footer */}
              <div className="nt-well p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h5 className="text-xs font-bold text-[#111214] dark:text-[#F3F4F6]">
                      Export ({tracks[activeTrackLang]?.name || 'Track'})
                    </h5>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => handleDownload('srt')}
                      className="nt-btn-secondary flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold"
                    >
                      <Download className="h-3.5 w-3.5 text-[#2563EB] dark:text-[#60A5FA]" />
                      <span>Download .SRT</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDownload('vtt')}
                      className="nt-btn-secondary flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold"
                    >
                      <Download className="h-3.5 w-3.5 text-[#2563EB] dark:text-[#60A5FA]" />
                      <span>Download .VTT</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDownload('txt')}
                      className="nt-btn-secondary flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold"
                    >
                      <FileText className="h-3.5 w-3.5 text-[#746D61]" />
                      <span>Download .TXT</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleDownloadZip}
                      className="nt-btn-yellow flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Download All Tracks (ZIP)</span>
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2.5 border-t border-[var(--nt-border)] text-[11px] font-mono text-[#6B7280] dark:text-[#9CA3AF]">
                  <span>Quick Copy:</span>
                  <button
                    type="button"
                    onClick={() => handleCopyClipboard('srt')}
                    className="font-bold text-[#111214] dark:text-[#60A5FA] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    {copiedFormat === 'srt' ? <Check className="h-3 w-3 text-[#15803D]" /> : <Copy className="h-3 w-3" />}
                    SRT
                  </button>
                  <span>·</span>
                  <button
                    type="button"
                    onClick={() => handleCopyClipboard('vtt')}
                    className="font-bold text-[#111214] dark:text-[#60A5FA] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    {copiedFormat === 'vtt' ? <Check className="h-3 w-3 text-[#15803D]" /> : <Copy className="h-3 w-3" />}
                    WebVTT
                  </button>
                  <span>·</span>
                  <button
                    type="button"
                    onClick={() => handleCopyClipboard('txt')}
                    className="font-bold text-[#111214] dark:text-[#60A5FA] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    {copiedFormat === 'txt' ? <Check className="h-3 w-3 text-[#15803D]" /> : <Copy className="h-3 w-3" />}
                    Plain Text
                  </button>
                </div>
              </div>
            </div>
          )}

          {error && <WorkspaceAlert variant="error" message={error} />}
        </div>
      )}

      {/* Searchable Language Selection Modal */}
      {isLangPickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#141413]/55 backdrop-blur-sm animate-in fade-in">
          <div className="nt-window w-full max-w-lg p-5 space-y-3.5">
            <div className="flex items-center justify-between border-b border-[var(--nt-border)] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#EFF6FF] dark:bg-[#3B82F6]/15 text-[#2563EB] dark:text-[#60A5FA]">
                  <Globe className="h-4 w-4" />
                </div>
                <h4 className="text-sm font-extrabold text-[#111214] dark:text-[#F3F4F6]">
                  {langPickerMode === 'transcribe' ? 'Select Audio Spoken Language' : 'Select Target Translation Language'}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setIsLangPickerOpen(false)}
                className="nt-btn-secondary p-1.5"
                aria-label="Close modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#746D61]" />
              <input
                type="text"
                autoFocus
                placeholder="Search language name, native script (e.g. አማርኛ, Español), or code (am, es)..."
                value={langSearchQuery}
                onChange={(e) => setLangSearchQuery(e.target.value)}
                className="nt-input w-full pl-9 pr-3 py-2 text-xs"
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
                  type="button"
                  onClick={() => setLangRegionFilter(tab.id)}
                  className={`px-2.5 py-1 rounded-lg font-bold whitespace-nowrap transition-all cursor-pointer ${
                    langRegionFilter === tab.id ? 'nt-btn-yellow' : 'nt-btn-secondary'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Language Grid */}
            <div className="nt-well max-h-[280px] overflow-y-auto space-y-1 p-2 custom-scrollbar">
              {filteredLanguages.map((lang) => {
                const isSelected =
                  langPickerMode === 'transcribe'
                    ? selectedLanguage === lang.code
                    : targetTranslateLang === lang.code;

                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => {
                      if (langPickerMode === 'transcribe') {
                        setSelectedLanguage(lang.code);
                      } else {
                        setTargetTranslateLang(lang.code);
                      }
                      setIsLangPickerOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left text-xs transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-[#EFF6FF] dark:bg-[#3B82F6]/15 text-[#111214] dark:text-[#F3F4F6] border-[#2563EB] font-bold shadow-sm'
                        : 'bg-white dark:bg-[#13151A] hover:bg-[#FCFBF8] dark:hover:bg-[#26231E] text-[#111214] dark:text-[#F3F4F6] border-[var(--nt-border)]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{lang.name}</span>
                      <span className="text-[#6B7280] dark:text-[#9CA3AF] font-normal">({lang.nativeName})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="nt-well font-mono text-[10px] uppercase text-[#4B5563] dark:text-[#D1D5DB] px-1.5 py-0.5">
                        {lang.code}
                      </span>
                      {isSelected && <Check className="h-3.5 w-3.5 text-[#111214] dark:text-[#60A5FA] shrink-0" />}
                    </div>
                  </button>
                );
              })}

              {filteredLanguages.length === 0 && (
                <div className="py-6 text-center text-xs text-[#6B7280] dark:text-[#9CA3AF] font-mono">
                  No languages found matching &quot;{langSearchQuery}&quot;
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 1-Click AI Translation Modal */}
      {isTranslateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#141413]/55 backdrop-blur-sm animate-in fade-in">
          <div className="nt-window w-full max-w-md p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--nt-border)] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#EFF6FF] dark:bg-[#3B82F6]/15 text-[#2563EB] dark:text-[#60A5FA]">
                  <Languages className="h-4 w-4" />
                </div>
                <h4 className="text-sm font-extrabold text-[#111214] dark:text-[#F3F4F6]">Translate Subtitles</h4>
              </div>
              {!isTranslating && (
                <button
                  type="button"
                  onClick={() => setIsTranslateModalOpen(false)}
                  className="nt-btn-secondary p-1.5"
                  aria-label="Close modal"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="space-y-4">
              <p className="text-xs font-mono text-[#6B7280] dark:text-[#9CA3AF]">
                {currentCues.length} cues · {tracks[activeTrackLang]?.name || 'Track'}
              </p>

              {/* Target Language Selection */}
              <div>
                <label className="text-xs font-bold text-[#111214] dark:text-[#F3F4F6] block mb-1.5">
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
                  className="nt-input w-full flex items-center justify-between px-3.5 py-2.5 text-xs hover:border-[#141413] dark:hover:border-[#FACC15] transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="font-bold text-[#111214] dark:text-[#F3F4F6]">
                      {targetTranslateLangOption?.name || targetTranslateLang}
                    </span>
                    <span className="text-[#6B7280] dark:text-[#9CA3AF]">
                      ({targetTranslateLangOption?.nativeName || targetTranslateLang})
                    </span>
                  </div>
                  <ChevronDown className="h-4 w-4 text-[#746D61] shrink-0" />
                </button>
              </div>

              {/* Translation Progress */}
              {isTranslating && translationProgress && (
                <WorkspaceProgress
                  message={`Translating cues (${translationProgress.currentCue}/${translationProgress.totalCues})...`}
                  progress={translationProgress.progress}
                />
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[var(--nt-border)]">
                <button
                  type="button"
                  disabled={isTranslating}
                  onClick={() => setIsTranslateModalOpen(false)}
                  className="nt-btn-secondary px-3.5 py-2 text-xs font-semibold"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={isTranslating || !targetTranslateLang}
                  onClick={handleTranslateSubtitles}
                  className="nt-btn-yellow flex items-center gap-1.5 px-4 py-2 text-xs disabled:opacity-50"
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

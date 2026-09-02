import React, { useState, useRef, useEffect } from 'react';
import {
  LyricsVideoEngine,
  type LyricLine,
  type LyricsVideoStyle,
  BACKGROUND_PRESETS,
  DEMO_TRACKS,
} from '../../engines/lyricsVideoEngine';
import { SubtitleEngine } from '../../engines/subtitleEngine';
import { formatDuration, formatBytes, downloadBlob } from '../../lib/utils';
import {
  Music,
  Video,
  Play,
  Pause,
  Download,
  Sparkles,
  Sliders,
  Palette,
  Image as ImageIcon,
  Type,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyStart,
  AlignVerticalJustifyEnd,
  Wand2,
  FileText,
  Plus,
  Trash2,
  Clock,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Radio,
  Layers,
  RotateCcw,
  Zap,
  Volume2,
  FastForward,
  Rewind,
  Globe,
  Check,
} from 'lucide-react';

const INITIAL_STYLE: LyricsVideoStyle = {
  placement: 'middle',
  fontFamily: 'Noto Sans Ethiopic',
  fontSize: 48,
  fontWeight: '800',
  textColor: '#E2E8F0',
  activeColor: '#38BDF8',
  glowColor: '#0284C7',
  glowIntensity: 18,
  showPillBg: true,
  pillBgColor: 'rgba(5, 8, 17, 0.65)',
  transitionEffect: 'karaoke',
  showMusicalNotes: true,
  noteStyle: 'floating',
  backgroundDim: 0.35,
  backgroundBlur: 0,
  aspectRatio: '16:9',
  beatPulse: true,
  showWaveform: true,
};

const SUPPORTED_LANGUAGES = [
  { code: 'auto', name: 'Auto-Detect', native: 'Auto' },
  { code: 'am', name: 'Amharic', native: 'አማርኛ' },
  { code: 'en', name: 'English', native: 'English' },
  { code: 'es', name: 'Spanish', native: 'Español' },
  { code: 'fr', name: 'French', native: 'Français' },
  { code: 'ar', name: 'Arabic', native: 'العربية' },
  { code: 'om', name: 'Oromo', native: 'Afaan Oromoo' },
  { code: 'ti', name: 'Tigrinya', native: 'ትግርኛ' },
  { code: 'de', name: 'German', native: 'Deutsch' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
  { code: 'sw', name: 'Swahili', native: 'Kiswahili' },
];

export const LyricsVideoWorkspace: React.FC = () => {
  // Audio state
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioDuration, setAudioDuration] = useState<number>(18);
  const [selectedDemoId, setSelectedDemoId] = useState<string>('tizita-amharic');

  // Background media state
  const [bgImageFile, setBgImageFile] = useState<File | null>(null);
  const [bgImageUrl, setBgImageUrl] = useState<string | null>(null);
  const [bgVideoFile, setBgVideoFile] = useState<File | null>(null);
  const [bgVideoUrl, setBgVideoUrl] = useState<string | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<string>('nebula');

  // Lyrics state
  const [lyrics, setLyrics] = useState<LyricLine[]>([]);
  const [rawLrcText, setRawLrcText] = useState<string>('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('am');
  const [isAiDetecting, setIsAiDetecting] = useState(false);
  const [isAligning, setIsAligning] = useState(false);
  const [detectionProgress, setDetectionProgress] = useState<string>('');

  // Style state
  const [style, setStyle] = useState<LyricsVideoStyle>(INITIAL_STYLE);

  // Active Workspace Tab
  const [activeTab, setActiveTab] = useState<'lyrics' | 'media' | 'style' | 'effects'>('lyrics');

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  // Export State
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportMessage, setExportMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // DOM Refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const bgImgRef = useRef<HTMLImageElement | null>(null);
  const bgVideoRef = useRef<HTMLVideoElement | null>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);
  const lrcInputRef = useRef<HTMLInputElement>(null);
  const animFrameRef = useRef<number | null>(null);

  // Initialize with Amharic Tizita demo track on mount
  useEffect(() => {
    loadDemoTrack('tizita-amharic');
  }, []);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      if (audioUrl && !audioUrl.startsWith('blob:')) URL.revokeObjectURL(audioUrl);
      if (bgImageUrl) URL.revokeObjectURL(bgImageUrl);
      if (bgVideoUrl) URL.revokeObjectURL(bgVideoUrl);
    };
  }, [audioUrl, bgImageUrl, bgVideoUrl]);

  // Load a demo track
  const loadDemoTrack = async (demoId: string) => {
    const demo = DEMO_TRACKS.find((d) => d.id === demoId) || DEMO_TRACKS[0];
    setSelectedDemoId(demoId);
    setAudioFile(null);
    setIsPlaying(false);
    setCurrentTime(0);

    const parsed = LyricsVideoEngine.parseLrc(demo.sampleLyrics);
    setLyrics(parsed);
    setRawLrcText(demo.sampleLyrics);
    setAudioDuration(demo.duration);

    if (demoId.includes('amharic') || demoId.includes('ethiopian')) {
      setSelectedLanguage('am');
      setStyle((prev) => ({ ...prev, fontFamily: 'Noto Sans Ethiopic' }));
    } else {
      setSelectedLanguage('en');
    }

    try {
      const demoAudio = await LyricsVideoEngine.createDemoAudio(demoId);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      const url = URL.createObjectURL(demoAudio.blob);
      setAudioUrl(url);
    } catch (e) {
      console.debug('Demo audio fallback:', e);
    }
  };

  // Handle User Audio Upload
  const handleAudioUpload = async (file: File) => {
    if (!file.type.startsWith('audio/') && !/\.(mp3|wav|m4a|ogg|aac|flac)$/i.test(file.name)) {
      setError('Please upload a valid audio file (MP3, WAV, M4A, OGG, FLAC).');
      return;
    }

    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setError(null);
    setAudioFile(file);
    setIsPlaying(false);
    setCurrentTime(0);

    const url = URL.createObjectURL(file);
    setAudioUrl(url);

    // Initial basic timestamp skeleton
    const initialText =
      selectedLanguage === 'am'
        ? `[00:01.00] የትዝታ ማዕበል በልቤ ሲነሳ ♪\n[00:05.00] የፍቅርሽ ትዝታ ዳግም ተቀሰቀሰ ♫\n[00:09.00] ናፍቆትሽ በረታ የኔ ቆንጆ እያልኩኝ ♬\n[00:13.00] በሙዚቃው ዜማ ልቤ ተደሰተ ♪`
        : `[00:01.00] Enter your first lyric line here ♪\n[00:05.00] Add second line of music ♫\n[00:09.00] Click "Auto-Detect Lyrics" to generate automatically!`;

    setRawLrcText(initialText);
    setLyrics(LyricsVideoEngine.parseLrc(initialText));
    setSuccessMessage(`Loaded "${file.name}"! Click "Auto-Detect & Generate Lyrics" or paste your lyrics.`);
    setTimeout(() => setSuccessMessage(null), 5000);
  };

  // AI Speech Recognition & Lyric Generator
  const handleAutoDetectLyrics = async () => {
    if (!audioFile && !audioUrl) {
      setError('Please upload an audio file first.');
      return;
    }

    setIsAiDetecting(true);
    setError(null);
    setDetectionProgress('Extracting and analyzing audio wave & speech frequencies...');

    try {
      let targetBlob: Blob | File | null = audioFile;
      if (!targetBlob && audioUrl) {
        const resp = await fetch(audioUrl);
        targetBlob = await resp.blob();
      }

      if (!targetBlob) throw new Error('Audio stream unavailable');

      const generated = await LyricsVideoEngine.detectOrGenerateLyrics(
        targetBlob,
        { language: selectedLanguage },
        (p) => {
          setDetectionProgress(p.message);
        }
      );

      setLyrics(generated);
      const lrc = LyricsVideoEngine.formatLrc(generated);
      setRawLrcText(lrc);
      setSuccessMessage(`Detected and synchronized ${generated.length} lyric lines!`);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setError('Lyrics detection note: ' + (err?.message || err));
    } finally {
      setIsAiDetecting(false);
    }
  };

  // Auto-Align Pasted Lyrics to Song Beats
  const handleAutoAlignPastedLyrics = async () => {
    if (!audioFile && !audioUrl) {
      setError('Please upload an audio file first.');
      return;
    }

    if (!rawLrcText.trim()) {
      setError('Please paste or type lyrics lines into the editor first.');
      return;
    }

    setIsAligning(true);
    setError(null);
    setDetectionProgress('Analyzing audio beat energy & mapping lyric cadence...');

    try {
      let targetBlob: Blob | File | null = audioFile;
      if (!targetBlob && audioUrl) {
        const resp = await fetch(audioUrl);
        targetBlob = await resp.blob();
      }

      if (!targetBlob) throw new Error('Audio stream unavailable');

      const aligned = await LyricsVideoEngine.detectOrGenerateLyrics(
        targetBlob,
        { language: selectedLanguage, rawLyrics: rawLrcText },
        (p) => {
          setDetectionProgress(p.message);
        }
      );

      setLyrics(aligned);
      setRawLrcText(LyricsVideoEngine.formatLrc(aligned));
      setSuccessMessage(`Successfully aligned ${aligned.length} lyric lines to song beats!`);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setError('Alignment error: ' + (err?.message || err));
    } finally {
      setIsAligning(false);
    }
  };

  // Shift timestamps by delta
  const handleShiftTimestamps = (delta: number) => {
    const shifted = LyricsVideoEngine.shiftLyricsTime(lyrics, delta);
    setLyrics(shifted);
    setRawLrcText(LyricsVideoEngine.formatLrc(shifted));
    setSuccessMessage(`Shifted all lyrics by ${delta > 0 ? `+${delta}` : delta}s`);
    setTimeout(() => setSuccessMessage(null), 2500);
  };

  // Handle Background Media Upload
  const handleBgMediaUpload = (file: File) => {
    if (bgImageUrl) URL.revokeObjectURL(bgImageUrl);
    if (bgVideoUrl) URL.revokeObjectURL(bgVideoUrl);

    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setBgImageFile(file);
      setBgImageUrl(url);
      setBgVideoFile(null);
      setBgVideoUrl(null);
    } else if (file.type.startsWith('video/')) {
      const url = URL.createObjectURL(file);
      setBgVideoFile(file);
      setBgVideoUrl(url);
      setBgImageFile(null);
      setBgImageUrl(null);
    }
  };

  // Parse Raw LRC Text edit
  const handleRawLrcChange = (text: string) => {
    setRawLrcText(text);
    const parsed = LyricsVideoEngine.parseLrc(text);
    setLyrics(parsed);
  };

  // Edit single line
  const handleEditLine = (index: number, field: keyof LyricLine, value: any) => {
    const updated = [...lyrics];
    updated[index] = { ...updated[index], [field]: value };
    setLyrics(updated);
    setRawLrcText(LyricsVideoEngine.formatLrc(updated));
  };

  // Add line
  const handleAddLine = () => {
    const last = lyrics[lyrics.length - 1];
    const start = last ? last.end + 0.5 : 0;
    const newLine: LyricLine = {
      id: Math.random().toString(36).substring(2, 9),
      start,
      end: start + 3.5,
      text: selectedLanguage === 'am' ? 'አዲስ የዜማ ስንኝ ♪' : 'New lyric line ♪',
    };
    const updated = [...lyrics, newLine];
    setLyrics(updated);
    setRawLrcText(LyricsVideoEngine.formatLrc(updated));
  };

  // Delete line
  const handleDeleteLine = (index: number) => {
    const updated = lyrics.filter((_, i) => i !== index);
    setLyrics(updated);
    setRawLrcText(LyricsVideoEngine.formatLrc(updated));
  };

  // Play / Pause Toggle
  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch((e) => console.debug('Audio play failed:', e));
    }
  };

  // Seek
  const handleSeek = (time: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = time;
    setCurrentTime(time);
    if (bgVideoRef.current) {
      bgVideoRef.current.currentTime = time % (bgVideoRef.current.duration || 1);
    }
  };

  // Canvas Dimensions based on Aspect Ratio
  const getCanvasDimensions = () => {
    if (style.aspectRatio === '9:16') return { width: 1080, height: 1920 };
    if (style.aspectRatio === '1:1') return { width: 1080, height: 1080 };
    return { width: 1920, height: 1080 }; // 16:9 Landscape
  };

  // Main Live Preview Canvas Animation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = getCanvasDimensions();
    canvas.width = width;
    canvas.height = height;

    const render = () => {
      const audioTime = audioRef.current ? audioRef.current.currentTime : currentTime;
      setCurrentTime(audioTime);

      LyricsVideoEngine.renderFrame(ctx, canvas, audioTime, lyrics, style, {
        image: bgImgRef.current,
        video: bgVideoRef.current,
        preset: selectedPreset as any,
      });

      if (isPlaying) {
        animFrameRef.current = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, currentTime, lyrics, style, selectedPreset, bgImageUrl, bgVideoUrl]);

  // Handle Export Video
  const handleExportVideo = async () => {
    let targetBlob: Blob | File | null = audioFile;
    if (!targetBlob && audioUrl) {
      const resp = await fetch(audioUrl);
      targetBlob = await resp.blob();
    }

    if (!targetBlob) {
      setError('Please load an audio track before exporting.');
      return;
    }

    if (lyrics.length === 0) {
      setError('Please add or detect lyrics before exporting.');
      return;
    }

    setIsExporting(true);
    setExportProgress(0);
    setExportMessage('Initializing HD video renderer...');
    setError(null);

    try {
      const videoBlob = await LyricsVideoEngine.exportLyricsVideo(
        targetBlob,
        lyrics,
        style,
        {
          image: bgImgRef.current,
          video: bgVideoRef.current,
          preset: selectedPreset as any,
        },
        (progress, msg) => {
          setExportProgress(progress);
          setExportMessage(msg);
        }
      );

      const fileName = audioFile
        ? `${audioFile.name.replace(/\.[^/.]+$/, '')}-lyrics-video.webm`
        : 'novatools-lyrics-video.webm';

      downloadBlob(videoBlob, fileName);
      setSuccessMessage('Video successfully rendered & downloaded!');
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      setError('Export failed: ' + (err?.message || err));
    } finally {
      setIsExporting(false);
      setExportProgress(0);
      setExportMessage('');
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Hidden Audio & Video Elements for Sync */}
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => setIsPlaying(false)}
          onLoadedMetadata={(e) => setAudioDuration(e.currentTarget.duration)}
          className="hidden"
          crossOrigin="anonymous"
        />
      )}

      {bgImageUrl && (
        <img
          ref={bgImgRef}
          src={bgImageUrl}
          alt="Background"
          className="hidden"
          crossOrigin="anonymous"
        />
      )}

      {bgVideoUrl && (
        <video
          ref={bgVideoRef}
          src={bgVideoUrl}
          muted
          loop
          playsInline
          className="hidden"
          crossOrigin="anonymous"
        />
      )}

      {/* TOP: Video Live Preview Screen Box */}
      <div className="rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#16171a] p-4 sm:p-5 shadow-sm space-y-4">
        {/* Screen Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-white/[0.06] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/40">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                Live Animated Lyrics Video Studio
              </h2>
              <p className="text-[11px] font-mono text-slate-500 dark:text-[#9ca3af]">
                100% Client-Side In-Browser Engine · Amharic (አማርኛ) & Multilingual Support
              </p>
            </div>
          </div>

          {/* Aspect Ratio Picker */}
          <div className="flex items-center gap-1.5 self-start sm:self-auto bg-slate-100 dark:bg-[#121316] p-1 rounded-lg border border-slate-200 dark:border-white/[0.06]">
            <span className="text-[10px] font-mono text-slate-500 dark:text-[#9ca3af] px-1">Canvas:</span>
            {[
              { id: '16:9', label: '16:9 Landscape' },
              { id: '9:16', label: '9:16 Shorts' },
              { id: '1:1', label: '1:1 Square' },
            ].map((ratio) => (
              <button
                key={ratio.id}
                onClick={() => setStyle({ ...style, aspectRatio: ratio.id as any })}
                className={`px-2.5 py-1 rounded text-[10px] font-mono transition-colors cursor-pointer ${
                  style.aspectRatio === ratio.id
                    ? 'bg-blue-600 text-white font-semibold shadow-sm'
                    : 'text-slate-600 dark:text-[#9ca3af] hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {ratio.label}
              </button>
            ))}
          </div>
        </div>

        {/* Live Canvas Monitor Viewport */}
        <div className="relative w-full flex items-center justify-center bg-slate-950 rounded-xl overflow-hidden min-h-[300px] sm:min-h-[400px] border border-slate-800 shadow-inner">
          <canvas
            ref={canvasRef}
            onClick={togglePlay}
            className={`max-h-[480px] w-auto object-contain cursor-pointer transition-all ${
              style.aspectRatio === '9:16' ? 'aspect-[9/16]' : style.aspectRatio === '1:1' ? 'aspect-square' : 'aspect-video'
            }`}
          />

          {/* Play/Pause Hover Overlay */}
          <button
            onClick={togglePlay}
            className={`absolute inset-0 m-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-950/80 hover:bg-blue-600 border border-blue-400/50 text-white shadow-2xl transition-all duration-200 hover:scale-110 cursor-pointer ${
              isPlaying ? 'opacity-0 hover:opacity-100' : 'opacity-90'
            }`}
            aria-label={isPlaying ? 'Pause preview' : 'Play preview'}
          >
            {isPlaying ? <Pause className="h-6 w-6 fill-white" /> : <Play className="h-6 w-6 fill-white ml-0.5" />}
          </button>
        </div>

        {/* Playback Controls & Scrubber Timeline */}
        <div className="flex items-center gap-3.5 bg-slate-50 dark:bg-[#121316] p-3 rounded-xl border border-slate-200 dark:border-white/[0.06]">
          <button
            onClick={togglePlay}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors shrink-0 cursor-pointer"
            aria-label={isPlaying ? 'Pause playback' : 'Play playback'}
          >
            {isPlaying ? <Pause className="h-4 w-4 fill-white" /> : <Play className="h-4 w-4 fill-white ml-0.5" />}
          </button>

          <div className="flex-1 space-y-1">
            <input
              type="range"
              min={0}
              max={audioDuration || 1}
              step={0.05}
              value={currentTime}
              onChange={(e) => handleSeek(Number(e.target.value))}
              className="w-full accent-blue-600 h-1.5 bg-slate-200 dark:bg-[#202227] rounded appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 dark:text-[#9ca3af] font-mono">
              <span>{formatDuration(currentTime)}</span>
              <span>{formatDuration(audioDuration)}</span>
            </div>
          </div>

          {/* Export Video Primary Button */}
          <button
            onClick={handleExportVideo}
            disabled={isExporting}
            className="flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 px-4 py-2 text-xs font-bold text-white transition-all shadow-sm disabled:opacity-50 shrink-0 cursor-pointer active:scale-95"
          >
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-white" />
                <span>Exporting ({exportProgress}%)...</span>
              </>
            ) : (
              <>
                <Download className="h-4 w-4 stroke-[2.5]" />
                <span>Download Video</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Status Notifications */}
      {successMessage && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/30 p-3 text-xs text-emerald-700 dark:text-emerald-300 font-mono">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
          <span>{successMessage}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-500/30 p-3 text-xs text-red-700 dark:text-red-300 font-mono">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {/* BOTTOM CONFIGURATION STUDIO (TABS) */}
      <div className="rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#1e2025] p-4 sm:p-6 space-y-5 shadow-sm">
        {/* Navigation Tabs Header */}
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-white/[0.06] pb-3 overflow-x-auto">
          {[
            { id: 'lyrics', label: '1. Lyrics & Song AI', icon: Music },
            { id: 'media', label: '2. Background Media', icon: ImageIcon },
            { id: 'style', label: '3. Typography & Colors', icon: Type },
            { id: 'effects', label: '4. Transitions & Effects', icon: Sparkles },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-[#9ca3af] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#16171a]'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: LYRICS & AUDIO SOURCE */}
        {activeTab === 'lyrics' && (
          <div className="space-y-5">
            {/* Audio Source Selector */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Custom Upload Dropzone */}
              <div
                onClick={() => audioInputRef.current?.click()}
                className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 dark:border-white/[0.12] bg-slate-50 dark:bg-[#16171a] p-5 hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-[#202227] transition-colors"
              >
                <input
                  ref={audioInputRef}
                  type="file"
                  accept="audio/*,.mp3,.wav,.m4a,.ogg,.flac"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) handleAudioUpload(e.target.files[0]);
                  }}
                />
                <Volume2 className="h-6 w-6 text-blue-600 dark:text-blue-400 mb-2" />
                <span className="text-xs font-bold text-slate-800 dark:text-white">
                  {audioFile ? audioFile.name : 'Upload Your Music (MP3, WAV, M4A)'}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-[#9ca3af] font-mono mt-0.5">
                  Click or drag audio file
                </span>
              </div>

              {/* Or Select Built-in Demo Beats */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-800 dark:text-white block">
                  Or select sample music track:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {DEMO_TRACKS.map((demo) => (
                    <button
                      key={demo.id}
                      onClick={() => loadDemoTrack(demo.id)}
                      className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                        selectedDemoId === demo.id && !audioFile
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 shadow-sm'
                          : 'border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#16171a] text-slate-600 dark:text-[#9ca3af] hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <span className="text-xs font-bold block truncate">{demo.name}</span>
                      <span className="text-[10px] font-mono text-slate-400">{demo.duration}s preview</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* AI Auto-Transcribe & Lyric Tools */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-slate-50 dark:bg-[#16171a] p-4 rounded-xl border border-slate-200 dark:border-white/[0.08]">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Wand2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-xs font-bold text-slate-900 dark:text-white">Multilingual Lyrics AI Engine</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-[#9ca3af]">
                  Auto-detect lyrics or auto-align pasted lyrics in <strong>Amharic (አማርኛ)</strong>, English, and 10+ languages to audio beats.
                </p>
              </div>

              {/* Language Selector + AI Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Language Select */}
                <div className="flex items-center gap-1.5 bg-white dark:bg-[#121316] px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-white/[0.08]">
                  <Globe className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                  <select
                    value={selectedLanguage}
                    onChange={(e) => {
                      setSelectedLanguage(e.target.value);
                      if (e.target.value === 'am' || e.target.value === 'ti') {
                        setStyle((prev) => ({ ...prev, fontFamily: 'Noto Sans Ethiopic' }));
                      }
                    }}
                    className="bg-transparent text-xs font-semibold text-slate-800 dark:text-white outline-none cursor-pointer"
                  >
                    {SUPPORTED_LANGUAGES.map((lang) => (
                      <option key={lang.code} value={lang.code} className="bg-white dark:bg-[#16171a] text-slate-900 dark:text-white">
                        {lang.name} ({lang.native})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Button 1: Auto-Detect */}
                <button
                  onClick={handleAutoDetectLyrics}
                  disabled={isAiDetecting}
                  className="flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer shadow-sm active:scale-95"
                >
                  {isAiDetecting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Detecting...</span>
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-3.5 w-3.5" />
                      <span>Auto-Detect Lyrics</span>
                    </>
                  )}
                </button>

                {/* Button 2: Auto-Align Pasted Lyrics */}
                <button
                  onClick={handleAutoAlignPastedLyrics}
                  disabled={isAligning}
                  title="Align whatever lyrics are in the editor to the audio beats"
                  className="flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer shadow-sm active:scale-95"
                >
                  {isAligning ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Aligning...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="h-3.5 w-3.5" />
                      <span>Auto-Align to Beats</span>
                    </>
                  )}
                </button>

                <input
                  ref={lrcInputRef}
                  type="file"
                  accept=".lrc,.srt,.txt"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        const content = ev.target?.result as string;
                        if (content) handleRawLrcChange(content);
                      };
                      reader.readAsText(file);
                    }
                  }}
                />

                <button
                  onClick={() => lrcInputRef.current?.click()}
                  className="flex items-center gap-1.5 rounded-lg bg-white dark:bg-[#121316] hover:bg-slate-100 dark:hover:bg-[#202227] border border-slate-200 dark:border-white/[0.08] text-slate-700 dark:text-[#d1d5db] px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer"
                >
                  <FileText className="h-3.5 w-3.5" />
                  <span>Import .LRC</span>
                </button>
              </div>
            </div>

            {(isAiDetecting || isAligning) && (
              <div className="flex items-center gap-2 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/40 p-3 text-xs text-blue-700 dark:text-blue-300 font-mono">
                <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                <span>{detectionProgress || 'Processing audio stream...'}</span>
              </div>
            )}

            {/* Time Nudge Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 dark:bg-[#16171a] border border-slate-200 dark:border-white/[0.08] text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-blue-500" />
                <span>Timeline Synchronization Shift:</span>
              </span>

              <div className="flex items-center gap-2 font-mono">
                <button
                  onClick={() => handleShiftTimestamps(-0.5)}
                  className="px-2.5 py-1 rounded bg-white dark:bg-[#121316] border border-slate-200 dark:border-white/[0.08] hover:bg-slate-100 dark:hover:bg-[#202227] text-slate-700 dark:text-white transition cursor-pointer"
                >
                  « -0.5s
                </button>
                <button
                  onClick={() => handleShiftTimestamps(0.5)}
                  className="px-2.5 py-1 rounded bg-white dark:bg-[#121316] border border-slate-200 dark:border-white/[0.08] hover:bg-slate-100 dark:hover:bg-[#202227] text-slate-700 dark:text-white transition cursor-pointer"
                >
                  +0.5s »
                </button>
              </div>
            </div>

            {/* Line by Line Interactive Editor */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                  <span>Synchronized Lyric Lines ({lyrics.length} lines)</span>
                </span>

                <button
                  onClick={handleAddLine}
                  className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Line</span>
                </button>
              </div>

              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {lyrics.map((line, idx) => (
                  <div
                    key={line.id}
                    className="flex items-center gap-2 bg-slate-50 dark:bg-[#16171a] border border-slate-200 dark:border-white/[0.08] p-2 rounded-lg text-xs"
                  >
                    {/* Timestamp Range Inputs */}
                    <div className="flex items-center gap-1 font-mono text-[11px] shrink-0 text-blue-600 dark:text-blue-400">
                      <input
                        type="number"
                        step={0.1}
                        value={line.start}
                        onChange={(e) => handleEditLine(idx, 'start', parseFloat(e.target.value) || 0)}
                        className="w-14 bg-white dark:bg-[#121316] border border-slate-200 dark:border-white/[0.08] rounded px-1.5 py-1 text-center text-slate-900 dark:text-white font-mono"
                        title="Start time (seconds)"
                      />
                      <span>→</span>
                      <input
                        type="number"
                        step={0.1}
                        value={line.end}
                        onChange={(e) => handleEditLine(idx, 'end', parseFloat(e.target.value) || 0)}
                        className="w-14 bg-white dark:bg-[#121316] border border-slate-200 dark:border-white/[0.08] rounded px-1.5 py-1 text-center text-slate-900 dark:text-white font-mono"
                        title="End time (seconds)"
                      />
                    </div>

                    {/* Lyric Text Input */}
                    <input
                      type="text"
                      value={line.text}
                      onChange={(e) => handleEditLine(idx, 'text', e.target.value)}
                      className="flex-1 bg-white dark:bg-[#121316] border border-slate-200 dark:border-white/[0.08] rounded px-2.5 py-1 text-slate-900 dark:text-white placeholder-slate-400 text-xs sm:text-sm font-sans"
                    />

                    {/* Action buttons */}
                    <button
                      onClick={() => handleSeek(line.start)}
                      className="p-1.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 cursor-pointer"
                      title="Jump to timestamp"
                    >
                      <Play className="h-3.5 w-3.5" />
                    </button>

                    <button
                      onClick={() => handleDeleteLine(idx)}
                      className="p-1.5 rounded text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer"
                      title="Delete line"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: BACKGROUND MEDIA */}
        {activeTab === 'media' && (
          <div className="space-y-5">
            {/* Custom Background Upload Dropzone */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-800 dark:text-white block">Custom Video or Image Background:</span>
              <div
                onClick={() => bgInputRef.current?.click()}
                className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 dark:border-white/[0.12] bg-slate-50 dark:bg-[#16171a] p-6 hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-[#202227] transition-colors"
              >
                <input
                  ref={bgInputRef}
                  type="file"
                  accept="image/*,video/*,.mp4,.webm,.mov,.jpg,.jpeg,.png,.webp"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) handleBgMediaUpload(e.target.files[0]);
                  }}
                />
                <ImageIcon className="h-7 w-7 text-blue-600 dark:text-blue-400 mb-2" />
                <span className="text-xs font-bold text-slate-800 dark:text-white">
                  {bgImageFile ? `Image: ${bgImageFile.name}` : bgVideoFile ? `Video: ${bgVideoFile.name}` : 'Upload Custom Image or Video'}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-[#9ca3af] font-mono mt-0.5">
                  Supports MP4, WebM, PNG, JPG, WebP
                </span>
              </div>
            </div>

            {/* Built-in Procedural Background Presets */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-800 dark:text-white block">
                Or select high-resolution procedural background:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {BACKGROUND_PRESETS.map((preset) => {
                  const isSelected = selectedPreset === preset.type && !bgImageUrl && !bgVideoUrl;
                  return (
                    <button
                      key={preset.id}
                      onClick={() => {
                        setSelectedPreset(preset.type);
                        setBgImageUrl(null);
                        setBgVideoUrl(null);
                        setBgImageFile(null);
                        setBgVideoFile(null);
                      }}
                      className={`h-24 rounded-xl border p-2 flex flex-col justify-end text-left relative overflow-hidden transition-all cursor-pointer ${
                        isSelected
                          ? 'border-blue-500 ring-2 ring-blue-500/50 shadow-lg'
                          : 'border-slate-200 dark:border-white/[0.08] hover:border-slate-400'
                      }`}
                      style={{ background: preset.previewColor }}
                    >
                      <div className="absolute inset-0 bg-black/20" />
                      <span className="relative z-10 text-[11px] font-bold text-white drop-shadow">
                        {preset.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Background Modifiers (Dimming & Blur) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 dark:bg-[#16171a] p-4 rounded-xl border border-slate-200 dark:border-white/[0.08]">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-800 dark:text-white font-medium">Background Dimming Overlay</span>
                  <span className="font-mono text-blue-600 dark:text-blue-400">{Math.round(style.backgroundDim * 100)}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={0.9}
                  step={0.05}
                  value={style.backgroundDim}
                  onChange={(e) => setStyle({ ...style, backgroundDim: parseFloat(e.target.value) })}
                  className="w-full accent-blue-600 h-1.5 bg-slate-200 dark:bg-[#121316] rounded appearance-none cursor-pointer"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-800 dark:text-white font-medium">Background Blur</span>
                  <span className="font-mono text-blue-600 dark:text-blue-400">{style.backgroundBlur}px</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={20}
                  step={1}
                  value={style.backgroundBlur}
                  onChange={(e) => setStyle({ ...style, backgroundBlur: parseInt(e.target.value, 10) })}
                  className="w-full accent-blue-600 h-1.5 bg-slate-200 dark:bg-[#121316] rounded appearance-none cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: TYPOGRAPHY, PLACEMENT & COLORS */}
        {activeTab === 'style' && (
          <div className="space-y-5">
            {/* Placement Options: Top / Middle / Bottom */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-800 dark:text-white block">Lyric Text Placement:</span>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'top', label: 'Top (Header Area)', icon: AlignVerticalJustifyStart },
                  { id: 'middle', label: 'Middle / Center (Karaoke)', icon: AlignVerticalJustifyCenter },
                  { id: 'bottom', label: 'Bottom (Classic Subtitle)', icon: AlignVerticalJustifyEnd },
                ].map((pos) => {
                  const Icon = pos.icon;
                  const isSelected = style.placement === pos.id;
                  return (
                    <button
                      key={pos.id}
                      onClick={() => setStyle({ ...style, placement: pos.id as any })}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border gap-1.5 transition-all cursor-pointer ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 shadow-sm'
                          : 'border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#16171a] text-slate-600 dark:text-[#9ca3af] hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="text-xs font-bold">{pos.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Typography Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 dark:bg-[#16171a] p-4 rounded-xl border border-slate-200 dark:border-white/[0.08]">
              {/* Font Family */}
              <div className="space-y-1.5">
                <span className="text-xs font-medium text-slate-800 dark:text-white">Font Family</span>
                <select
                  value={style.fontFamily}
                  onChange={(e) => setStyle({ ...style, fontFamily: e.target.value as any })}
                  className="w-full bg-white dark:bg-[#121316] border border-slate-200 dark:border-white/[0.08] rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white cursor-pointer"
                >
                  <option value="Noto Sans Ethiopic">Noto Sans Ethiopic (አማርኛ / Ge'ez)</option>
                  <option value="Abyssinica SIL">Abyssinica SIL (Ethiopic Calligraphy)</option>
                  <option value="Inter">Inter (Clean Modern)</option>
                  <option value="Cabinet Grotesk">Cabinet Grotesk (Bold Display)</option>
                  <option value="Playfair Display">Playfair Display (Elegant Serif)</option>
                  <option value="Space Mono">Space Mono (Cyber Terminal)</option>
                  <option value="Pacifico">Pacifico (Handwritten Wave)</option>
                </select>
              </div>

              {/* Font Size */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-800 dark:text-white font-medium">Font Scale</span>
                  <span className="font-mono text-blue-600 dark:text-blue-400">{style.fontSize}px</span>
                </div>
                <input
                  type="range"
                  min={32}
                  max={72}
                  step={2}
                  value={style.fontSize}
                  onChange={(e) => setStyle({ ...style, fontSize: parseInt(e.target.value, 10) })}
                  className="w-full accent-blue-600 h-1.5 bg-slate-200 dark:bg-[#121316] rounded appearance-none cursor-pointer"
                />
              </div>

              {/* Font Weight */}
              <div className="space-y-1.5">
                <span className="text-xs font-medium text-slate-800 dark:text-white">Font Weight</span>
                <div className="flex items-center rounded-lg bg-white dark:bg-[#121316] p-0.5 border border-slate-200 dark:border-white/[0.08]">
                  {[
                    { label: 'Regular', val: 'normal' },
                    { label: 'Semi-Bold', val: '600' },
                    { label: 'Extra-Bold', val: '800' },
                  ].map((w) => (
                    <button
                      key={w.val}
                      onClick={() => setStyle({ ...style, fontWeight: w.val as any })}
                      className={`flex-1 py-1 text-xs rounded transition-colors cursor-pointer ${
                        style.fontWeight === w.val
                          ? 'bg-blue-600 text-white font-bold'
                          : 'text-slate-600 dark:text-[#9ca3af] hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {w.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Colors & Highlight Swatches */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50 dark:bg-[#16171a] p-4 rounded-xl border border-slate-200 dark:border-white/[0.08]">
              {/* Inactive Lyric Color */}
              <div className="space-y-1.5">
                <span className="text-xs font-medium text-slate-800 dark:text-white">Base Text Color</span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={style.textColor}
                    onChange={(e) => setStyle({ ...style, textColor: e.target.value })}
                    className="h-8 w-8 rounded border border-slate-200 dark:border-white/[0.08] bg-transparent cursor-pointer"
                  />
                  <span className="text-xs font-mono text-slate-600 dark:text-slate-300">{style.textColor}</span>
                </div>
              </div>

              {/* Active / Highlight Color */}
              <div className="space-y-1.5">
                <span className="text-xs font-medium text-slate-800 dark:text-white">Active Highlight Color</span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={style.activeColor}
                    onChange={(e) => setStyle({ ...style, activeColor: e.target.value })}
                    className="h-8 w-8 rounded border border-slate-200 dark:border-white/[0.08] bg-transparent cursor-pointer"
                  />
                  <span className="text-xs font-mono text-blue-600 dark:text-blue-400">{style.activeColor}</span>
                </div>
              </div>

              {/* Glow Color */}
              <div className="space-y-1.5">
                <span className="text-xs font-medium text-slate-800 dark:text-white">Glow Color</span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={style.glowColor}
                    onChange={(e) => setStyle({ ...style, glowColor: e.target.value })}
                    className="h-8 w-8 rounded border border-slate-200 dark:border-white/[0.08] bg-transparent cursor-pointer"
                  />
                  <span className="text-xs font-mono text-slate-600 dark:text-slate-300">{style.glowColor}</span>
                </div>
              </div>

              {/* Background Pill Box Toggle */}
              <div className="space-y-1.5 flex flex-col justify-center">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-800 dark:text-white">
                  <input
                    type="checkbox"
                    checked={style.showPillBg}
                    onChange={(e) => setStyle({ ...style, showPillBg: e.target.checked })}
                    className="rounded border-slate-300 dark:border-white/[0.08] bg-white dark:bg-[#121316] text-blue-600 focus:ring-0"
                  />
                  <span>Text Backdrop Pill Box</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: TRANSITIONS & MUSICAL EFFECTS */}
        {activeTab === 'effects' && (
          <div className="space-y-5">
            {/* Transition Animation Selector */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-800 dark:text-white block">Lyric Entry & Transition Animation:</span>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {[
                  { id: 'karaoke', name: 'Karaoke Sweep', desc: 'Left-to-right highlight' },
                  { id: 'pop', name: 'Kinetic Pop', desc: 'Scale & slide bounce' },
                  { id: 'fade', name: 'Cinematic Fade', desc: 'Soft focus blur dissolve' },
                  { id: 'typewriter', name: 'Typewriter', desc: 'Character by character' },
                  { id: 'neon', name: 'Neon Flash', desc: 'Musical glow pulse' },
                  { id: 'wave', name: 'Wave Undulation', desc: 'Floating harmonic motion' },
                ].map((fx) => {
                  const isSelected = style.transitionEffect === fx.id;
                  return (
                    <button
                      key={fx.id}
                      onClick={() => setStyle({ ...style, transitionEffect: fx.id as any })}
                      className={`p-3 rounded-xl border text-left flex flex-col justify-between gap-1 transition-all cursor-pointer ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 shadow-sm'
                          : 'border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#16171a] text-slate-600 dark:text-[#9ca3af] hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <span className="text-xs font-bold block">{fx.name}</span>
                      <span className="text-[10px] text-slate-500 dark:text-[#9ca3af] leading-tight">{fx.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Classical Musical Note Accents & Atmosphere */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 dark:bg-[#16171a] p-4 rounded-xl border border-slate-200 dark:border-white/[0.08]">
              {/* Show Musical Note Particles */}
              <div className="space-y-1">
                <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-slate-800 dark:text-white">
                  <input
                    type="checkbox"
                    checked={style.showMusicalNotes}
                    onChange={(e) => setStyle({ ...style, showMusicalNotes: e.target.checked })}
                    className="rounded border-slate-300 dark:border-white/[0.08] bg-white dark:bg-[#121316] text-blue-600 focus:ring-0"
                  />
                  <span>Musical Notes (♪ ♫ ♩ ♬)</span>
                </label>
                <p className="text-[10px] text-slate-500 dark:text-[#9ca3af] pl-6">
                  Floating musical note icons during singing
                </p>
              </div>

              {/* Beat Pulse Zoom */}
              <div className="space-y-1">
                <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-slate-800 dark:text-white">
                  <input
                    type="checkbox"
                    checked={style.beatPulse}
                    onChange={(e) => setStyle({ ...style, beatPulse: e.target.checked })}
                    className="rounded border-slate-300 dark:border-white/[0.08] bg-white dark:bg-[#121316] text-blue-600 focus:ring-0"
                  />
                  <span>Audio Beat Pulse Zoom</span>
                </label>
                <p className="text-[10px] text-slate-500 dark:text-[#9ca3af] pl-6">
                  Subtle background zoom on musical beats
                </p>
              </div>

              {/* Bottom Subtle Waveform */}
              <div className="space-y-1">
                <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-slate-800 dark:text-white">
                  <input
                    type="checkbox"
                    checked={style.showWaveform}
                    onChange={(e) => setStyle({ ...style, showWaveform: e.target.checked })}
                    className="rounded border-slate-300 dark:border-white/[0.08] bg-white dark:bg-[#121316] text-blue-600 focus:ring-0"
                  />
                  <span>Bottom Waveform Aura</span>
                </label>
                <p className="text-[10px] text-slate-500 dark:text-[#9ca3af] pl-6">
                  Glowing sine wave line across the footer
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

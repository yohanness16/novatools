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
import { WorkspaceAlert } from './WorkspaceUI';
import { useHandoffFiles } from '../../lib/useHandoffFiles';
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
  const [selectedLanguage, setSelectedLanguage] = useState<string>('auto');
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

  useHandoffFiles((files) => {
    const f = files[0];
    if (!f) return;
    if (f.type.startsWith('audio/') || /\.(mp3|wav|m4a|ogg|aac|flac)$/i.test(f.name)) {
      handleAudioUpload(f);
    }
  });

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

  // Handle User Audio Upload (MP3, WAV, M4A, FLAC, etc.)
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

    // 1. Check if audio file has embedded ID3/M4A metadata lyrics
    const embedded = await LyricsVideoEngine.extractEmbeddedAudioLyrics(file);
    if (embedded && embedded.lyrics && embedded.lyrics.trim().length > 5) {
      if (embedded.isSynced) {
        const parsed = LyricsVideoEngine.parseLrc(embedded.lyrics);
        setLyrics(parsed);
        setRawLrcText(embedded.lyrics);
      } else {
        const { pcm, duration } = await SubtitleEngine.decodeAudioTo16k(file);
        const aligned = LyricsVideoEngine.autoAlignLyricsToAudio(pcm, duration, embedded.lyrics);
        setLyrics(aligned);
        setRawLrcText(LyricsVideoEngine.formatLrc(aligned));
      }
      setSuccessMessage(`Extracted embedded lyrics from "${file.name}"!`);
    } else {
      // Clear editor and prepare for Neural AI transcription
      setRawLrcText('');
      setLyrics([]);
      setSuccessMessage(`Loaded "${file.name}". Click "Extract Lyrics from Audio" to transcribe singing.`);
    }

    setTimeout(() => setSuccessMessage(null), 5000);
  };

  // Neural Speech Recognition & Lyric Extractor
  const handleAutoDetectLyrics = async () => {
    if (!audioFile && !audioUrl) {
      setError('Please upload an audio file first.');
      return;
    }

    setIsAiDetecting(true);
    setError(null);
    setDetectionProgress('Extracting and decoding audio stream at 16kHz Mono...');

    try {
      let targetBlob: Blob | File | null = audioFile;
      if (!targetBlob && audioUrl) {
        const resp = await fetch(audioUrl);
        targetBlob = await resp.blob();
      }

      if (!targetBlob) throw new Error('Audio stream unavailable');

      const extracted = await LyricsVideoEngine.transcribeAudioLyrics(
        targetBlob,
        { language: selectedLanguage },
        (p) => {
          setDetectionProgress(p.message);
        }
      );

      setLyrics(extracted);
      const lrc = LyricsVideoEngine.formatLrc(extracted);
      setRawLrcText(lrc);
      setSuccessMessage(`Successfully extracted and synced ${extracted.length} lyric lines from your song!`);
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      setError(err?.message || 'Lyrics extraction error. If this song has difficult backing music, paste your lyrics into the editor and click "Auto-Align to Beats".');
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
    setDetectionProgress('Analyzing audio acoustic energy & mapping lyric cadence...');

    try {
      let targetBlob: Blob | File | null = audioFile;
      if (!targetBlob && audioUrl) {
        const resp = await fetch(audioUrl);
        targetBlob = await resp.blob();
      }

      if (!targetBlob) throw new Error('Audio stream unavailable');

      const { pcm, duration } = await SubtitleEngine.decodeAudioTo16k(targetBlob);
      const aligned = LyricsVideoEngine.autoAlignLyricsToAudio(pcm, duration, rawLrcText);

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
      setError('Please add or extract lyrics before exporting.');
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
    <div className="w-full space-y-6">
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
      <div className="nt-card p-5 sm:p-6 space-y-4">
        {/* Screen Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--nt-border)] pb-3.5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#FEF7D6] dark:bg-[#FACC15]/15 text-[#CA8A04] dark:text-[#FACC15]">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="text-sm font-bold text-[#141413] dark:text-[#FAF7F0]">
              {audioFile ? audioFile.name : 'Lyrics Studio'}
            </span>
          </div>

          {/* Aspect Ratio Picker */}
          <div className="nt-well flex items-center gap-1 self-start sm:self-auto p-1">
            <span className="text-[10px] font-mono font-bold text-[#746D61] dark:text-[#938B7D] px-1.5">
              Canvas:
            </span>
            {[
              { id: '16:9', label: '16:9 Landscape' },
              { id: '9:16', label: '9:16 Shorts' },
              { id: '1:1', label: '1:1 Square' },
            ].map((ratio) => (
              <button
                key={ratio.id}
                type="button"
                onClick={() => setStyle({ ...style, aspectRatio: ratio.id as any })}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-mono transition-all cursor-pointer ${
                  style.aspectRatio === ratio.id
                    ? 'bg-[#FEF7D6] dark:bg-[#FACC15]/15 text-[#CA8A04] dark:text-[#FACC15] font-bold shadow-sm'
                    : 'text-[#454038] dark:text-[#CBC4B6] hover:text-[#141413] dark:hover:text-[#FAF7F0]'
                }`}
              >
                {ratio.label}
              </button>
            ))}
          </div>
        </div>

        {/* Live Canvas Monitor Viewport */}
        <div className="relative w-full flex items-center justify-center bg-[#141311] rounded-2xl overflow-hidden min-h-[300px] sm:min-h-[400px] border border-[var(--nt-border)] shadow-well">
          <canvas
            ref={canvasRef}
            onClick={togglePlay}
            className={`max-h-[480px] w-auto object-contain cursor-pointer transition-all ${
              style.aspectRatio === '9:16'
                ? 'aspect-[9/16]'
                : style.aspectRatio === '1:1'
                ? 'aspect-square'
                : 'aspect-video'
            }`}
          />

          {/* Play/Pause Hover Overlay */}
          <button
            type="button"
            onClick={togglePlay}
            className={`nt-btn-yellow absolute inset-0 m-auto flex h-14 w-14 items-center justify-center !rounded-full shadow-card-hover transition-all duration-200 ${
              isPlaying ? 'opacity-0 hover:opacity-100' : 'opacity-95'
            }`}
            aria-label={isPlaying ? 'Pause preview' : 'Play preview'}
          >
            {isPlaying ? <Pause className="h-6 w-6 fill-current" /> : <Play className="h-6 w-6 fill-current ml-0.5" />}
          </button>
        </div>

        {/* Playback Controls & Scrubber Timeline */}
        <div className="nt-well flex flex-wrap sm:flex-nowrap items-center gap-3.5 p-3.5">
          <button
            type="button"
            onClick={togglePlay}
            className="nt-btn-yellow flex h-9 w-9 items-center justify-center shrink-0"
            aria-label={isPlaying ? 'Pause playback' : 'Play playback'}
          >
            {isPlaying ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current ml-0.5" />}
          </button>

          <div className="flex-1 min-w-[140px] space-y-1">
            <input
              type="range"
              min={0}
              max={audioDuration || 1}
              step={0.05}
              value={currentTime}
              onChange={(e) => handleSeek(Number(e.target.value))}
              className="w-full h-1.5 bg-white dark:bg-[#141311] rounded appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-[#746D61] dark:text-[#938B7D] font-mono font-bold">
              <span>{formatDuration(currentTime)}</span>
              <span>{formatDuration(audioDuration)}</span>
            </div>
          </div>

          {/* Export Video Primary Button */}
          <button
            type="button"
            onClick={handleExportVideo}
            disabled={isExporting}
            className="nt-btn-yellow flex items-center gap-2 px-4 py-2 text-xs shrink-0 disabled:opacity-50"
          >
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
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
      {successMessage && <WorkspaceAlert variant="success" message={successMessage} />}
      {error && <WorkspaceAlert variant="error" message={error} />}

      {/* BOTTOM CONFIGURATION STUDIO (TABS) */}
      <div className="nt-card p-5 sm:p-6 space-y-5">
        {/* Navigation Tabs Header */}
        <div className="flex items-center gap-2 border-b border-[var(--nt-border)] pb-3.5 overflow-x-auto">
          {[
            { id: 'lyrics', label: '1. Lyrics & Audio Extractor', icon: Music },
            { id: 'media', label: '2. Background Media', icon: ImageIcon },
            { id: 'style', label: '3. Typography & Colors', icon: Type },
            { id: 'effects', label: '4. Transitions & Effects', icon: Sparkles },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold whitespace-nowrap transition-all ${
                  isActive ? 'nt-btn-yellow' : 'nt-btn-secondary'
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
                className="nt-dropzone flex cursor-pointer flex-col items-center justify-center p-6 text-center"
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
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FEF7D6] dark:bg-[#FACC15]/15 text-[#CA8A04] dark:text-[#FACC15] mb-2.5">
                  <Volume2 className="h-5 w-5" />
                </div>
                <span className="text-xs font-extrabold text-[#141413] dark:text-[#FAF7F0]">
                  {audioFile ? audioFile.name : 'Upload Your Music (MP3, WAV, M4A, FLAC)'}
                </span>
                <span className="text-[10px] text-[#746D61] dark:text-[#938B7D] font-mono mt-1">
                  Click or drag audio file
                </span>
              </div>

              {/* Or Select Built-in Demo Beats */}
              <div className="nt-well p-4 space-y-2.5">
                <span className="text-xs font-extrabold text-[#141413] dark:text-[#FAF7F0] block">
                  Or select sample music track:
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {DEMO_TRACKS.map((demo) => {
                    const isSelected = selectedDemoId === demo.id && !audioFile;
                    return (
                      <button
                        key={demo.id}
                        type="button"
                        onClick={() => loadDemoTrack(demo.id)}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'border-[#141413] dark:border-[#FACC15] bg-[#FEF7D6] dark:bg-[#FACC15]/15 text-[#141413] dark:text-[#FAF7F0] shadow-sm'
                            : 'nt-subcard text-[#454038] dark:text-[#CBC4B6] hover:border-[var(--nt-border-strong)]'
                        }`}
                      >
                        <span className="text-xs font-extrabold block truncate">{demo.name}</span>
                        <span className="text-[10px] font-mono text-[#746D61] dark:text-[#938B7D]">
                          {demo.duration}s preview
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* AI Auto-Transcribe & Lyric Tools */}
            <div className="nt-well flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 p-4">
              <div className="flex items-center gap-2">
                <Wand2 className="h-4 w-4 text-[#CA8A04] dark:text-[#FACC15]" />
                <span className="text-xs font-bold text-[#141413] dark:text-[#FAF7F0]">
                  Auto-Transcribe
                </span>
              </div>

              {/* Language Selector + AI Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="nt-input flex items-center gap-1.5 px-2.5 py-1.5">
                  <Globe className="h-3.5 w-3.5 text-[#CA8A04] dark:text-[#FACC15]" />
                  <select
                    value={selectedLanguage}
                    onChange={(e) => {
                      setSelectedLanguage(e.target.value);
                      if (e.target.value === 'am' || e.target.value === 'ti') {
                        setStyle((prev) => ({ ...prev, fontFamily: 'Noto Sans Ethiopic' }));
                      }
                    }}
                    className="bg-transparent text-xs font-bold text-[#141413] dark:text-[#FAF7F0] outline-none cursor-pointer"
                  >
                    {SUPPORTED_LANGUAGES.map((lang) => (
                      <option key={lang.code} value={lang.code} className="bg-white dark:bg-[#1F1D19] text-[#141413] dark:text-[#FAF7F0]">
                        {lang.name} ({lang.native})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Button 1: Extract from Uploaded Song */}
                <button
                  type="button"
                  onClick={handleAutoDetectLyrics}
                  disabled={isAiDetecting}
                  className="nt-btn-yellow flex items-center gap-1.5 px-3.5 py-1.5 text-xs disabled:opacity-50"
                >
                  {isAiDetecting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Transcribing Audio...</span>
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-3.5 w-3.5" />
                      <span>Extract Lyrics from Audio</span>
                    </>
                  )}
                </button>

                {/* Button 2: Auto-Align Pasted Lyrics */}
                <button
                  type="button"
                  onClick={handleAutoAlignPastedLyrics}
                  disabled={isAligning}
                  title="Align whatever lyrics are in the editor to the audio beats"
                  className="nt-btn-primary flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold disabled:opacity-50"
                >
                  {isAligning ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Aligning...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="h-3.5 w-3.5 text-[#FACC15]" />
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
                  type="button"
                  onClick={() => lrcInputRef.current?.click()}
                  className="nt-btn-secondary flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold"
                >
                  <FileText className="h-3.5 w-3.5" />
                  <span>Import .LRC</span>
                </button>
              </div>
            </div>

            {(isAiDetecting || isAligning) && (
              <WorkspaceAlert variant="info" message={detectionProgress || 'Processing audio stream...'} />
            )}

            {/* Time Nudge Controls */}
            <div className="nt-well flex flex-wrap items-center justify-between gap-3 p-3.5 text-xs">
              <span className="font-extrabold text-[#141413] dark:text-[#FAF7F0] flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-[#CA8A04] dark:text-[#FACC15]" />
                <span>Timeline Synchronization Shift:</span>
              </span>

              <div className="flex items-center gap-2 font-mono">
                <button
                  type="button"
                  onClick={() => handleShiftTimestamps(-0.5)}
                  className="nt-btn-secondary px-2.5 py-1 text-xs font-bold"
                >
                  « -0.5s
                </button>
                <button
                  type="button"
                  onClick={() => handleShiftTimestamps(0.5)}
                  className="nt-btn-secondary px-2.5 py-1 text-xs font-bold"
                >
                  +0.5s »
                </button>
              </div>
            </div>

            {/* Textarea for Pasting Lyrics */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-[#141413] dark:text-[#FAF7F0] flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-[#CA8A04] dark:text-[#FACC15]" />
                  <span>Raw Lyrics Text Editor (Type, Paste, or Edit):</span>
                </span>
                <span className="nt-badge-yellow px-2 py-0.5 text-[10px] font-mono font-bold">
                  {lyrics.length} synced lines
                </span>
              </div>
              <textarea
                value={rawLrcText}
                onChange={(e) => handleRawLrcChange(e.target.value)}
                placeholder="Paste lyrics in Amharic (አማርኛ), English, or any language here and click 'Auto-Align to Beats', or click 'Extract Lyrics from Audio' to transcribe directly..."
                className="nt-input w-full h-32 p-3 font-mono text-xs leading-relaxed"
              />
            </div>

            {/* Line by Line Interactive Editor */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-[#141413] dark:text-[#FAF7F0] flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-[#CA8A04] dark:text-[#FACC15]" />
                  <span>Synchronized Lyric Lines</span>
                </span>

                <button
                  type="button"
                  onClick={handleAddLine}
                  className="nt-btn-secondary flex items-center gap-1 px-2.5 py-1 text-xs font-bold"
                >
                  <Plus className="h-3.5 w-3.5 text-[#CA8A04] dark:text-[#FACC15]" />
                  <span>Add Line</span>
                </button>
              </div>

              {lyrics.length === 0 ? (
                <div className="nt-well p-8 text-center text-xs text-[#746D61] dark:text-[#938B7D]">
                  No lyrics currently loaded. Upload your song and click{' '}
                  <strong className="text-[#141413] dark:text-[#FAF7F0]">&quot;Extract Lyrics from Audio&quot;</strong> or paste your lyrics above.
                </div>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1 custom-scrollbar">
                  {lyrics.map((line, idx) => (
                    <div
                      key={line.id}
                      className="nt-subcard flex items-center gap-2 p-2.5 text-xs"
                    >
                      {/* Timestamp Range Inputs */}
                      <div className="flex items-center gap-1 font-mono text-[11px] shrink-0 text-[#454038] dark:text-[#CBC4B6]">
                        <input
                          type="number"
                          step={0.1}
                          value={line.start}
                          onChange={(e) => handleEditLine(idx, 'start', parseFloat(e.target.value) || 0)}
                          className="nt-input w-14 px-1.5 py-1 text-center font-mono text-xs"
                          title="Start time (seconds)"
                        />
                        <span>→</span>
                        <input
                          type="number"
                          step={0.1}
                          value={line.end}
                          onChange={(e) => handleEditLine(idx, 'end', parseFloat(e.target.value) || 0)}
                          className="nt-input w-14 px-1.5 py-1 text-center font-mono text-xs"
                          title="End time (seconds)"
                        />
                      </div>

                      {/* Lyric Text Input */}
                      <input
                        type="text"
                        value={line.text}
                        onChange={(e) => handleEditLine(idx, 'text', e.target.value)}
                        className="nt-input flex-1 px-2.5 py-1 text-xs sm:text-sm font-sans"
                      />

                      {/* Action buttons */}
                      <button
                        type="button"
                        onClick={() => handleSeek(line.start)}
                        className="nt-btn-secondary p-1.5"
                        title="Jump to timestamp"
                      >
                        <Play className="h-3.5 w-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteLine(idx)}
                        className="nt-btn-secondary p-1.5 hover:text-[#B91C1C]"
                        title="Delete line"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: BACKGROUND MEDIA */}
        {activeTab === 'media' && (
          <div className="space-y-5">
            <div className="space-y-2">
              <span className="text-xs font-extrabold text-[#141413] dark:text-[#FAF7F0] block">
                Custom Video or Image Background:
              </span>
              <div
                onClick={() => bgInputRef.current?.click()}
                className="nt-dropzone flex cursor-pointer flex-col items-center justify-center p-6 text-center"
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
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FEF7D6] dark:bg-[#FACC15]/15 text-[#CA8A04] dark:text-[#FACC15] mb-2.5">
                  <ImageIcon className="h-5 w-5" />
                </div>
                <span className="text-xs font-extrabold text-[#141413] dark:text-[#FAF7F0]">
                  {bgImageFile ? `Image: ${bgImageFile.name}` : bgVideoFile ? `Video: ${bgVideoFile.name}` : 'Upload Custom Image or Video'}
                </span>
                <span className="text-[10px] text-[#746D61] dark:text-[#938B7D] font-mono mt-1">
                  Supports MP4, WebM, PNG, JPG, WebP
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-extrabold text-[#141413] dark:text-[#FAF7F0] block">
                Or select high-resolution procedural background:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {BACKGROUND_PRESETS.map((preset) => {
                  const isSelected = selectedPreset === preset.type && !bgImageUrl && !bgVideoUrl;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        setSelectedPreset(preset.type);
                        setBgImageUrl(null);
                        setBgVideoUrl(null);
                        setBgImageFile(null);
                        setBgVideoFile(null);
                      }}
                      className={`h-24 rounded-xl border p-2.5 flex flex-col justify-end text-left relative overflow-hidden transition-all cursor-pointer shadow-card ${
                        isSelected
                          ? 'border-[#FACC15] ring-2 ring-[#FACC15]/70'
                          : 'border-[var(--nt-border)] hover:border-[var(--nt-border-strong)]'
                      }`}
                      style={{ background: preset.previewColor }}
                    >
                      <div className="absolute inset-0 bg-black/25" />
                      <span className="relative z-10 text-[11px] font-extrabold text-white drop-shadow">
                        {preset.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="nt-well grid grid-cols-1 sm:grid-cols-2 gap-4 p-4">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-[#141413] dark:text-[#FAF7F0]">Background Dimming Overlay</span>
                  <span className="font-mono text-[#CA8A04] dark:text-[#FACC15]">
                    {Math.round(style.backgroundDim * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={0.9}
                  step={0.05}
                  value={style.backgroundDim}
                  onChange={(e) => setStyle({ ...style, backgroundDim: parseFloat(e.target.value) })}
                  className="w-full h-1.5 bg-white dark:bg-[#141311] rounded appearance-none cursor-pointer"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-[#141413] dark:text-[#FAF7F0]">Background Blur</span>
                  <span className="font-mono text-[#CA8A04] dark:text-[#FACC15]">{style.backgroundBlur}px</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={20}
                  step={1}
                  value={style.backgroundBlur}
                  onChange={(e) => setStyle({ ...style, backgroundBlur: parseInt(e.target.value, 10) })}
                  className="w-full h-1.5 bg-white dark:bg-[#141311] rounded appearance-none cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: TYPOGRAPHY, PLACEMENT & COLORS */}
        {activeTab === 'style' && (
          <div className="space-y-5">
            <div className="space-y-2">
              <span className="text-xs font-extrabold text-[#141413] dark:text-[#FAF7F0] block">
                Lyric Text Placement:
              </span>
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
                      type="button"
                      onClick={() => setStyle({ ...style, placement: pos.id as any })}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border gap-1.5 transition-all cursor-pointer ${
                        isSelected
                          ? 'border-[#141413] dark:border-[#FACC15] bg-[#FEF7D6] dark:bg-[#FACC15]/15 text-[#141413] dark:text-[#FAF7F0] shadow-card'
                          : 'nt-subcard text-[#454038] dark:text-[#CBC4B6] hover:border-[var(--nt-border-strong)]'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="text-xs font-bold">{pos.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="nt-well grid grid-cols-1 sm:grid-cols-3 gap-4 p-4">
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-[#141413] dark:text-[#FAF7F0] block">Font Family</span>
                <select
                  value={style.fontFamily}
                  onChange={(e) => setStyle({ ...style, fontFamily: e.target.value as any })}
                  className="nt-input w-full px-2.5 py-1.5 text-xs font-semibold cursor-pointer"
                >
                  <option value="Noto Sans Ethiopic">Noto Sans Ethiopic (አማርኛ / Ge&apos;ez)</option>
                  <option value="Abyssinica SIL">Abyssinica SIL (Ethiopic Calligraphy)</option>
                  <option value="Inter">Inter (Clean Modern)</option>
                  <option value="Cabinet Grotesk">Cabinet Grotesk (Bold Display)</option>
                  <option value="Playfair Display">Playfair Display (Elegant Serif)</option>
                  <option value="Space Mono">Space Mono (Cyber Terminal)</option>
                  <option value="Pacifico">Pacifico (Handwritten Wave)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-[#141413] dark:text-[#FAF7F0]">Font Scale</span>
                  <span className="font-mono text-[#CA8A04] dark:text-[#FACC15]">{style.fontSize}px</span>
                </div>
                <input
                  type="range"
                  min={32}
                  max={72}
                  step={2}
                  value={style.fontSize}
                  onChange={(e) => setStyle({ ...style, fontSize: parseInt(e.target.value, 10) })}
                  className="w-full h-1.5 bg-white dark:bg-[#141311] rounded appearance-none cursor-pointer"
                />
              </div>

              <div className="space-y-1.5">
                <span className="text-xs font-bold text-[#141413] dark:text-[#FAF7F0] block">Font Weight</span>
                <div className="nt-subcard flex items-center p-1 gap-1">
                  {[
                    { label: 'Regular', val: 'normal' },
                    { label: 'Semi-Bold', val: '600' },
                    { label: 'Extra-Bold', val: '800' },
                  ].map((w) => (
                    <button
                      key={w.val}
                      type="button"
                      onClick={() => setStyle({ ...style, fontWeight: w.val as any })}
                      className={`flex-1 py-1 text-xs rounded-md font-bold transition-colors cursor-pointer ${
                        style.fontWeight === w.val
                          ? 'bg-[#FEF7D6] dark:bg-[#FACC15]/15 text-[#CA8A04] dark:text-[#FACC15]'
                          : 'text-[#746D61] dark:text-[#938B7D] hover:text-[#141413] dark:hover:text-[#FAF7F0]'
                      }`}
                    >
                      {w.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="nt-well grid grid-cols-2 sm:grid-cols-4 gap-4 p-4">
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-[#141413] dark:text-[#FAF7F0]">Base Text Color</span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={style.textColor}
                    onChange={(e) => setStyle({ ...style, textColor: e.target.value })}
                    className="h-8 w-8 rounded border border-[var(--nt-border)] bg-transparent cursor-pointer"
                  />
                  <span className="text-xs font-mono text-[#454038] dark:text-[#CBC4B6]">{style.textColor}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-xs font-bold text-[#141413] dark:text-[#FAF7F0]">Active Highlight</span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={style.activeColor}
                    onChange={(e) => setStyle({ ...style, activeColor: e.target.value })}
                    className="h-8 w-8 rounded border border-[var(--nt-border)] bg-transparent cursor-pointer"
                  />
                  <span className="text-xs font-mono text-[#141413] dark:text-[#FACC15]">{style.activeColor}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-xs font-bold text-[#141413] dark:text-[#FAF7F0]">Glow Color</span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={style.glowColor}
                    onChange={(e) => setStyle({ ...style, glowColor: e.target.value })}
                    className="h-8 w-8 rounded border border-[var(--nt-border)] bg-transparent cursor-pointer"
                  />
                  <span className="text-xs font-mono text-[#454038] dark:text-[#CBC4B6]">{style.glowColor}</span>
                </div>
              </div>

              <div className="space-y-1.5 flex flex-col justify-center">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-[#141413] dark:text-[#FAF7F0]">
                  <input
                    type="checkbox"
                    checked={style.showPillBg}
                    onChange={(e) => setStyle({ ...style, showPillBg: e.target.checked })}
                    className="rounded border-[var(--nt-border-strong)] accent-[#141413] dark:accent-[#FACC15]"
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
            <div className="space-y-2">
              <span className="text-xs font-extrabold text-[#141413] dark:text-[#FAF7F0] block">
                Lyric Entry &amp; Transition Animation:
              </span>
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
                      type="button"
                      onClick={() => setStyle({ ...style, transitionEffect: fx.id as any })}
                      className={`p-3 rounded-xl border text-left flex flex-col justify-between gap-1 transition-all cursor-pointer ${
                        isSelected
                          ? 'border-[#141413] dark:border-[#FACC15] bg-[#FEF7D6] dark:bg-[#FACC15]/15 text-[#141413] dark:text-[#FAF7F0] shadow-card'
                          : 'nt-subcard text-[#454038] dark:text-[#CBC4B6] hover:border-[var(--nt-border-strong)]'
                      }`}
                    >
                      <span className="text-xs font-extrabold block">{fx.name}</span>
                      <span className="text-[10px] text-[#746D61] dark:text-[#938B7D] leading-tight">
                        {fx.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="nt-well grid grid-cols-1 sm:grid-cols-3 gap-4 p-4">
              <div className="space-y-1">
                <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-[#141413] dark:text-[#FAF7F0]">
                  <input
                    type="checkbox"
                    checked={style.showMusicalNotes}
                    onChange={(e) => setStyle({ ...style, showMusicalNotes: e.target.checked })}
                    className="rounded border-[var(--nt-border-strong)] accent-[#141413] dark:accent-[#FACC15]"
                  />
                  <span>Musical Notes (♪ ♫ ♩ ♬)</span>
                </label>
                <p className="text-[10px] text-[#746D61] dark:text-[#938B7D] pl-6">
                  Floating musical note icons during singing
                </p>
              </div>

              <div className="space-y-1">
                <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-[#141413] dark:text-[#FAF7F0]">
                  <input
                    type="checkbox"
                    checked={style.beatPulse}
                    onChange={(e) => setStyle({ ...style, beatPulse: e.target.checked })}
                    className="rounded border-[var(--nt-border-strong)] accent-[#141413] dark:accent-[#FACC15]"
                  />
                  <span>Audio Beat Pulse Zoom</span>
                </label>
                <p className="text-[10px] text-[#746D61] dark:text-[#938B7D] pl-6">
                  Subtle background zoom on musical beats
                </p>
              </div>

              <div className="space-y-1">
                <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-[#141413] dark:text-[#FAF7F0]">
                  <input
                    type="checkbox"
                    checked={style.showWaveform}
                    onChange={(e) => setStyle({ ...style, showWaveform: e.target.checked })}
                    className="rounded border-[var(--nt-border-strong)] accent-[#141413] dark:accent-[#FACC15]"
                  />
                  <span>Bottom Waveform Aura</span>
                </label>
                <p className="text-[10px] text-[#746D61] dark:text-[#938B7D] pl-6">
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

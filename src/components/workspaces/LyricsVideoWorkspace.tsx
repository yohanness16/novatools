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
  Volume2
} from 'lucide-react';

const INITIAL_STYLE: LyricsVideoStyle = {
  placement: 'middle',
  fontFamily: 'Inter',
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

export const LyricsVideoWorkspace: React.FC = () => {
  // Audio state
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioDuration, setAudioDuration] = useState<number>(18);
  const [selectedDemoId, setSelectedDemoId] = useState<string>('lofi-sunset');

  // Background media state
  const [bgImageFile, setBgImageFile] = useState<File | null>(null);
  const [bgImageUrl, setBgImageUrl] = useState<string | null>(null);
  const [bgVideoFile, setBgVideoFile] = useState<File | null>(null);
  const [bgVideoUrl, setBgVideoUrl] = useState<string | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<string>('nebula');

  // Lyrics state
  const [lyrics, setLyrics] = useState<LyricLine[]>([]);
  const [rawLrcText, setRawLrcText] = useState<string>('');
  const [isAiTranscribing, setIsAiTranscribing] = useState(false);
  const [transcriptionProgress, setTranscriptionProgress] = useState<string>('');

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

  // DOM Refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const bgImgRef = useRef<HTMLImageElement | null>(null);
  const bgVideoRef = useRef<HTMLVideoElement | null>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);
  const lrcInputRef = useRef<HTMLInputElement>(null);
  const animFrameRef = useRef<number | null>(null);

  // Initialize with default demo track on mount
  useEffect(() => {
    loadDemoTrack('lofi-sunset');
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

    // Initial basic timestamp skeleton based on audio file length
    const initialText = `[00:01.00] Enter your first lyric line here ♪\n[00:05.00] Add second line of music ♫\n[00:09.00] Click "AI Transcribe" to detect speech automatically!`;
    setRawLrcText(initialText);
    setLyrics(LyricsVideoEngine.parseLrc(initialText));
  };

  // AI Speech Recognition & Lyric Generator
  const handleAiTranscribe = async () => {
    if (!audioFile && !audioUrl) {
      setError('Please load an audio file first.');
      return;
    }

    setIsAiTranscribing(true);
    setError(null);
    setTranscriptionProgress('Extracting and analyzing audio frequencies...');

    try {
      let targetBlob: Blob | File | null = audioFile;
      if (!targetBlob && audioUrl) {
        const resp = await fetch(audioUrl);
        targetBlob = await resp.blob();
      }

      if (!targetBlob) throw new Error('Audio stream unavailable');

      const cues = await SubtitleEngine.generateSubtitles(
        targetBlob,
        { language: 'auto', task: 'transcribe' },
        (p) => {
          setTranscriptionProgress(p.message);
        }
      );

      const mapped: LyricLine[] = cues.map((c) => ({
        id: c.id,
        start: c.start,
        end: c.end,
        text: c.text,
      }));

      setLyrics(mapped);
      setRawLrcText(LyricsVideoEngine.formatLrc(mapped));
    } catch (err: any) {
      setError('Lyrics recognition note: ' + (err?.message || err));
    } finally {
      setIsAiTranscribing(false);
    }
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
      text: 'New lyric line ♪',
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
      const time = audioRef.current?.currentTime || currentTime;

      const bgMedia = {
        image: bgImgRef.current,
        video: bgVideoRef.current,
        preset: selectedPreset as any,
      };

      LyricsVideoEngine.renderFrame(ctx, canvas, time, lyrics, style, bgMedia);
      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [currentTime, lyrics, style, selectedPreset, bgImageUrl, bgVideoUrl]);

  // Export Lyrics Video
  const handleExportVideo = async () => {
    if (!canvasRef.current || !audioUrl) {
      setError('Please ensure audio and lyrics are loaded.');
      return;
    }

    setIsExporting(true);
    setExportProgress(0);
    setExportMessage('Initializing video compilation...');
    setError(null);

    // Pause live preview during export
    if (audioRef.current) audioRef.current.pause();
    setIsPlaying(false);

    try {
      let audioBlob: Blob;
      if (audioFile) {
        audioBlob = audioFile;
      } else {
        const resp = await fetch(audioUrl);
        audioBlob = await resp.blob();
      }

      const bgMedia = {
        image: bgImgRef.current,
        video: bgVideoRef.current,
        preset: selectedPreset as any,
      };

      const finalDuration = audioDuration || 15;

      const videoBlob = await LyricsVideoEngine.exportVideo(
        canvasRef.current,
        audioBlob,
        lyrics,
        style,
        bgMedia,
        finalDuration,
        (progress, msg) => {
          setExportProgress(progress);
          setExportMessage(msg);
        }
      );

      const baseName = audioFile ? audioFile.name.replace(/\.[^/.]+$/, '') : 'lyrics_video';
      downloadBlob(videoBlob, `${baseName}_animated_lyrics.webm`);
    } catch (err: any) {
      setError('Video export failed: ' + (err?.message || err));
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      
      {/* Hidden Media Elements for Drawing */}
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
          onLoadedMetadata={(e) => setAudioDuration(e.currentTarget.duration || 18)}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => setIsPlaying(false)}
          className="hidden"
        />
      )}

      {bgImageUrl && (
        <img ref={bgImgRef} src={bgImageUrl} alt="Background" className="hidden" crossOrigin="anonymous" />
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
      <div className="rounded-2xl border border-slate-700/60 dark:border-white/15 bg-[#060913] p-4 sm:p-5 shadow-2xl space-y-4">
        
        {/* Screen Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 dark:border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/30">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight">
                Live Lyrics Video Studio Preview
              </h2>
              <p className="text-[11px] font-mono text-slate-400">
                Synchronized typography, transitions, musical notes & procedural backgrounds
              </p>
            </div>
          </div>

          {/* Aspect Ratio Picker */}
          <div className="flex items-center gap-1.5 self-start sm:self-auto bg-[#090E1F] p-1 rounded-lg border border-slate-800">
            <span className="text-[10px] font-mono text-slate-500 px-1">Canvas:</span>
            {[
              { id: '16:9', label: '16:9 Landscape' },
              { id: '9:16', label: '9:16 Shorts' },
              { id: '1:1', label: '1:1 Square' },
            ].map((ratio) => (
              <button
                key={ratio.id}
                onClick={() => setStyle({ ...style, aspectRatio: ratio.id as any })}
                className={`px-2.5 py-1 rounded text-[10px] font-mono transition-colors ${
                  style.aspectRatio === ratio.id
                    ? 'bg-sky-600 text-white font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {ratio.label}
              </button>
            ))}
          </div>
        </div>

        {/* Live Canvas Monitor Viewport */}
        <div className="relative w-full flex items-center justify-center bg-black/80 rounded-xl overflow-hidden min-h-[300px] sm:min-h-[400px] border border-slate-800 shadow-inner">
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
            className={`absolute inset-0 m-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-950/80 hover:bg-sky-600 border border-sky-400/50 text-white shadow-2xl transition-all duration-200 hover:scale-110 cursor-pointer ${
              isPlaying ? 'opacity-0 hover:opacity-100' : 'opacity-90'
            }`}
            aria-label={isPlaying ? 'Pause preview' : 'Play preview'}
          >
            {isPlaying ? <Pause className="h-6 w-6 fill-white" /> : <Play className="h-6 w-6 fill-white ml-0.5" />}
          </button>
        </div>

        {/* Playback Controls & Scrubber Timeline */}
        <div className="flex items-center gap-3.5 bg-[#090E1F] p-3 rounded-xl border border-slate-800">
          <button
            onClick={togglePlay}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-600 hover:bg-sky-500 text-white transition-colors shrink-0 cursor-pointer"
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
              className="w-full accent-sky-400 h-1.5 bg-[#131418] rounded appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>{formatDuration(currentTime)}</span>
              <span>{formatDuration(audioDuration)}</span>
            </div>
          </div>

          {/* Export Video Primary Button */}
          <button
            onClick={handleExportVideo}
            disabled={isExporting}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 px-4 py-2 text-xs font-bold text-slate-950 transition-all shadow-lg shadow-emerald-950/30 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 shrink-0 cursor-pointer"
          >
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-slate-950" />
                <span>Exporting ({exportProgress}%)...</span>
              </>
            ) : (
              <>
                <Download className="h-4 w-4 stroke-[2.5]" />
                <span>Download Lyrics Video</span>
              </>
            )}
          </button>
        </div>

      </div>


      {/* BOTTOM CONFIGURATION STUDIO (TABS) */}
      <div className="rounded-2xl border border-[#2A2D33] bg-[#131418] p-4 sm:p-6 space-y-5">
        
        {/* Navigation Tabs Header */}
        <div className="flex items-center gap-2 border-b border-[#2A2D33] pb-3 overflow-x-auto">
          {[
            { id: 'lyrics', label: '1. Lyrics & Music', icon: Music },
            { id: 'media', label: '2. Background Media', icon: ImageIcon },
            { id: 'style', label: '3. Typography & Colors', icon: Type },
            { id: 'effects', label: '4. Transitions & Notes', icon: Sparkles },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'text-[#8B8F98] hover:text-[#ECEDEF] hover:bg-[#1B1D22]'
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
          <div className="space-y-5 animate-fade-in">
            {/* Audio Source Selector */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Custom Upload Dropzone */}
              <div
                onClick={() => audioInputRef.current?.click()}
                className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-[#2A2D33] bg-[#1B1D22] p-5 hover:border-sky-500 hover:bg-[#151820] transition-colors"
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
                <Volume2 className="h-6 w-6 text-sky-400 mb-2" />
                <span className="text-xs font-bold text-white">
                  {audioFile ? audioFile.name : 'Upload Your Music (MP3, WAV, M4A)'}
                </span>
                <span className="text-[10px] text-[#8B8F98] font-mono mt-0.5">
                  Click or drag audio file
                </span>
              </div>

              {/* Or Select Built-in Demo Beats */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-[#ECEDEF] block">
                  Or select sample music track:
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {DEMO_TRACKS.map((demo) => (
                    <button
                      key={demo.id}
                      onClick={() => loadDemoTrack(demo.id)}
                      className={`p-2.5 rounded-lg border text-left transition-all ${
                        selectedDemoId === demo.id && !audioFile
                          ? 'border-sky-500 bg-[#16233F] text-sky-300 shadow-sm'
                          : 'border-[#2A2D33] bg-[#1B1D22] text-[#8B8F98] hover:text-white'
                      }`}
                    >
                      <span className="text-xs font-bold block truncate">{demo.name}</span>
                      <span className="text-[10px] font-mono text-[#8B8F98]">{demo.duration}s preview</span>
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* AI Auto-Transcribe & Lyric Tools */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#1B1D22] p-3.5 rounded-xl border border-[#2A2D33]">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Wand2 className="h-4 w-4 text-sky-400" />
                  <span className="text-xs font-bold text-white">Speech & Lyrics AI Extractor</span>
                </div>
                <p className="text-[11px] text-[#8B8F98]">
                  Automatically detect lyrics and timestamps from vocal audio using client-side AI.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleAiTranscribe}
                  disabled={isAiTranscribing}
                  className="flex items-center gap-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white px-3.5 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isAiTranscribing ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Transcribing...</span>
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-3.5 w-3.5" />
                      <span>Auto-Find Lyrics</span>
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
                  className="flex items-center gap-1.5 rounded-lg bg-[#131418] hover:bg-[#181920] border border-[#2A2D33] text-slate-300 px-3 py-1.5 text-xs font-medium transition-colors"
                >
                  <FileText className="h-3.5 w-3.5" />
                  <span>Import .LRC</span>
                </button>
              </div>
            </div>

            {isAiTranscribing && (
              <div className="flex items-center gap-2 rounded-lg bg-[#16233F] border border-sky-500/30 p-3 text-xs text-sky-300 font-mono">
                <Loader2 className="h-4 w-4 animate-spin text-sky-400" />
                <span>{transcriptionProgress || 'Processing audio stream...'}</span>
              </div>
            )}

            {/* Line by Line Interactive Editor */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-sky-400" />
                  <span>Synchronized Lyric Lines ({lyrics.length} lines)</span>
                </span>

                <button
                  onClick={handleAddLine}
                  className="flex items-center gap-1 text-xs text-sky-400 hover:text-sky-300 font-semibold"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Line</span>
                </button>
              </div>

              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {lyrics.map((line, idx) => (
                  <div
                    key={line.id}
                    className="flex items-center gap-2 bg-[#1B1D22] border border-[#2A2D33] p-2 rounded-lg text-xs"
                  >
                    {/* Timestamp Range Inputs */}
                    <div className="flex items-center gap-1 font-mono text-[11px] shrink-0 text-sky-300">
                      <input
                        type="number"
                        step={0.1}
                        value={line.start}
                        onChange={(e) => handleEditLine(idx, 'start', parseFloat(e.target.value) || 0)}
                        className="w-14 bg-[#131418] border border-[#2A2D33] rounded px-1.5 py-1 text-center"
                        title="Start time (seconds)"
                      />
                      <span>→</span>
                      <input
                        type="number"
                        step={0.1}
                        value={line.end}
                        onChange={(e) => handleEditLine(idx, 'end', parseFloat(e.target.value) || 0)}
                        className="w-14 bg-[#131418] border border-[#2A2D33] rounded px-1.5 py-1 text-center"
                        title="End time (seconds)"
                      />
                    </div>

                    {/* Lyric Text Input */}
                    <input
                      type="text"
                      value={line.text}
                      onChange={(e) => handleEditLine(idx, 'text', e.target.value)}
                      className="flex-1 bg-[#131418] border border-[#2A2D33] rounded px-2.5 py-1 text-white placeholder-slate-500"
                    />

                    {/* Action buttons */}
                    <button
                      onClick={() => handleSeek(line.start)}
                      className="p-1 rounded bg-sky-500/10 text-sky-400 hover:bg-sky-500/20"
                      title="Jump to timestamp"
                    >
                      <Play className="h-3.5 w-3.5" />
                    </button>

                    <button
                      onClick={() => handleDeleteLine(idx)}
                      className="p-1 rounded text-red-400 hover:bg-red-500/10"
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
          <div className="space-y-5 animate-fade-in">
            {/* Custom Background Upload Dropzone */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-white block">Custom Video or Image Background:</span>
              <div
                onClick={() => bgInputRef.current?.click()}
                className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-[#2A2D33] bg-[#1B1D22] p-6 hover:border-sky-500 hover:bg-[#151820] transition-colors"
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
                <ImageIcon className="h-7 w-7 text-sky-400 mb-2" />
                <span className="text-xs font-bold text-white">
                  {bgImageFile ? `Image: ${bgImageFile.name}` : bgVideoFile ? `Video: ${bgVideoFile.name}` : 'Upload Custom Image or Video'}
                </span>
                <span className="text-[10px] text-[#8B8F98] font-mono mt-0.5">
                  Supports MP4, WebM, PNG, JPG, WebP
                </span>
              </div>
            </div>

            {/* Built-in Procedural Background Presets */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-white block">
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
                      className={`h-24 rounded-xl border p-2 flex flex-col justify-end text-left relative overflow-hidden transition-all ${
                        isSelected
                          ? 'border-sky-400 ring-2 ring-sky-500/50 shadow-lg'
                          : 'border-[#2A2D33] hover:border-slate-500'
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#1B1D22] p-4 rounded-xl border border-[#2A2D33]">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-white font-medium">Background Dimming Overlay</span>
                  <span className="font-mono text-sky-400">{Math.round(style.backgroundDim * 100)}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={0.9}
                  step={0.05}
                  value={style.backgroundDim}
                  onChange={(e) => setStyle({ ...style, backgroundDim: parseFloat(e.target.value) })}
                  className="w-full accent-sky-400 h-1.5 bg-[#131418] rounded appearance-none cursor-pointer"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-white font-medium">Background Blur</span>
                  <span className="font-mono text-sky-400">{style.backgroundBlur}px</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={20}
                  step={1}
                  value={style.backgroundBlur}
                  onChange={(e) => setStyle({ ...style, backgroundBlur: parseInt(e.target.value, 10) })}
                  className="w-full accent-sky-400 h-1.5 bg-[#131418] rounded appearance-none cursor-pointer"
                />
              </div>
            </div>

          </div>
        )}

        {/* TAB 3: TYPOGRAPHY, PLACEMENT & COLORS */}
        {activeTab === 'style' && (
          <div className="space-y-5 animate-fade-in">
            
            {/* Placement Options: Top / Middle / Bottom */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-white block">Lyric Text Placement:</span>
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
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border gap-1.5 transition-all ${
                        isSelected
                          ? 'border-sky-500 bg-[#16233F] text-sky-300 shadow-md'
                          : 'border-[#2A2D33] bg-[#1B1D22] text-[#8B8F98] hover:text-white'
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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-[#1B1D22] p-4 rounded-xl border border-[#2A2D33]">
              
              {/* Font Family */}
              <div className="space-y-1.5">
                <span className="text-xs font-medium text-white">Font Family</span>
                <select
                  value={style.fontFamily}
                  onChange={(e) => setStyle({ ...style, fontFamily: e.target.value as any })}
                  className="w-full bg-[#131418] border border-[#2A2D33] rounded-lg px-2.5 py-1.5 text-xs text-white"
                >
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
                  <span className="text-white font-medium">Font Scale</span>
                  <span className="font-mono text-sky-400">{style.fontSize}px</span>
                </div>
                <input
                  type="range"
                  min={32}
                  max={72}
                  step={2}
                  value={style.fontSize}
                  onChange={(e) => setStyle({ ...style, fontSize: parseInt(e.target.value, 10) })}
                  className="w-full accent-sky-400 h-1.5 bg-[#131418] rounded appearance-none cursor-pointer"
                />
              </div>

              {/* Font Weight */}
              <div className="space-y-1.5">
                <span className="text-xs font-medium text-white">Font Weight</span>
                <div className="flex items-center rounded-lg bg-[#131418] p-0.5 border border-[#2A2D33]">
                  {[
                    { label: 'Regular', val: 'normal' },
                    { label: 'Semi-Bold', val: '600' },
                    { label: 'Extra-Bold', val: '800' },
                  ].map((w) => (
                    <button
                      key={w.val}
                      onClick={() => setStyle({ ...style, fontWeight: w.val as any })}
                      className={`flex-1 py-1 text-xs rounded transition-colors ${
                        style.fontWeight === w.val ? 'bg-sky-600 text-white font-bold' : 'text-[#8B8F98] hover:text-white'
                      }`}
                    >
                      {w.label}
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* Colors & Highlight Swatches */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-[#1B1D22] p-4 rounded-xl border border-[#2A2D33]">
              
              {/* Inactive Lyric Color */}
              <div className="space-y-1.5">
                <span className="text-xs font-medium text-white">Base Text Color</span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={style.textColor}
                    onChange={(e) => setStyle({ ...style, textColor: e.target.value })}
                    className="h-8 w-8 rounded border border-[#2A2D33] bg-transparent cursor-pointer"
                  />
                  <span className="text-xs font-mono text-slate-300">{style.textColor}</span>
                </div>
              </div>

              {/* Active / Highlight Color */}
              <div className="space-y-1.5">
                <span className="text-xs font-medium text-white">Active Highlight Color</span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={style.activeColor}
                    onChange={(e) => setStyle({ ...style, activeColor: e.target.value })}
                    className="h-8 w-8 rounded border border-[#2A2D33] bg-transparent cursor-pointer"
                  />
                  <span className="text-xs font-mono text-sky-400">{style.activeColor}</span>
                </div>
              </div>

              {/* Glow Color */}
              <div className="space-y-1.5">
                <span className="text-xs font-medium text-white">Glow Color</span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={style.glowColor}
                    onChange={(e) => setStyle({ ...style, glowColor: e.target.value })}
                    className="h-8 w-8 rounded border border-[#2A2D33] bg-transparent cursor-pointer"
                  />
                  <span className="text-xs font-mono text-slate-300">{style.glowColor}</span>
                </div>
              </div>

              {/* Background Pill Box Toggle */}
              <div className="space-y-1.5 flex flex-col justify-center">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-white">
                  <input
                    type="checkbox"
                    checked={style.showPillBg}
                    onChange={(e) => setStyle({ ...style, showPillBg: e.target.checked })}
                    className="rounded border-[#2A2D33] bg-[#131418] text-sky-500 focus:ring-0"
                  />
                  <span>Text Backdrop Pill Box</span>
                </label>
              </div>

            </div>

          </div>
        )}

        {/* TAB 4: TRANSITIONS & MUSICAL EFFECTS */}
        {activeTab === 'effects' && (
          <div className="space-y-5 animate-fade-in">
            
            {/* Transition Animation Selector */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-white block">Lyric Entry & Transition Animation:</span>
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
                      className={`p-3 rounded-xl border text-left flex flex-col justify-between gap-1 transition-all ${
                        isSelected
                          ? 'border-sky-500 bg-[#16233F] text-sky-300 shadow-md'
                          : 'border-[#2A2D33] bg-[#1B1D22] text-[#8B8F98] hover:text-white'
                      }`}
                    >
                      <span className="text-xs font-bold block">{fx.name}</span>
                      <span className="text-[10px] text-[#8B8F98] leading-tight">{fx.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Classical Musical Note Accents & Atmosphere */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-[#1B1D22] p-4 rounded-xl border border-[#2A2D33]">
              
              {/* Show Musical Note Particles */}
              <div className="space-y-1">
                <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-white">
                  <input
                    type="checkbox"
                    checked={style.showMusicalNotes}
                    onChange={(e) => setStyle({ ...style, showMusicalNotes: e.target.checked })}
                    className="rounded border-[#2A2D33] bg-[#131418] text-sky-500 focus:ring-0"
                  />
                  <span>Classical Musical Notes (♪ ♫ ♩)</span>
                </label>
                <p className="text-[10px] text-[#8B8F98] pl-6">
                  Floating musical note icons during line transitions
                </p>
              </div>

              {/* Beat Pulse Zoom */}
              <div className="space-y-1">
                <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-white">
                  <input
                    type="checkbox"
                    checked={style.beatPulse}
                    onChange={(e) => setStyle({ ...style, beatPulse: e.target.checked })}
                    className="rounded border-[#2A2D33] bg-[#131418] text-sky-500 focus:ring-0"
                  />
                  <span>Audio-Reactive Beat Pulse</span>
                </label>
                <p className="text-[10px] text-[#8B8F98] pl-6">
                  Subtle background zoom pulse on musical beats
                </p>
              </div>

              {/* Bottom Subtle Waveform */}
              <div className="space-y-1">
                <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-white">
                  <input
                    type="checkbox"
                    checked={style.showWaveform}
                    onChange={(e) => setStyle({ ...style, showWaveform: e.target.checked })}
                    className="rounded border-[#2A2D33] bg-[#131418] text-sky-500 focus:ring-0"
                  />
                  <span>Bottom Waveform Aura</span>
                </label>
                <p className="text-[10px] text-[#8B8F98] pl-6">
                  Glowing sine wave line across the footer
                </p>
              </div>

            </div>

          </div>
        )}

        {/* Global Error Banner */}
        {error && (
          <div className="flex items-center gap-2 rounded-xl bg-[#331614] border border-[#F0564B]/40 p-3 text-xs text-[#F0564B]">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

      </div>

    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { 
  Sparkles, ShieldCheck, Zap, ArrowRight, Search, 
  Layers, Scissors, Image as ImageIcon, Video, Subtitles, 
  FileText, CheckCircle2, Lock, Volume2, Wand2
} from 'lucide-react';

const TYPEWRITER_SENTENCES = [
  "Transform, compress, and edit documents & media instantly with absolute privacy.",
  "Merge PDFs, trim videos, and enhance audio right in your browser with zero uploads.",
  "Unlock fast client-side tools designed for speed, security, and effortless workflows."
];

const BRAND_LETTERS = [
  { char: 'N', color: '#38BDF8', glow: 'rgba(56, 189, 248, 0.6)' },
  { char: 'o', color: '#60A5FA', glow: 'rgba(96, 165, 250, 0.6)' },
  { char: 'v', color: '#818CF8', glow: 'rgba(129, 140, 248, 0.6)' },
  { char: 'a', color: '#A78BFA', glow: 'rgba(167, 139, 250, 0.6)' },
  { char: 'T', color: '#38BDF8', glow: 'rgba(56, 189, 248, 0.6)' },
  { char: 'o', color: '#2DD4BF', glow: 'rgba(45, 212, 191, 0.6)' },
  { char: 'o', color: '#60A5FA', glow: 'rgba(96, 165, 250, 0.6)' },
  { char: 'l', color: '#93C5FD', glow: 'rgba(147, 197, 253, 0.6)' },
  { char: 's', color: '#67E8F9', glow: 'rgba(103, 232, 249, 0.6)' },
];

const SHOWCASE_ACTIONS = [
  {
    id: 'pdf-merge',
    title: 'Smart PDF Merge & Protect',
    tag: 'Document Action',
    icon: FileText,
    accentColor: '#38BDF8',
    description: 'Combine confidential contracts and encrypt with 256-bit security entirely in private memory.',
    previewType: 'pdf'
  },
  {
    id: 'bg-remove',
    title: 'AI Background Cutout',
    tag: 'Image Action',
    icon: Wand2,
    accentColor: '#2DD4BF',
    description: 'Instant subject separation with clean alpha transparency with zero cloud server transfers.',
    previewType: 'bg-cutout'
  },
  {
    id: 'video-trim',
    title: 'Video Trim & Audio Extract',
    tag: 'Video Action',
    icon: Video,
    accentColor: '#818CF8',
    description: 'Cut lossless video clips and boost volume without quality loss or long waiting times.',
    previewType: 'video'
  },
  {
    id: 'subtitles',
    title: 'Auto Subtitles & Transcripts',
    tag: 'Speech Action',
    icon: Subtitles,
    accentColor: '#A78BFA',
    description: 'Generate accurate timed SRT captions from audio files directly on your local device.',
    previewType: 'subtitles'
  }
];

export const HeroSection: React.FC = () => {
  // Typewriter State
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [typingSpeed, setTypingSpeed] = useState(45);

  // Showcase Slider State
  const [activeShowcaseIndex, setActiveShowcaseIndex] = useState(0);

  // Typewriter effect logic
  useEffect(() => {
    const fullSentence = TYPEWRITER_SENTENCES[currentSentenceIndex];

    const timer = setTimeout(() => {
      if (!isDeleting) {
        // Typing forward
        if (displayedText.length < fullSentence.length) {
          setDisplayedText(fullSentence.substring(0, displayedText.length + 1));
          setTypingSpeed(38);
        } else {
          // Finished typing sentence, pause before deleting
          setTypingSpeed(2600);
          setIsDeleting(true);
        }
      } else {
        // Deleting backwards
        if (displayedText.length > 0) {
          setDisplayedText(fullSentence.substring(0, displayedText.length - 1));
          setTypingSpeed(18);
        } else {
          // Finished deleting, move to next sentence
          setIsDeleting(false);
          setCurrentSentenceIndex((prev) => (prev + 1) % TYPEWRITER_SENTENCES.length);
          setTypingSpeed(450);
        }
      }
    }, typingSpeed);

    return () => clearTimeout(timer);
  }, [displayedText, isDeleting, currentSentenceIndex, typingSpeed]);

  // Showcase Auto-rotate logic
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveShowcaseIndex((prev) => (prev + 1) % SHOWCASE_ACTIONS.length);
    }, 4800);
    return () => clearInterval(interval);
  }, []);

  const openSearch = () => {
    const event = new KeyboardEvent('keydown', {
      key: 'k',
      ctrlKey: true,
      bubbles: true
    });
    window.dispatchEvent(event);
  };

  const activeAction = SHOWCASE_ACTIONS[activeShowcaseIndex];

  return (
    <section className="relative w-full overflow-hidden pt-6 pb-14 lg:py-16">
      {/* Ambient Sci-Fi Glow Background Orbs */}
      <div className="pointer-events-none absolute -top-24 left-1/4 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />
      <div className="pointer-events-none absolute top-1/3 -right-20 h-96 w-96 rounded-full bg-blue-600/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-10 left-1/3 h-80 w-80 rounded-full bg-indigo-500/10 blur-3xl" />

      <div className="w-full px-4 sm:px-6 lg:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
          
          {/* LEFT COLUMN: Hero Copy, Animated Brand, and Typewriter */}
          <div className="lg:col-span-7 space-y-6 sm:space-y-7 text-left">
            
            {/* Top Pill / Badge */}
            <div className="inline-flex items-center gap-2 rounded-full bg-[#0A0F1D]/90 border border-[#1E293B] px-3.5 py-1.5 shadow-[0_0_15px_rgba(56,189,248,0.1)]">
              <span className="flex h-2 w-2 rounded-full bg-[#38BDF8] animate-ping" />
              <span className="text-[11px] sm:text-xs font-medium text-[#94A3B8] tracking-wide">
                100% Private Document & Media Engine
              </span>
            </div>

            {/* Brand Title with Multicolor Revolving Lightning Effect */}
            <div className="space-y-3">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1]">
                <span className="block text-2xl sm:text-3xl font-semibold text-slate-300 mb-1">
                  Create, Convert & Edit with
                </span>
                <span className="inline-flex items-center select-none">
                  {BRAND_LETTERS.map((item, idx) => (
                    <span
                      key={idx}
                      className="inline-block animate-lightning transition-all duration-300 font-extrabold"
                      style={{
                        color: item.color,
                        animationDelay: `${idx * 0.22}s`,
                        textShadow: `0 0 16px ${item.glow}`
                      }}
                    >
                      {item.char}
                    </span>
                  ))}
                </span>
              </h1>

              {/* Typewriter Generator Area (Bluish light white-blue gradient) */}
              <div className="min-h-[4.2rem] sm:min-h-[4rem] flex items-center">
                <p className="text-lg sm:text-xl lg:text-2xl font-medium leading-snug bg-gradient-to-r from-sky-100 via-cyan-200 to-blue-300 bg-clip-text text-transparent drop-shadow-sm">
                  {displayedText}
                  <span className="inline-block w-0.5 h-5 sm:h-6 ml-1 bg-cyan-400 align-middle animate-pulse" />
                </p>
              </div>
            </div>

            {/* User-Centric Value Bullets */}
            <p className="text-sm sm:text-base text-[#94A3B8] max-w-xl leading-relaxed">
              Fast, privacy-first utility tools that run directly in your browser. No files are ever sent to external servers, no subscriptions, and no upload queues.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3.5 pt-2">
              <a
                href="#catalog"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#38BDF8] to-[#2563EB] hover:from-[#0EA5E9] hover:to-[#1D4ED8] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
              >
                <span>Explore All 21+ Tools</span>
                <ArrowRight className="h-4 w-4" />
              </a>

              <button
                onClick={openSearch}
                className="inline-flex items-center gap-2.5 rounded-xl bg-[#0A0F1D]/80 hover:bg-[#0D1426] border border-white/10 hover:border-[#38BDF8]/50 px-4 py-3 text-sm font-medium text-[#F1F5F9] transition-all shadow-inner group cursor-pointer"
              >
                <Search className="h-4 w-4 text-[#38BDF8]" />
                <span>Quick Search</span>
                <kbd className="hidden sm:inline-block rounded bg-[#050811] px-1.5 py-0.5 text-[10px] font-mono text-[#94A3B8] border border-white/10 group-hover:text-[#38BDF8]">
                  ⌘K
                </kbd>
              </button>
            </div>

            {/* Trust Highlights */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4 pt-4 border-t border-white/[0.06] text-xs text-[#94A3B8]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-[#34D399] shrink-0" />
                <span className="font-medium text-slate-200">Zero Uploads</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-[#38BDF8] shrink-0" />
                <span className="font-medium text-slate-200">Instant Speed</span>
              </div>
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-[#A78BFA] shrink-0" />
                <span className="font-medium text-slate-200">Private by Design</span>
              </div>
            </div>

          </div>


          {/* RIGHT COLUMN: Live Action Showcase (Transparent, PNG/Action-like with smooth animated cards) */}
          <div className="lg:col-span-5 relative">
            
            {/* Interactive Showcase Container with Transparent Glass Aesthetics */}
            <div className="relative rounded-2xl border border-white/10 bg-gradient-to-b from-[#0A0F1D]/70 to-[#050811]/90 backdrop-blur-xl p-5 sm:p-6 shadow-2xl shadow-cyan-950/40 overflow-hidden">
              
              {/* Header of Action Box */}
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-4 mb-4">
                <div className="flex items-center gap-2.5">
                  <div 
                    className="flex h-8 w-8 items-center justify-center rounded-lg border transition-colors"
                    style={{
                      borderColor: `${activeAction.accentColor}50`,
                      backgroundColor: `${activeAction.accentColor}15`,
                      color: activeAction.accentColor
                    }}
                  >
                    <activeAction.icon className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#94A3B8]">
                      {activeAction.tag}
                    </span>
                    <h3 className="text-sm font-semibold text-white">
                      {activeAction.title}
                    </h3>
                  </div>
                </div>

                <span className="inline-flex items-center gap-1 text-[10px] font-mono text-[#34D399] bg-[#34D399]/10 px-2 py-0.5 rounded border border-[#34D399]/20">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#34D399] animate-pulse" />
                  Live Action
                </span>
              </div>

              {/* Dynamic Action Preview Stage (Transparent / Action Graphic) */}
              <div className="relative h-60 w-full rounded-xl border border-white/5 bg-[#070B16]/60 flex items-center justify-center overflow-hidden p-4">
                
                {/* ACTION 1: PDF MERGE & ENCRYPTION */}
                {activeAction.previewType === 'pdf' && (
                  <div className="w-full flex flex-col items-center justify-center gap-3 animate-fade-in">
                    <div className="flex items-center justify-center gap-3">
                      {/* Document 1 */}
                      <div className="h-24 w-18 rounded-lg bg-gradient-to-br from-red-500/20 to-blue-500/10 border border-white/15 p-2 shadow-lg flex flex-col justify-between animate-float">
                        <div className="flex items-center justify-between">
                          <FileText className="h-4 w-4 text-red-400" />
                          <span className="text-[8px] font-mono text-slate-400">PDF 1</span>
                        </div>
                        <div className="space-y-1">
                          <div className="h-1 w-full bg-white/20 rounded" />
                          <div className="h-1 w-3/4 bg-white/20 rounded" />
                        </div>
                        <span className="text-[8px] font-mono text-emerald-400">Ready</span>
                      </div>

                      {/* Merge Plus Sign */}
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 font-bold text-sm">
                        +
                      </div>

                      {/* Document 2 */}
                      <div className="h-24 w-18 rounded-lg bg-gradient-to-br from-blue-500/20 to-indigo-500/10 border border-white/15 p-2 shadow-lg flex flex-col justify-between animate-float" style={{ animationDelay: '0.3s' }}>
                        <div className="flex items-center justify-between">
                          <FileText className="h-4 w-4 text-cyan-400" />
                          <span className="text-[8px] font-mono text-slate-400">PDF 2</span>
                        </div>
                        <div className="space-y-1">
                          <div className="h-1 w-full bg-white/20 rounded" />
                          <div className="h-1 w-2/3 bg-white/20 rounded" />
                        </div>
                        <span className="text-[8px] font-mono text-emerald-400">Ready</span>
                      </div>
                    </div>

                    {/* Result Output Bar */}
                    <div className="w-full max-w-xs flex items-center justify-between rounded-lg bg-[#0D1426] border border-cyan-500/30 px-3 py-1.5 text-xs text-slate-200 shadow-md">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 text-[#34D399]" />
                        <span className="font-mono text-[11px]">merged_protected.pdf</span>
                      </div>
                      <span className="text-[10px] font-mono text-cyan-400">256-bit AES</span>
                    </div>
                  </div>
                )}

                {/* ACTION 2: IMAGE BACKGROUND REMOVAL CUTOUT */}
                {activeAction.previewType === 'bg-cutout' && (
                  <div className="w-full h-full flex items-center justify-center animate-fade-in">
                    <div className="relative w-56 h-36 rounded-xl border border-white/15 bg-checkerboard flex items-center justify-center overflow-hidden shadow-xl">
                      {/* Transparent Subject Cutout simulation */}
                      <div className="relative flex flex-col items-center justify-center text-center p-3">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-teal-400 to-cyan-300 text-slate-950 shadow-lg shadow-teal-500/30 animate-pulse">
                          <Wand2 className="h-7 w-7" />
                        </div>
                        <span className="mt-2 font-mono text-[10px] text-teal-300 font-semibold bg-[#050811]/90 px-2 py-0.5 rounded border border-teal-400/30">
                          Alpha PNG Transparent
                        </span>
                      </div>

                      {/* Corner badge */}
                      <div className="absolute top-2 right-2 rounded bg-black/70 px-1.5 py-0.5 text-[9px] font-mono text-white border border-white/10">
                        100% Clean Edge
                      </div>
                    </div>
                  </div>
                )}

                {/* ACTION 3: VIDEO TRIMMER & AUDIO EXTRACTION */}
                {activeAction.previewType === 'video' && (
                  <div className="w-full flex flex-col items-center justify-center gap-3 animate-fade-in">
                    {/* Video timeline track */}
                    <div className="w-full rounded-lg bg-[#0A0F1D] border border-white/10 p-3 space-y-2">
                      <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                        <span>00:04.20</span>
                        <span className="text-[#818CF8]">Active Range: 00:02 - 00:18</span>
                        <span>00:30.00</span>
                      </div>

                      {/* Scrubber Bar */}
                      <div className="relative h-6 w-full rounded bg-slate-900 overflow-hidden flex items-center px-1">
                        {/* Audio wave bars */}
                        <div className="flex items-center gap-1 w-full h-full opacity-60">
                          {[40, 70, 30, 90, 50, 80, 100, 45, 65, 85, 30, 90, 75, 40, 60, 95, 35].map((h, i) => (
                            <div
                              key={i}
                              className="flex-1 bg-[#818CF8] rounded-full"
                              style={{ height: `${h}%` }}
                            />
                          ))}
                        </div>

                        {/* Selected Trim region */}
                        <div className="absolute inset-y-0 left-1/4 right-1/3 bg-indigo-500/25 border-x-2 border-indigo-400" />
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-xs">
                      <span className="flex items-center gap-1.5 text-slate-300 font-mono text-[11px] bg-[#0D1426] px-2.5 py-1 rounded border border-white/10">
                        <Volume2 className="h-3.5 w-3.5 text-indigo-400" />
                        Audio Boost +6dB
                      </span>
                      <span className="text-[#34D399] font-mono text-[11px] bg-[#34D399]/10 px-2 py-1 rounded border border-[#34D399]/20">
                        Lossless Extract
                      </span>
                    </div>
                  </div>
                )}

                {/* ACTION 4: AUTO SUBTITLES & TRANSCRIPTION */}
                {activeAction.previewType === 'subtitles' && (
                  <div className="w-full flex flex-col items-center justify-center gap-2.5 animate-fade-in">
                    <div className="w-full rounded-lg bg-[#0A0F1D] border border-white/10 p-3 space-y-2 text-left">
                      <div className="flex items-center justify-between text-[10px] font-mono text-purple-300">
                        <span>[00:00.00 → 00:04.50]</span>
                        <span className="bg-purple-500/20 px-1.5 py-0.5 rounded text-purple-200">SRT / VTT</span>
                      </div>
                      <p className="text-xs text-slate-100 font-medium bg-[#111827]/80 p-2 rounded border border-purple-500/30">
                        "NovaTools converts and secures media in milliseconds without cloud latency."
                      </p>
                    </div>

                    <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-purple-400" />
                      <span>Speech to Text in 99+ Languages</span>
                    </div>
                  </div>
                )}

              </div>

              {/* Description & Action Selector Tabs */}
              <div className="mt-4 space-y-3">
                <p className="text-xs text-[#94A3B8] leading-relaxed">
                  {activeAction.description}
                </p>

                {/* Interactive Action Dots / Tabs */}
                <div className="grid grid-cols-4 gap-1.5 pt-1">
                  {SHOWCASE_ACTIONS.map((action, idx) => (
                    <button
                      key={action.id}
                      onClick={() => setActiveShowcaseIndex(idx)}
                      className={`py-1.5 px-1 text-center rounded-lg text-[10px] font-mono transition-all border ${
                        idx === activeShowcaseIndex
                          ? 'bg-[#0D1426] text-cyan-300 border-cyan-500/40 shadow-sm'
                          : 'text-[#64748B] hover:text-slate-300 hover:bg-[#0D1426]/50 border-transparent'
                      }`}
                    >
                      {action.tag.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>

            </div>

          </div>

        </div>
      </div>
    </section>
  );
};

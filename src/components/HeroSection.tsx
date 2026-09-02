import React, { useState, useEffect } from 'react';
import { 
  ArrowRight, ShieldCheck, Zap, Lock,
  FileText, Wand2, Video, Subtitles, CheckCircle2, Volume2,
  Terminal, Sparkles
} from 'lucide-react';

const TYPEWRITER_SENTENCES = [
  "PDF manipulation, conversion & redaction.",
  "AI background removal & image optimization.",
  "Video trimming, subtitle creation & voice synthesis.",
  "Document compilation & diagram generation."
];

export const HeroSection: React.FC = () => {
  // Typewriter State
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [typingSpeed, setTypingSpeed] = useState(45);

  // Showcase Slider State
  const [activeTab, setActiveTab] = useState<'pdf' | 'image' | 'video' | 'audio'>('pdf');

  // Typewriter effect logic
  useEffect(() => {
    const fullSentence = TYPEWRITER_SENTENCES[currentSentenceIndex];

    const timer = setTimeout(() => {
      if (!isDeleting) {
        if (displayedText.length < fullSentence.length) {
          setDisplayedText(fullSentence.substring(0, displayedText.length + 1));
          setTypingSpeed(40);
        } else {
          setTypingSpeed(2400);
          setIsDeleting(true);
        }
      } else {
        if (displayedText.length > 0) {
          setDisplayedText(fullSentence.substring(0, displayedText.length - 1));
          setTypingSpeed(20);
        } else {
          setIsDeleting(false);
          setCurrentSentenceIndex((prev) => (prev + 1) % TYPEWRITER_SENTENCES.length);
          setTypingSpeed(450);
        }
      }
    }, typingSpeed);

    return () => clearTimeout(timer);
  }, [displayedText, isDeleting, currentSentenceIndex, typingSpeed]);

  // Tab Auto-rotate logic
  useEffect(() => {
    const tabs: ('pdf' | 'image' | 'video' | 'audio')[] = ['pdf', 'image', 'video', 'audio'];
    const interval = setInterval(() => {
      setActiveTab((prev) => {
        const nextIdx = (tabs.indexOf(prev) + 1) % tabs.length;
        return tabs[nextIdx];
      });
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative w-full min-h-[calc(100vh-4rem)] flex flex-col justify-between overflow-hidden px-4 sm:px-8 lg:px-12 py-8 lg:py-12">
      
      {/* Main Hero Content (Split Screen) */}
      <div className="w-full flex-1 flex items-center my-auto max-w-7xl mx-auto">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          
          {/* LEFT COLUMN: Typography & Action CTAs */}
          <div className="lg:col-span-6 space-y-6 text-left">
            
            {/* Encrypted Session Static Badge (No Pulsing) */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded border border-slate-200 dark:border-white/[0.08] bg-slate-100 dark:bg-[#121316] text-slate-700 dark:text-[#d1d5db] text-xs font-mono">
              <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
              <span>[ ENCRYPTED_LOCAL_SESSION ]</span>
            </div>

            {/* Headline */}
            <div className="space-y-2">
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] text-slate-900 dark:text-white">
                Create, Convert & Edit with <br />
                <span className="text-blue-600 dark:text-blue-400">NovaTools</span>
              </h1>

              {/* Typewriter Stream */}
              <div className="min-h-[2.5rem] flex items-center pt-1">
                <p className="text-lg sm:text-xl lg:text-2xl font-semibold text-slate-700 dark:text-[#d1d5db]">
                  {displayedText}
                  <span className="inline-block w-0.5 h-5 ml-1 bg-blue-600 dark:bg-blue-400 align-middle" />
                </p>
              </div>
            </div>

            <p className="text-sm sm:text-base text-slate-600 dark:text-[#9ca3af] leading-relaxed max-w-lg">
              Industrial-grade media and document processing running entirely within your browser context. Native speeds, zero server uploads, complete data privacy.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-4 pt-2">
              <a
                href="#services"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-7 py-3.5 text-sm font-semibold shadow-sm hover:scale-[1.01] active:scale-[0.98] transition-all cursor-pointer"
              >
                <span>Launch Workbench</span>
                <ArrowRight className="h-4 w-4" />
              </a>
              <a
                href="/about"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 dark:border-white/[0.1] bg-transparent hover:bg-slate-100 dark:hover:bg-white/[0.04] text-slate-800 dark:text-[#f9fafb] px-6 py-3.5 text-sm font-semibold transition-colors cursor-pointer"
              >
                <span>Read Architecture Specs</span>
              </a>
            </div>

          </div>

          {/* RIGHT COLUMN: Console Action Graphic & Preview */}
          <div className="lg:col-span-6 w-full">
            <div className="relative rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#1e2025] p-5 shadow-sm space-y-4">
              
              {/* Terminal / Workbench Header */}
              <div className="flex justify-between items-center border-b border-slate-200 dark:border-white/[0.06] pb-3 text-xs font-mono">
                <div className="flex items-center gap-2 text-slate-500 dark:text-[#9ca3af]">
                  <Terminal className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                  <span>WORKSPACE_CONSOLE // LIVE</span>
                </div>

                {/* Suite Category Switcher Tabs */}
                <div className="flex gap-1">
                  {(['pdf', 'image', 'video', 'audio'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-2.5 py-1 rounded text-[11px] font-bold uppercase transition-colors ${
                        activeTab === tab
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-slate-600 dark:text-[#9ca3af] hover:bg-slate-100 dark:hover:bg-[#16171a]'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              {/* Graphic Stage Area */}
              <div className="h-72 w-full rounded-lg bg-slate-50 dark:bg-[#16171a] border border-slate-200 dark:border-white/[0.06] flex items-center justify-center p-6 relative overflow-hidden">
                
                {/* PDF PREVIEW TAB */}
                {activeTab === 'pdf' && (
                  <div className="w-full flex flex-col items-center justify-center gap-4">
                    <div className="flex items-center justify-center gap-3">
                      <div className="h-24 w-20 rounded-lg bg-white dark:bg-[#1e2025] border border-slate-300 dark:border-white/[0.1] p-2.5 shadow-md -rotate-6 flex flex-col justify-between">
                        <FileText className="h-5 w-5 text-red-500" />
                        <div className="space-y-1">
                          <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded" />
                          <div className="h-1.5 w-2/3 bg-slate-200 dark:bg-slate-700 rounded" />
                        </div>
                      </div>

                      <div className="h-28 w-24 rounded-lg bg-white dark:bg-[#1e2025] border-2 border-blue-600 dark:border-blue-500 p-3 shadow-lg z-10 flex flex-col justify-between scale-105">
                        <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        <div className="space-y-1">
                          <div className="h-1.5 w-full bg-blue-500/30 rounded" />
                          <div className="h-1.5 w-4/5 bg-blue-500/30 rounded" />
                          <div className="h-1.5 w-1/2 bg-blue-500/20 rounded" />
                        </div>
                      </div>

                      <div className="h-24 w-20 rounded-lg bg-white dark:bg-[#1e2025] border border-slate-300 dark:border-white/[0.1] p-2.5 shadow-md rotate-6 flex flex-col justify-between">
                        <FileText className="h-5 w-5 text-emerald-500" />
                        <div className="space-y-1">
                          <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded" />
                          <div className="h-1.5 w-2/3 bg-slate-200 dark:bg-slate-700 rounded" />
                        </div>
                      </div>
                    </div>

                    <div className="inline-flex items-center gap-2 rounded-full bg-white dark:bg-[#1e2025] border border-slate-200 dark:border-white/[0.08] px-4 py-1.5 text-xs font-mono text-slate-700 dark:text-[#d1d5db] shadow-sm">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                      <span>Vector Merge Active · 0 Server Uploads</span>
                    </div>
                  </div>
                )}

                {/* IMAGE PREVIEW TAB */}
                {activeTab === 'image' && (
                  <div className="w-full flex flex-col items-center justify-center gap-4">
                    <div className="relative w-56 h-36 rounded-xl border border-slate-300 dark:border-white/[0.1] bg-checkerboard flex items-center justify-center shadow-inner overflow-hidden">
                      <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md">
                        <Wand2 className="h-8 w-8" />
                      </div>
                    </div>

                    <div className="inline-flex items-center gap-2 rounded-full bg-white dark:bg-[#1e2025] border border-slate-200 dark:border-white/[0.08] px-4 py-1.5 text-xs font-mono text-slate-700 dark:text-[#d1d5db] shadow-sm">
                      <Sparkles className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                      <span>Neural Edge Cutout · Local GPU Memory</span>
                    </div>
                  </div>
                )}

                {/* VIDEO PREVIEW TAB */}
                {activeTab === 'video' && (
                  <div className="w-full max-w-xs flex flex-col items-center justify-center gap-4">
                    <div className="w-full rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#1e2025] p-4 space-y-3 shadow-md">
                      <div className="flex items-center justify-between text-xs font-mono text-slate-500 dark:text-[#9ca3af]">
                        <span className="text-blue-600 dark:text-blue-400 font-bold">00:04.12</span>
                        <span>00:30.00</span>
                      </div>

                      <div className="relative w-full h-3.5 bg-slate-100 dark:bg-[#121316] rounded-full overflow-hidden border border-slate-200 dark:border-white/[0.06]">
                        <div className="absolute left-1/4 right-1/3 inset-y-0 bg-blue-500/30 border-x-2 border-blue-600 dark:border-blue-400" />
                        <div className="absolute left-1/3 top-0 bottom-0 w-1 bg-slate-900 dark:bg-white" />
                      </div>

                      <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                        <span>START: 00:02.00</span>
                        <span>END: 00:18.00</span>
                      </div>
                    </div>

                    <div className="inline-flex items-center gap-2 rounded-full bg-white dark:bg-[#1e2025] border border-slate-200 dark:border-white/[0.08] px-4 py-1.5 text-xs font-mono text-slate-700 dark:text-[#d1d5db] shadow-sm">
                      <Video className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                      <span>Lossless Stream Slicing</span>
                    </div>
                  </div>
                )}

                {/* AUDIO PREVIEW TAB */}
                {activeTab === 'audio' && (
                  <div className="w-full max-w-xs flex flex-col items-center justify-center gap-4">
                    <div className="w-full rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#1e2025] p-4 space-y-3 shadow-md">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-slate-700 dark:text-white font-bold">Volume Normalizer</span>
                        <span className="text-emerald-600 dark:text-emerald-400">+14 dB</span>
                      </div>

                      {/* Waveform Bars */}
                      <div className="h-12 w-full rounded bg-slate-100 dark:bg-[#121316] p-2 flex items-end justify-between gap-1">
                        {[40, 75, 30, 90, 50, 85, 100, 45, 65, 95, 30, 90, 75, 40, 60, 100, 35, 70].map((h, i) => (
                          <div
                            key={i}
                            className="flex-1 bg-blue-600 dark:bg-blue-400 rounded-t-sm"
                            style={{ height: `${h}%` }}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="inline-flex items-center gap-2 rounded-full bg-white dark:bg-[#1e2025] border border-slate-200 dark:border-white/[0.08] px-4 py-1.5 text-xs font-mono text-slate-700 dark:text-[#d1d5db] shadow-sm">
                      <Volume2 className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                      <span>Web Audio DSP Engine</span>
                    </div>
                  </div>
                )}

              </div>

            </div>
          </div>

        </div>
      </div>

      {/* BOTTOM OF 100VH HERO: Metrics & Trust Bar */}
      <div className="w-full max-w-7xl mx-auto pt-6 pb-2 border-t border-slate-200 dark:border-white/[0.08] flex flex-wrap items-center justify-around gap-4 text-xs sm:text-sm text-slate-600 dark:text-[#9ca3af]">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span className="font-semibold text-slate-900 dark:text-[#f9fafb]">Zero Uploads</span>
        </div>
        <div className="flex items-center gap-2.5">
          <Zap className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
          <span className="font-semibold text-slate-900 dark:text-[#f9fafb]">Instant Speed</span>
        </div>
        <div className="flex items-center gap-2.5">
          <Lock className="h-4 w-4 text-slate-700 dark:text-[#d1d5db] shrink-0" />
          <span className="font-semibold text-slate-900 dark:text-[#f9fafb]">Private by Design</span>
        </div>
      </div>
    </section>
  );
};

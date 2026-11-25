import React, { useState, useEffect } from 'react';
import {
  ArrowRight,
  ShieldCheck,
  Zap,
  Lock,
  FileText,
  Wand2,
  Video,
  CheckCircle2,
  Volume2,
  Terminal,
  Sparkles,
  Layers,
  Subtitles,
} from 'lucide-react';

const TYPEWRITER_SENTENCES = [
  'PDF manipulation, merging & redaction.',
  'AI background removal & image optimization.',
  'Video trimming, subtitles & neural speech.',
  'Document compilation & vector diagrams.',
];

const QUICK_LAUNCH = [
  { label: 'Merge PDF', href: '/pdf/merge', icon: Layers },
  { label: 'Remove BG', href: '/image/background-remover', icon: Wand2 },
  { label: 'Doc Studio', href: '/document/studio', icon: FileText },
  { label: 'Subtitles', href: '/video/subtitle-generator', icon: Subtitles },
];

export const HeroSection: React.FC = () => {
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [typingSpeed, setTypingSpeed] = useState(45);
  const [activeTab, setActiveTab] = useState<'pdf' | 'image' | 'video' | 'audio'>('pdf');

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
          setTypingSpeed(420);
        }
      }
    }, typingSpeed);

    return () => clearTimeout(timer);
  }, [displayedText, isDeleting, currentSentenceIndex, typingSpeed]);

  useEffect(() => {
    const tabs: ('pdf' | 'image' | 'video' | 'audio')[] = ['pdf', 'image', 'video', 'audio'];
    const interval = setInterval(() => {
      setActiveTab((prev) => tabs[(tabs.indexOf(prev) + 1) % tabs.length]);
    }, 5200);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative w-full min-h-[calc(100dvh-4.5rem)] flex flex-col justify-between px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <div className="w-full flex-1 flex items-center my-auto max-w-7xl mx-auto">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* LEFT: Desktop App Launch Copy & Quick Dock */}
          <div className="lg:col-span-6 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white dark:bg-[#1F1D19] border border-[var(--nt-border)] shadow-card text-xs font-mono text-[#141413] dark:text-[#FAF7F0]">
              <span className="h-2 w-2 rounded-full bg-[#15803D] dark:bg-[#4ADE80]" />
              <span className="font-semibold">100% Local Desktop Runtime</span>
              <span className="rounded-full bg-[#FACC15] text-[#141413] px-1.5 py-0.2 text-[10px] font-bold">
                0 Uploads
              </span>
            </div>

            <div className="space-y-3">
              <h1 className="text-4xl sm:text-5xl lg:text-[3.35rem] font-extrabold tracking-tight leading-[1.08] text-[#141413] dark:text-[#FAF7F0]">
                Simple, desktop-grade <br className="hidden sm:inline" />
                utilities in{' '}
                <span className="inline-block relative px-2.5 py-0.5 rounded-xl bg-[#FACC15] text-[#141413] shadow-[0_3px_0_#C99A00] -rotate-[0.5deg]">
                  NovaTools
                </span>
              </h1>

              <div className="min-h-[2.25rem] flex items-center pt-1">
                <p className="text-base sm:text-xl font-semibold text-[#454038] dark:text-[#CBC4B6]">
                  {displayedText}
                  <span className="inline-block w-0.5 h-5 ml-1 bg-[#141413] dark:bg-[#FACC15] align-middle" />
                </p>
              </div>
            </div>

            <p className="text-sm sm:text-base text-[#454038] dark:text-[#938B7D] leading-relaxed max-w-lg">
              Focused media, document, PDF, and AI tools crafted like a native workspace. Every file stays inside your own device memory—fast, uncluttered, and private.
            </p>

            {/* Primary Actions */}
            <div className="flex flex-wrap gap-3 pt-1">
              <a
                href="#services"
                className="inline-flex items-center justify-center gap-2 nt-btn-yellow px-6 py-3.5 text-sm"
              >
                <span>Open App Suite</span>
                <ArrowRight className="h-4 w-4" />
              </a>
              <a
                href="/about"
                className="inline-flex items-center justify-center gap-2 nt-btn-secondary px-6 py-3.5 text-sm font-bold"
              >
                <span>How It Works</span>
              </a>
            </div>

            {/* Quick Launch Dock */}
            <div className="pt-2 space-y-2">
              <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#746D61] dark:text-[#938B7D]">
                Quick Launch
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {QUICK_LAUNCH.map((item) => {
                  const Icon = item.icon;
                  return (
                    <a
                      key={item.href}
                      href={item.href}
                      className="nt-card-interactive px-3 py-2.5 flex items-center gap-2 text-xs font-bold text-[#141413] dark:text-[#FAF7F0]"
                    >
                      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#FEF7D6] dark:bg-[#FACC15]/15 text-[#141413] dark:text-[#FACC15] border border-[#D9A700]/40 shrink-0">
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      <span className="truncate">{item.label}</span>
                    </a>
                  );
                })}
              </div>
            </div>
          </div>

          {/* RIGHT: Modern Desktop App Window Frame */}
          <div className="lg:col-span-6 w-full">
            <div className="nt-window overflow-hidden">
              {/* Desktop Window Titlebar */}
              <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-[var(--nt-border)] bg-[#FCFBF8] dark:bg-[#191714]">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5" aria-hidden="true">
                    <span className="h-3 w-3 rounded-full bg-[#141413] dark:bg-[#FAF7F0]/30" />
                    <span className="h-3 w-3 rounded-full bg-[#FACC15]" />
                    <span className="h-3 w-3 rounded-full bg-[#D6CFC0] dark:bg-[#454038]" />
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] font-mono font-semibold text-[#746D61] dark:text-[#938B7D]">
                    <Terminal className="h-3.5 w-3.5 text-[#141413] dark:text-[#FACC15]" />
                    <span>workbench.app</span>
                  </div>
                </div>

                {/* Window Suite Tabs */}
                <div className="flex items-center gap-1 rounded-lg bg-[#EAE3D4] dark:bg-[#141311] p-0.5 border border-[var(--nt-border)]">
                  {(['pdf', 'image', 'video', 'audio'] as const).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setActiveTab(tab)}
                      className={`px-2.5 py-1 rounded-md text-[10px] font-mono font-bold uppercase transition-all cursor-pointer ${
                        activeTab === tab
                          ? 'bg-[#141413] dark:bg-[#FACC15] text-[#FACC15] dark:text-[#141413] shadow-sm'
                          : 'text-[#454038] dark:text-[#938B7D] hover:text-[#141413] dark:hover:text-[#FAF7F0]'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              {/* Recessed Desktop Canvas Well */}
              <div className="p-4 sm:p-5 bg-white dark:bg-[#1F1D19]">
                <div className="nt-well h-72 w-full flex items-center justify-center p-6 relative overflow-hidden">
                  {activeTab === 'pdf' && (
                    <div className="w-full flex flex-col items-center justify-center gap-5">
                      <div className="flex items-center justify-center gap-3.5">
                        <div className="nt-card h-24 w-20 p-2.5 -rotate-6 flex flex-col justify-between">
                          <FileText className="h-5 w-5 text-[#746D61]" />
                          <div className="space-y-1.5">
                            <div className="h-1.5 w-full bg-[#EAE3D4] dark:bg-[#36322B] rounded-full" />
                            <div className="h-1.5 w-2/3 bg-[#EAE3D4] dark:bg-[#36322B] rounded-full" />
                          </div>
                        </div>

                        <div className="nt-card h-28 w-24 border-2 border-[#141413] dark:border-[#FACC15] p-3 z-10 flex flex-col justify-between scale-105">
                          <div className="flex items-center justify-between">
                            <FileText className="h-6 w-6 text-[#141413] dark:text-[#FACC15]" />
                            <span className="h-2.5 w-2.5 rounded-full bg-[#FACC15]" />
                          </div>
                          <div className="space-y-1.5">
                            <div className="h-1.5 w-full bg-[#141413]/80 dark:bg-[#FAF7F0]/80 rounded-full" />
                            <div className="h-1.5 w-4/5 bg-[#FACC15] rounded-full" />
                            <div className="h-1.5 w-1/2 bg-[#EAE3D4] dark:bg-[#36322B] rounded-full" />
                          </div>
                        </div>

                        <div className="nt-card h-24 w-20 p-2.5 rotate-6 flex flex-col justify-between">
                          <FileText className="h-5 w-5 text-[#CA8A04]" />
                          <div className="space-y-1.5">
                            <div className="h-1.5 w-full bg-[#EAE3D4] dark:bg-[#36322B] rounded-full" />
                            <div className="h-1.5 w-2/3 bg-[#EAE3D4] dark:bg-[#36322B] rounded-full" />
                          </div>
                        </div>
                      </div>

                      <div className="nt-card px-4 py-1.5 rounded-full inline-flex items-center gap-2 text-xs font-mono font-semibold text-[#141413] dark:text-[#FAF7F0]">
                        <CheckCircle2 className="h-3.5 w-3.5 text-[#15803D] dark:text-[#4ADE80]" />
                        <span>Vector Merge Active · Local Memory</span>
                      </div>
                    </div>
                  )}

                  {activeTab === 'image' && (
                    <div className="w-full flex flex-col items-center justify-center gap-5">
                      <div className="nt-card relative w-56 h-36 bg-checkerboard flex items-center justify-center overflow-hidden">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#141413] text-[#FACC15] shadow-card">
                          <Wand2 className="h-8 w-8" />
                        </div>
                      </div>

                      <div className="nt-card px-4 py-1.5 rounded-full inline-flex items-center gap-2 text-xs font-mono font-semibold text-[#141413] dark:text-[#FAF7F0]">
                        <Sparkles className="h-3.5 w-3.5 text-[#CA8A04] dark:text-[#FACC15]" />
                        <span>Neural Edge Cutout · Client GPU</span>
                      </div>
                    </div>
                  )}

                  {activeTab === 'video' && (
                    <div className="w-full max-w-xs flex flex-col items-center justify-center gap-5">
                      <div className="nt-card w-full p-4 space-y-3">
                        <div className="flex items-center justify-between text-xs font-mono">
                          <span className="text-[#141413] dark:text-[#FACC15] font-bold">00:04.12</span>
                          <span className="text-[#746D61]">00:30.00</span>
                        </div>

                        <div className="nt-well relative w-full h-4 rounded-full overflow-hidden">
                          <div className="absolute left-1/4 right-1/3 inset-y-0 bg-[#FACC15]/75 border-x-2 border-[#141413]" />
                          <div className="absolute left-1/3 top-0 bottom-0 w-1 bg-[#141413] dark:bg-white" />
                        </div>

                        <div className="flex items-center justify-between text-[10px] font-mono text-[#746D61]">
                          <span>START: 00:02.00</span>
                          <span>END: 00:18.00</span>
                        </div>
                      </div>

                      <div className="nt-card px-4 py-1.5 rounded-full inline-flex items-center gap-2 text-xs font-mono font-semibold text-[#141413] dark:text-[#FAF7F0]">
                        <Video className="h-3.5 w-3.5 text-[#141413] dark:text-[#FACC15]" />
                        <span>Lossless Stream Slicing</span>
                      </div>
                    </div>
                  )}

                  {activeTab === 'audio' && (
                    <div className="w-full max-w-xs flex flex-col items-center justify-center gap-5">
                      <div className="nt-card w-full p-4 space-y-3">
                        <div className="flex items-center justify-between text-xs font-mono">
                          <span className="text-[#141413] dark:text-[#FAF7F0] font-bold">Volume Normalizer</span>
                          <span className="nt-badge-yellow px-2 py-0.5 text-[10px] font-bold">+14 dB</span>
                        </div>

                        <div className="nt-well h-14 w-full p-2 flex items-end justify-between gap-1">
                          {[40, 75, 30, 90, 50, 85, 100, 45, 65, 95, 30, 90, 75, 40, 60, 100, 35, 70].map((h, i) => (
                            <div
                              key={i}
                              className={`flex-1 rounded-t-sm ${
                                i % 3 === 0 ? 'bg-[#FACC15]' : 'bg-[#141413] dark:bg-[#FAF7F0]'
                              }`}
                              style={{ height: `${h}%` }}
                            />
                          ))}
                        </div>
                      </div>

                      <div className="nt-card px-4 py-1.5 rounded-full inline-flex items-center gap-2 text-xs font-mono font-semibold text-[#141413] dark:text-[#FAF7F0]">
                        <Volume2 className="h-3.5 w-3.5 text-[#141413] dark:text-[#FACC15]" />
                        <span>Web Audio DSP Engine</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Desktop Status Bar */}
      <div className="w-full max-w-7xl mx-auto pt-6">
        <div className="nt-card px-5 py-3.5 flex flex-wrap items-center justify-around gap-4 text-xs sm:text-sm">
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#ECFDF3] dark:bg-[#15803D]/25 text-[#15803D] dark:text-[#4ADE80]">
              <ShieldCheck className="h-4 w-4" />
            </span>
            <span className="font-bold text-[#141413] dark:text-[#FAF7F0]">Zero Cloud Uploads</span>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#FEF7D6] dark:bg-[#FACC15]/15 text-[#141413] dark:text-[#FACC15]">
              <Zap className="h-4 w-4" />
            </span>
            <span className="font-bold text-[#141413] dark:text-[#FAF7F0]">Hardware Speed</span>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#141413] text-[#FACC15]">
              <Lock className="h-4 w-4" />
            </span>
            <span className="font-bold text-[#141413] dark:text-[#FAF7F0]">Private by Architecture</span>
          </div>
        </div>
      </div>
    </section>
  );
};

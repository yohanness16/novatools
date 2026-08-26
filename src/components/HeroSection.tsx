import React, { useState, useEffect } from 'react';
import { 
  ArrowRight, ShieldCheck, Zap, Lock,
  FileText, Wand2, Video, Subtitles, CheckCircle2, Volume2
} from 'lucide-react';

const TYPEWRITER_SENTENCES = [
  "Transform, compress, and edit documents & media instantly with absolute privacy.",
  "Merge PDFs, trim videos, and enhance audio right in your browser with zero uploads.",
  "Unlock fast client-side tools designed for speed, security, and effortless workflows."
];

// Darkened yellow blended with subtle grey-gold tones
const BRAND_LETTERS = [
  { char: 'N', color: '#D4C596' },
  { char: 'o', color: '#E5D5A4' },
  { char: 'v', color: '#C9B87F' },
  { char: 'a', color: '#BAA86D' },
  { char: 'T', color: '#E5D5A4' },
  { char: 'o', color: '#D4C596' },
  { char: 'o', color: '#C9B87F' },
  { char: 'l', color: '#BAA86D' },
  { char: 's', color: '#D4C596' },
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
        if (displayedText.length < fullSentence.length) {
          setDisplayedText(fullSentence.substring(0, displayedText.length + 1));
          setTypingSpeed(38);
        } else {
          setTypingSpeed(2600);
          setIsDeleting(true);
        }
      } else {
        if (displayedText.length > 0) {
          setDisplayedText(fullSentence.substring(0, displayedText.length - 1));
          setTypingSpeed(18);
        } else {
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
      setActiveShowcaseIndex((prev) => (prev + 1) % 4);
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative w-full min-h-[calc(100vh-4rem)] flex flex-col justify-between overflow-hidden px-6 sm:px-10 lg:px-16 xl:px-24 py-8 lg:py-10">
      {/* Ambient Sci-Fi Glow Background Orbs */}
      <div className="pointer-events-none absolute -top-24 left-1/4 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />
      <div className="pointer-events-none absolute top-1/3 -right-20 h-96 w-96 rounded-full bg-blue-600/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-10 left-1/3 h-80 w-80 rounded-full bg-indigo-500/10 blur-3xl" />

      {/* Main Hero Content (Centered) */}
      <div className="w-full flex-1 flex items-center my-auto">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          
          {/* LEFT COLUMN: Hero Brand, Typewriter, and Explore Button */}
          <div className="lg:col-span-7 space-y-7 text-left">
            
            {/* Brand Title with Darkened Yellow-Grey Gold Blend */}
            <div className="space-y-3">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.15]">
                <span className="block text-2xl sm:text-3xl font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Create, Convert & Edit with
                </span>
                <span className="inline-flex items-center select-none tracking-normal">
                  {BRAND_LETTERS.map((item, idx) => (
                    <span
                      key={idx}
                      className="inline-block transition-all duration-300 font-extrabold hover:scale-105"
                      style={{
                        color: item.color,
                        textShadow: '0 0 10px rgba(212, 197, 150, 0.25)'
                      }}
                    >
                      {item.char}
                    </span>
                  ))}
                </span>
              </h1>

              {/* Typewriter Generator Area (Adaptive Gradient) */}
              <div className="min-h-[4.2rem] sm:min-h-[4rem] flex items-center">
                <p className="text-lg sm:text-xl lg:text-2xl font-medium leading-snug bg-gradient-to-r from-sky-900 via-cyan-800 to-indigo-950 dark:from-sky-100 dark:via-cyan-200 dark:to-blue-300 bg-clip-text text-transparent drop-shadow-sm">
                  {displayedText}
                  <span className="inline-block w-0.5 h-5 sm:h-6 ml-1 bg-cyan-500 dark:bg-cyan-400 align-middle animate-pulse" />
                </p>
              </div>
            </div>

            {/* Action Button: Darkened Yellow & Grey Blend "Explore" */}
            <div className="pt-1">
              <a
                href="#catalog"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#D8C47F] via-[#B8A76B] to-[#71717A] hover:from-[#E5D593] hover:to-[#52525B] px-8 py-3.5 text-sm font-bold text-[#090C12] shadow-lg shadow-amber-950/30 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
              >
                <span>Explore</span>
                <ArrowRight className="h-4 w-4 stroke-[2.5]" />
              </a>
            </div>

          </div>


          {/* RIGHT COLUMN: Pure Visual Action Graphic (Clean, Borderless, Transparency) */}
          <div className="lg:col-span-5 relative flex flex-col items-center justify-center">
            
            {/* Action Graphic Area */}
            <div className="relative w-full h-72 sm:h-80 flex items-center justify-center">
              
              {/* ACTION 1: PDF MERGING VISUAL */}
              {activeShowcaseIndex === 0 && (
                <div className="w-full flex flex-col items-center justify-center gap-4 animate-fade-in">
                  <div className="flex items-center justify-center gap-4">
                    {/* Document 1 */}
                    <div className="h-28 w-22 rounded-xl bg-gradient-to-br from-red-500/25 via-red-600/10 to-transparent border border-red-400/30 p-3 shadow-xl flex flex-col justify-between animate-float">
                      <FileText className="h-6 w-6 text-red-500 dark:text-red-400" />
                      <div className="space-y-1.5">
                        <div className="h-1.5 w-full bg-red-500/30 rounded" />
                        <div className="h-1.5 w-3/4 bg-red-500/30 rounded" />
                        <div className="h-1.5 w-1/2 bg-red-500/20 rounded" />
                      </div>
                    </div>

                    {/* Merge Plus Icon */}
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-cyan-500/20 border border-cyan-400/50 text-cyan-600 dark:text-cyan-300 font-bold text-lg shadow-lg shadow-cyan-500/20">
                      +
                    </div>

                    {/* Document 2 */}
                    <div className="h-28 w-22 rounded-xl bg-gradient-to-br from-blue-500/25 via-cyan-600/10 to-transparent border border-cyan-400/30 p-3 shadow-xl flex flex-col justify-between animate-float" style={{ animationDelay: '0.4s' }}>
                      <FileText className="h-6 w-6 text-cyan-600 dark:text-cyan-400" />
                      <div className="space-y-1.5">
                        <div className="h-1.5 w-full bg-cyan-500/30 rounded" />
                        <div className="h-1.5 w-2/3 bg-cyan-500/30 rounded" />
                        <div className="h-1.5 w-1/2 bg-cyan-500/20 rounded" />
                      </div>
                    </div>
                  </div>

                  {/* Clean Result Icon Pill */}
                  <div className="flex items-center gap-2.5 rounded-full bg-white/90 dark:bg-[#0D1426]/90 border border-cyan-500/40 px-4 py-2 shadow-lg shadow-cyan-950/20">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 dark:text-[#34D399]" />
                    <div className="h-2 w-24 bg-cyan-500/40 rounded-full" />
                    <Lock className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-300" />
                  </div>
                </div>
              )}

              {/* ACTION 2: IMAGE CUTOUT VISUAL */}
              {activeShowcaseIndex === 1 && (
                <div className="w-full flex items-center justify-center animate-fade-in">
                  <div className="relative w-64 h-44 rounded-2xl border border-teal-400/30 bg-checkerboard flex items-center justify-center shadow-2xl shadow-teal-950/20 overflow-hidden">
                    <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-tr from-teal-400 via-cyan-300 to-emerald-300 text-slate-950 shadow-2xl shadow-teal-400/40 animate-pulse">
                      <Wand2 className="h-10 w-10" />
                    </div>
                  </div>
                </div>
              )}

              {/* ACTION 3: VIDEO / AUDIO VISUAL */}
              {activeShowcaseIndex === 2 && (
                <div className="w-full max-w-sm flex flex-col items-center justify-center gap-4 animate-fade-in">
                  <div className="w-full rounded-2xl border border-indigo-400/30 bg-white/90 dark:bg-[#0A0F1D]/80 p-4 space-y-3 shadow-2xl shadow-indigo-950/20">
                    <div className="flex items-center justify-between">
                      <Video className="h-5 w-5 text-indigo-500 dark:text-indigo-400" />
                      <Volume2 className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                    </div>

                    {/* Equalizer Waveform */}
                    <div className="relative h-10 w-full rounded-lg bg-slate-100 dark:bg-slate-950/80 overflow-hidden flex items-center px-2">
                      <div className="flex items-center gap-1.5 w-full h-full">
                        {[40, 75, 30, 90, 50, 85, 100, 45, 65, 95, 30, 90, 75, 40, 60, 100, 35, 70, 85, 45].map((h, i) => (
                          <div
                            key={i}
                            className="flex-1 bg-gradient-to-t from-indigo-500 to-cyan-400 rounded-full"
                            style={{ height: `${h}%` }}
                          />
                        ))}
                      </div>
                      <div className="absolute inset-y-0 left-1/4 right-1/4 bg-cyan-400/20 border-x-2 border-cyan-400" />
                    </div>
                  </div>
                </div>
              )}

              {/* ACTION 4: SUBTITLES / TRANSCRIPTION VISUAL */}
              {activeShowcaseIndex === 3 && (
                <div className="w-full max-w-sm flex flex-col items-center justify-center gap-3 animate-fade-in">
                  <div className="w-full rounded-2xl border border-purple-400/30 bg-white/90 dark:bg-[#0A0F1D]/80 p-5 space-y-3 shadow-2xl shadow-purple-950/20">
                    <div className="flex items-center justify-between">
                      <Subtitles className="h-5 w-5 text-purple-500 dark:text-purple-400" />
                      <div className="flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full bg-purple-400 animate-ping" />
                        <span className="h-2 w-2 rounded-full bg-purple-400" />
                      </div>
                    </div>

                    {/* Soundwave lines simulating speech */}
                    <div className="space-y-2">
                      <div className="h-2 w-full bg-gradient-to-r from-purple-400/50 to-indigo-400/50 rounded-full" />
                      <div className="h-2 w-4/5 bg-gradient-to-r from-purple-400/40 to-indigo-400/40 rounded-full" />
                      <div className="h-2 w-3/5 bg-gradient-to-r from-purple-400/30 to-indigo-400/30 rounded-full" />
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Minimal Dot Indicators */}
            <div className="flex items-center gap-2 pt-2">
              {[0, 1, 2, 3].map((idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveShowcaseIndex(idx)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    idx === activeShowcaseIndex
                      ? 'w-6 bg-[#D4C596] shadow-[0_0_8px_rgba(212,197,150,0.4)]'
                      : 'w-2 bg-slate-300 dark:bg-slate-700 hover:bg-slate-400 dark:hover:bg-slate-500'
                  }`}
                  aria-label={`View showcase ${idx + 1}`}
                />
              ))}
            </div>

          </div>

        </div>
      </div>

      {/* BOTTOM OF 100VH HERO: Trust Highlights Bar */}
      <div className="w-full pt-6 pb-2 border-t border-slate-200 dark:border-white/[0.07] flex flex-wrap items-center justify-around gap-4 text-xs sm:text-sm text-slate-600 dark:text-[#94A3B8]">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="h-4 w-4 text-emerald-500 dark:text-[#34D399] shrink-0" />
          <span className="font-medium text-slate-800 dark:text-slate-200">Zero Uploads</span>
        </div>
        <div className="flex items-center gap-2.5">
          <Zap className="h-4 w-4 text-sky-500 dark:text-[#38BDF8] shrink-0" />
          <span className="font-medium text-slate-800 dark:text-slate-200">Instant Speed</span>
        </div>
        <div className="flex items-center gap-2.5">
          <Lock className="h-4 w-4 text-purple-500 dark:text-[#A78BFA] shrink-0" />
          <span className="font-medium text-slate-800 dark:text-slate-200">Private by Design</span>
        </div>
      </div>
    </section>
  );
};


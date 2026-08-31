import React, { useState, useMemo } from 'react';
import { BUILTIN_VOICES } from '../../../engines/ttsEngine';
import type { VoiceOption } from '../../../engines/ttsTypes';
import { Search, Volume2, Check, X, Sparkles, Filter, ChevronDown } from 'lucide-react';

interface VoiceSelectorProps {
  selectedVoiceId: string;
  onSelectVoice: (voiceId: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const VoiceSelector: React.FC<VoiceSelectorProps> = ({
  selectedVoiceId,
  onSelectVoice,
  isOpen,
  onClose,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [genderFilter, setGenderFilter] = useState<'all' | 'female' | 'male'>('all');
  const [accentFilter, setAccentFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const filteredVoices = useMemo(() => {
    return BUILTIN_VOICES.filter((voice) => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        voice.name.toLowerCase().includes(q) ||
        voice.description.toLowerCase().includes(q) ||
        voice.country.toLowerCase().includes(q) ||
        (voice.traits && voice.traits.toLowerCase().includes(q));

      const matchGender = genderFilter === 'all' || voice.gender === genderFilter;
      const matchAccent = accentFilter === 'all' || voice.language === accentFilter;
      const matchCategory = categoryFilter === 'all' || voice.category === categoryFilter;

      return matchSearch && matchGender && matchAccent && matchCategory;
    });
  }, [searchQuery, genderFilter, accentFilter, categoryFilter]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      {/* Modal Container */}
      <div className="relative w-full max-w-3xl max-h-[85vh] bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-100 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Volume2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Select Voice</h3>
              <p className="text-xs text-slate-400">Choose from 20+ studio-grade neural voices</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Filters Bar */}
        <div className="px-6 py-4 border-b border-slate-800/80 bg-slate-950/50 space-y-3">
          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by voice name, accent, style (e.g., 'Heart', 'British', 'Deep')..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all shadow-inner"
              autoFocus
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center justify-between flex-wrap gap-2 pt-1 text-xs">
            {/* Gender Filters */}
            <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setGenderFilter('all')}
                className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                  genderFilter === 'all' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setGenderFilter('female')}
                className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                  genderFilter === 'female' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                Female
              </button>
              <button
                type="button"
                onClick={() => setGenderFilter('male')}
                className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                  genderFilter === 'male' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                Male
              </button>
            </div>

            {/* Accent Select */}
            <div className="flex items-center gap-2">
              <select
                value={accentFilter}
                onChange={(e) => setAccentFilter(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="all">🌍 All Accents</option>
                <option value="en-us">🇺🇸 American</option>
                <option value="en-gb">🇬🇧 British</option>
              </select>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="all">✨ All Styles</option>
                <option value="natural">Natural</option>
                <option value="narrative">Narrative</option>
                <option value="conversational">Conversational</option>
                <option value="character">Character</option>
              </select>
            </div>
          </div>
        </div>

        {/* Voices Grid */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 sm:grid-cols-2 gap-3.5 custom-scrollbar">
          {filteredVoices.map((voice) => {
            const isSelected = voice.id === selectedVoiceId;
            return (
              <div
                key={voice.id}
                onClick={() => {
                  onSelectVoice(voice.id);
                  onClose();
                }}
                className={`group relative p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-3 text-left ${
                  isSelected
                    ? 'bg-indigo-950/40 border-indigo-500/80 ring-1 ring-indigo-500/40 shadow-lg shadow-indigo-950/40'
                    : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/80'
                }`}
              >
                {/* Voice Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-xl shrink-0 group-hover:scale-105 transition-transform">
                      {voice.flag}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-white">{voice.name}</span>
                        {voice.grade && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                            {voice.grade}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-400 capitalize">
                        {voice.country} • {voice.gender}
                      </span>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-md">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  )}
                </div>

                {/* Voice Description */}
                <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                  {voice.description}
                </p>

                {/* Traits Badges */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-900 text-slate-400 border border-slate-800 capitalize">
                    {voice.category}
                  </span>
                  {voice.traits && (
                    <span className="text-[10px] text-indigo-300/80">
                      {voice.traits}
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          {filteredVoices.length === 0 && (
            <div className="col-span-2 py-12 text-center text-slate-500">
              <p className="text-sm">No voices found matching "{searchQuery}".</p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setGenderFilter('all');
                  setAccentFilter('all');
                  setCategoryFilter('all');
                }}
                className="mt-3 text-xs text-indigo-400 hover:underline cursor-pointer"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between text-xs text-slate-400">
          <span>{filteredVoices.length} voices available</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl transition-all cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

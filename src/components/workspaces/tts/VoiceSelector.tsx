import React, { useState, useMemo } from 'react';
import { BUILTIN_VOICES } from '../../../engines/ttsEngine';
import type { VoiceOption } from '../../../engines/ttsTypes';
import { Search, Volume2, Sparkles, User, Globe, Check, Radio, Activity } from 'lucide-react';

interface VoiceSelectorProps {
  selectedVoiceId: string;
  onSelectVoice: (voiceId: string) => void;
}

export const VoiceSelector: React.FC<VoiceSelectorProps> = ({
  selectedVoiceId,
  onSelectVoice,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGender, setSelectedGender] = useState<'all' | 'female' | 'male'>('all');
  const [selectedAccent, setSelectedAccent] = useState<string>('all');

  const filteredVoices = useMemo(() => {
    return BUILTIN_VOICES.filter((voice) => {
      const matchSearch =
        voice.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        voice.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        voice.country.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchGender = selectedGender === 'all' || voice.gender === selectedGender;
      const matchAccent = selectedAccent === 'all' || voice.language === selectedAccent;

      return matchSearch && matchGender && matchAccent;
    });
  }, [searchQuery, selectedGender, selectedAccent]);

  const selectedVoice = BUILTIN_VOICES.find(v => v.id === selectedVoiceId) || BUILTIN_VOICES[0];

  return (
    <div className="bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-slate-800/90 p-6 sm:p-7 shadow-2xl space-y-6">
      {/* Header with Title & Active Voice Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2.5">
            <Volume2 className="w-6 h-6 text-indigo-400" />
            AI Voice Selection
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Choose from 24+ high-fidelity neural voices with distinct vocal timbres
          </p>
        </div>

        {/* Selected badge */}
        <div className="flex items-center gap-3 bg-indigo-950/60 border border-indigo-500/40 px-4 py-2.5 rounded-2xl shadow-lg shadow-indigo-950/30">
          <span className="text-2xl">{selectedVoice.flag}</span>
          <div>
            <div className="text-xs sm:text-sm font-bold text-indigo-200">{selectedVoice.name}</div>
            <div className="text-[11px] text-slate-400 capitalize">{selectedVoice.country} • {selectedVoice.gender}</div>
          </div>
        </div>
      </div>

      {/* Filter Toolbar with Generous Padding */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Search */}
        <div className="relative sm:col-span-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search voices..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-xl bg-slate-950/90 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all shadow-inner"
          />
        </div>

        {/* Gender Filter Buttons */}
        <div className="flex items-center bg-slate-950/90 p-1 rounded-xl border border-slate-700/80">
          <button
            type="button"
            onClick={() => setSelectedGender('all')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              selectedGender === 'all' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setSelectedGender('female')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              selectedGender === 'female' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Female
          </button>
          <button
            type="button"
            onClick={() => setSelectedGender('male')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              selectedGender === 'male' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Male
          </button>
        </div>

        {/* Accent / Regional Filter */}
        <select
          value={selectedAccent}
          onChange={(e) => setSelectedAccent(e.target.value)}
          className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl bg-slate-950/90 border border-slate-700/80 text-white focus:outline-none focus:border-indigo-500 transition-all cursor-pointer font-medium shadow-inner"
        >
          <option value="all">🌍 All Regions</option>
          <option value="en-us">🇺🇸 American English</option>
          <option value="en-gb">🇬🇧 British English</option>
        </select>
      </div>

      {/* Voice Cards Grid with Generous Spacing & Padding */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[460px] overflow-y-auto p-1 pr-2 custom-scrollbar">
        {filteredVoices.map((voice) => {
          const isSelected = voice.id === selectedVoiceId;
          return (
            <button
              key={voice.id}
              type="button"
              onClick={() => onSelectVoice(voice.id)}
              className={`flex items-start gap-4 p-4 sm:p-5 rounded-2xl border text-left transition-all duration-200 cursor-pointer shadow-md group ${
                isSelected
                  ? 'bg-gradient-to-br from-indigo-950/70 via-indigo-900/40 to-slate-900/90 border-indigo-500 shadow-indigo-500/20 ring-2 ring-indigo-500/30'
                  : 'bg-slate-950/70 border-slate-800/90 hover:border-slate-600 hover:bg-slate-900/80 hover:shadow-lg'
              }`}
            >
              {/* Flag / Avatar */}
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 transition-transform group-hover:scale-105 border ${
                isSelected ? 'bg-indigo-500/20 border-indigo-400/50 shadow-inner' : 'bg-slate-900 border-slate-800'
              }`}>
                {voice.flag}
              </div>

              {/* Info & Tags */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className={`text-sm sm:text-base font-bold truncate ${isSelected ? 'text-indigo-200' : 'text-white'}`}>
                    {voice.name}
                  </span>
                  {isSelected ? (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-indigo-400 bg-indigo-500/20 px-2 py-0.5 rounded-full border border-indigo-500/40 shrink-0">
                      <Check className="w-3 h-3" />
                      Active
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-500 capitalize">{voice.language}</span>
                  )}
                </div>

                <p className="text-xs text-slate-400 leading-relaxed line-clamp-2 mt-0.5">
                  {voice.description}
                </p>

                {/* Badges */}
                <div className="flex flex-wrap items-center gap-2 mt-3">
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-900/90 text-slate-300 capitalize border border-slate-700/80">
                    {voice.gender}
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-900/90 text-indigo-300 capitalize border border-slate-700/80">
                    {voice.category}
                  </span>
                  {isSelected && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-950/60 text-emerald-300 border border-emerald-500/30">
                      24kHz Studio
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

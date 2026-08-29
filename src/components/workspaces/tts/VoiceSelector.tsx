import React, { useState, useMemo } from 'react';
import { BUILTIN_VOICES } from '../../../engines/ttsEngine';
import type { VoiceOption } from '../../../engines/ttsTypes';
import { Search, Volume2, Sparkles, User, Globe, Check, Radio } from 'lucide-react';

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
    <div className="bg-slate-900/70 backdrop-blur-md rounded-2xl border border-slate-800 p-5 shadow-xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Volume2 className="w-5 h-5 text-indigo-400" />
            AI Voice Selection
          </h3>
          <p className="text-xs text-slate-400">
            Select from 24+ studio-grade neural voices with distinct timbres
          </p>
        </div>

        {/* Selected badge */}
        <div className="flex items-center gap-2 bg-indigo-500/15 border border-indigo-500/30 px-3 py-1.5 rounded-xl shadow-inner">
          <span className="text-sm">{selectedVoice.flag}</span>
          <span className="text-xs font-bold text-indigo-300">{selectedVoice.name}</span>
          <span className="text-[10px] text-slate-400 capitalize">({selectedVoice.gender})</span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-4">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search voice name or style..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-950/80 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all"
          />
        </div>

        {/* Gender Filter */}
        <div className="flex items-center bg-slate-950/80 p-0.5 rounded-xl border border-slate-700/80">
          <button
            onClick={() => setSelectedGender('all')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              selectedGender === 'all' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setSelectedGender('female')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              selectedGender === 'female' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Female
          </button>
          <button
            onClick={() => setSelectedGender('male')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              selectedGender === 'male' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Male
          </button>
        </div>

        {/* Accent / Regional Filter */}
        <select
          value={selectedAccent}
          onChange={(e) => setSelectedAccent(e.target.value)}
          className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950/80 border border-slate-700/80 text-white focus:outline-none focus:border-indigo-500 transition-all cursor-pointer font-medium"
        >
          <option value="all">🌍 All Accents</option>
          <option value="en-us">🇺🇸 American English</option>
          <option value="en-gb">🇬🇧 British English</option>
        </select>
      </div>

      {/* Voice Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
        {filteredVoices.map((voice) => {
          const isSelected = voice.id === selectedVoiceId;
          return (
            <button
              key={voice.id}
              onClick={() => onSelectVoice(voice.id)}
              className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                isSelected
                  ? 'bg-indigo-600/25 border-indigo-500 shadow-md shadow-indigo-500/15'
                  : 'bg-slate-950/50 border-slate-800/80 hover:border-slate-700 hover:bg-slate-800/70'
              }`}
            >
              <div className="text-2xl shrink-0 mt-0.5">{voice.flag}</div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1 mb-0.5">
                  <span className={`text-xs font-bold truncate ${isSelected ? 'text-indigo-300' : 'text-slate-200'}`}>
                    {voice.name}
                  </span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0" />}
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-2 leading-snug">
                  {voice.description}
                </p>
                <div className="flex items-center gap-1.5 mt-2">
                  <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 capitalize border border-slate-700">
                    {voice.gender}
                  </span>
                  <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 capitalize border border-slate-700">
                    {voice.category}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

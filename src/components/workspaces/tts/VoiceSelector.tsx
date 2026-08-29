import React, { useState, useMemo } from 'react';
import { BUILTIN_VOICES } from '../../../engines/ttsEngine';
import type { VoiceOption } from '../../../engines/ttsTypes';
import { Search, Volume2, Sparkles, User, Globe, Check } from 'lucide-react';

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
  const [selectedLang, setSelectedLang] = useState<string>('all');

  const filteredVoices = useMemo(() => {
    return BUILTIN_VOICES.filter((voice) => {
      const matchSearch =
        voice.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        voice.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        voice.country.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchGender = selectedGender === 'all' || voice.gender === selectedGender;
      const matchLang = selectedLang === 'all' || voice.language === selectedLang;

      return matchSearch && matchGender && matchLang;
    });
  }, [searchQuery, selectedGender, selectedLang]);

  const selectedVoice = BUILTIN_VOICES.find(v => v.id === selectedVoiceId) || BUILTIN_VOICES[0];

  return (
    <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800 p-5 shadow-xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Volume2 className="w-5 h-5 text-indigo-400" />
            AI Voice Selection
          </h3>
          <p className="text-xs text-slate-400">
            Select from 50+ natural, studio-quality neural voices
          </p>
        </div>

        {/* Selected badge */}
        <div className="flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 rounded-xl">
          <span className="text-sm">{selectedVoice.flag}</span>
          <span className="text-xs font-semibold text-indigo-300">{selectedVoice.name}</span>
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
            placeholder="Search voice or style..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-800/80 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all"
          />
        </div>

        {/* Gender Filter */}
        <div className="flex items-center bg-slate-800/80 p-0.5 rounded-xl border border-slate-700/80">
          <button
            onClick={() => setSelectedGender('all')}
            className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${
              selectedGender === 'all' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setSelectedGender('female')}
            className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${
              selectedGender === 'female' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Female
          </button>
          <button
            onClick={() => setSelectedGender('male')}
            className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${
              selectedGender === 'male' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Male
          </button>
        </div>

        {/* Language Filter */}
        <select
          value={selectedLang}
          onChange={(e) => setSelectedLang(e.target.value)}
          className="w-full px-3 py-2 text-xs rounded-xl bg-slate-800/80 border border-slate-700/80 text-white focus:outline-none focus:border-indigo-500 transition-all cursor-pointer"
        >
          <option value="all">🌍 All Languages</option>
          <option value="en-us">🇺🇸 American English</option>
          <option value="en-gb">🇬🇧 British English</option>
          <option value="ja">🇯🇵 Japanese</option>
          <option value="es">🇪🇸 Spanish</option>
          <option value="fr">🇫🇷 French</option>
          <option value="it">🇮🇹 Italian</option>
          <option value="hi">🇮🇳 Hindi</option>
          <option value="pt">🇧🇷 Portuguese</option>
          <option value="zh">🇨🇳 Chinese</option>
        </select>
      </div>

      {/* Voice Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
        {filteredVoices.map((voice) => {
          const isSelected = voice.id === selectedVoiceId;
          return (
            <button
              key={voice.id}
              onClick={() => onSelectVoice(voice.id)}
              className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${
                isSelected
                  ? 'bg-indigo-600/20 border-indigo-500 shadow-md shadow-indigo-500/10'
                  : 'bg-slate-800/50 border-slate-800 hover:border-slate-700 hover:bg-slate-800'
              }`}
            >
              <div className="text-xl shrink-0 mt-0.5">{voice.flag}</div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1 mb-0.5">
                  <span className={`text-xs font-semibold truncate ${isSelected ? 'text-indigo-300' : 'text-slate-200'}`}>
                    {voice.name}
                  </span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0" />}
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-1 leading-snug">
                  {voice.description}
                </p>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700/60 text-slate-300 capitalize">
                    {voice.gender}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700/60 text-slate-300 capitalize">
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

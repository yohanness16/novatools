import React, { useState, useMemo } from 'react';
import { BUILTIN_VOICES } from '../../../engines/ttsEngine';
import { Search, Volume2, Check, X } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#141413]/55 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="nt-window relative w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--nt-border)] bg-[#F8FAFC] dark:bg-[#181B22]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] dark:bg-[#3B82F6]/15 text-[#2563EB] dark:text-[#60A5FA] flex items-center justify-center shadow-card">
              <Volume2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#111214] dark:text-[#F3F4F6]">
                Voices
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="nt-btn-secondary p-2"
            aria-label="Close voice selector"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Filters Bar */}
        <div className="px-6 py-4 border-b border-[var(--nt-border)] space-y-3 bg-[#F8FAFC] dark:bg-[#181B22]">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#746D61]" />
            <input
              type="text"
              placeholder="Search by voice name, accent, style (e.g., 'Heart', 'British', 'Deep')..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="nt-input w-full pl-10 pr-4 py-2.5 text-sm"
              autoFocus
            />
          </div>

          <div className="flex items-center justify-between flex-wrap gap-2 pt-1 text-xs">
            {/* Gender Filters */}
            <div className="nt-well flex items-center p-1 gap-1">
              {(['all', 'female', 'male'] as const).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGenderFilter(g)}
                  className={`px-3 py-1 rounded-lg font-bold capitalize transition-all cursor-pointer ${
                    genderFilter === g
                      ? 'bg-[#EFF6FF] dark:bg-[#3B82F6]/15 text-[#2563EB] dark:text-[#60A5FA]'
                      : 'text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#111214] dark:hover:text-[#F3F4F6]'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>

            {/* Accent & Category Filters */}
            <div className="flex items-center gap-2">
              <select
                value={accentFilter}
                onChange={(e) => setAccentFilter(e.target.value)}
                className="nt-input px-3 py-1.5 text-xs font-semibold cursor-pointer"
              >
                <option value="all">All Accents</option>
                <option value="en-us">American</option>
                <option value="en-gb">British</option>
              </select>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="nt-input px-3 py-1.5 text-xs font-semibold cursor-pointer"
              >
                <option value="all">All Styles</option>
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
                    ? 'bg-[#FEF7D6]/85 dark:bg-[#2563EB]/10 border-[#2563EB] ring-1 ring-[#FACC15]/40 shadow-card'
                    : 'nt-card-interactive'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="nt-well w-10 h-10 flex items-center justify-center text-xl shrink-0">
                      {voice.flag}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-[#111214] dark:text-[#F3F4F6]">
                          {voice.name}
                        </span>
                        {voice.grade && (
                          <span className="nt-badge-yellow text-[10px] font-bold px-1.5 py-0.5">
                            {voice.grade}
                          </span>
                        )}
                      </div>
                      <span className="font-mono text-[11px] text-[#6B7280] dark:text-[#9CA3AF] capitalize">
                        {voice.country} · {voice.gender}
                      </span>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="w-6 h-6 rounded-full bg-[#EFF6FF] dark:bg-[#3B82F6]/15 text-[#2563EB] dark:text-[#60A5FA] flex items-center justify-center shadow-sm">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  )}
                </div>

                <p className="text-xs text-[#4B5563] dark:text-[#D1D5DB] leading-relaxed line-clamp-2">
                  {voice.description}
                </p>

                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="nt-well text-[10px] font-mono font-bold px-2 py-0.5 text-[#4B5563] dark:text-[#D1D5DB] capitalize">
                    {voice.category}
                  </span>
                  {voice.traits && (
                    <span className="text-[10px] font-medium text-[#6B7280] dark:text-[#9CA3AF]">
                      {voice.traits}
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          {filteredVoices.length === 0 && (
            <div className="col-span-2 py-12 text-center text-[#6B7280] dark:text-[#9CA3AF]">
              <p className="text-sm font-semibold">No voices found matching &quot;{searchQuery}&quot;.</p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setGenderFilter('all');
                  setAccentFilter('all');
                  setCategoryFilter('all');
                }}
                className="nt-btn-secondary mt-3 px-3 py-1.5 text-xs font-bold"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[var(--nt-border)] bg-[#F8FAFC] dark:bg-[#181B22] flex items-center justify-between text-xs font-mono text-[#6B7280] dark:text-[#9CA3AF]">
          <span>{filteredVoices.length} voices available</span>
          <button
            type="button"
            onClick={onClose}
            className="nt-btn-yellow px-4 py-2 text-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

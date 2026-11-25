import React, { useState, useRef, useMemo } from 'react';
import { TOOLS, SUITES, CATEGORIES, type ToolMeta } from '../lib/toolsData';
import { matchToolsForFiles, storeHandoffFiles } from '../lib/fileHandoff';
import { formatBytes } from '../lib/utils';
import {
  Upload,
  Search,
  X,
  ArrowRight,
  Layers,
  Scissors,
  RotateCw,
  Lock,
  EyeOff,
  FileImage,
  FilePlus,
  Repeat,
  Minimize2,
  Maximize2,
  ShieldCheck,
  Code,
  Film,
  Clock,
  Music,
  VolumeX,
  Subtitles,
  Volume2,
  Sparkles,
  Hash,
  FileText,
  Presentation,
  FileSpreadsheet,
  Printer,
  Workflow,
  Database,
  GitBranch,
  File,
} from 'lucide-react';

const ICON_MAP: Record<string, React.ElementType> = {
  Layers,
  Scissors,
  RotateCw,
  Lock,
  EyeOff,
  FileImage,
  FilePlus,
  Repeat,
  Minimize2,
  Maximize2,
  ShieldCheck,
  Code,
  Film,
  Clock,
  Music,
  VolumeX,
  Subtitles,
  Volume2,
  Sparkles,
  Hash,
  FileText,
  Presentation,
  FileSpreadsheet,
  Printer,
  Workflow,
  Database,
  GitBranch,
};

export const ActionHub: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [query, setQuery] = useState('');
  const [droppedFiles, setDroppedFiles] = useState<File[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [launchingPath, setLaunchingPath] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const matchedTools = useMemo(
    () => matchToolsForFiles(droppedFiles, TOOLS),
    [droppedFiles]
  );

  const filteredTools = useMemo(() => {
    const q = query.trim().toLowerCase();
    return TOOLS.filter((tool) => {
      const catOk = activeCategory === 'all' || tool.category === activeCategory;
      if (!catOk) return false;
      if (!q) return true;
      return (
        tool.shortName.toLowerCase().includes(q) ||
        tool.name.toLowerCase().includes(q) ||
        tool.shortTag.toLowerCase().includes(q) ||
        tool.keywords.some((k) => k.toLowerCase().includes(q))
      );
    });
  }, [activeCategory, query]);

  const handleFilesSelected = (list: FileList | File[]) => {
    const arr = Array.from(list);
    if (arr.length > 0) {
      setDroppedFiles(arr);
    }
  };

  const handleActionLaunch = async (tool: ToolMeta) => {
    if (droppedFiles.length === 0) {
      window.location.href = tool.path;
      return;
    }
    setLaunchingPath(tool.path);
    try {
      await storeHandoffFiles(tool.path, droppedFiles);
    } catch {
      // Proceed even if IndexedDB is blocked
    }
    window.location.href = tool.path;
  };

  const totalSize = droppedFiles.reduce((acc, f) => acc + f.size, 0);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
      {/* 1. Universal Drop Bar */}
      <section aria-label="Drop file">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) handleFilesSelected(e.target.files);
            e.target.value = '';
          }}
        />

        {droppedFiles.length === 0 ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragOver(false);
              if (e.dataTransfer.files?.length) {
                handleFilesSelected(e.dataTransfer.files);
              }
            }}
            data-active={isDragOver ? 'true' : 'false'}
            className="nt-dropzone group cursor-pointer px-5 py-6 sm:py-7 flex flex-col sm:flex-row items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#EFF6FF] dark:bg-[#3B82F6]/15 text-[#2563EB] dark:text-[#60A5FA] transition-transform duration-150 group-hover:scale-105">
                <Upload className="h-5 w-5" />
              </div>
              <div className="flex items-center gap-2 text-base sm:text-lg font-bold tracking-tight text-[#111214] dark:text-[#F3F4F6]">
                <span>Drop file</span>
              </div>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              className="nt-btn-primary px-5 py-2.5 text-xs font-semibold inline-flex items-center gap-2 shrink-0"
            >
              <span>Browse</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragOver(false);
              if (e.dataTransfer.files?.length) {
                handleFilesSelected(e.dataTransfer.files);
              }
            }}
            className="nt-window p-4 sm:p-5 space-y-4 border-[#2563EB]/40"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#EFF6FF] dark:bg-[#3B82F6]/15 text-[#2563EB] dark:text-[#60A5FA]">
                  <File className="h-4 w-4" />
                </div>
                <div className="flex items-center gap-2 min-w-0 flex-wrap">
                  <span className="text-xs font-bold text-[#111214] dark:text-[#F3F4F6] truncate max-w-[240px] sm:max-w-md">
                    {droppedFiles.length === 1
                      ? droppedFiles[0].name
                      : `${droppedFiles.length} files`}
                  </span>
                  <span className="font-mono text-[11px] text-[#6B7280] dark:text-[#9CA3AF]">
                    {formatBytes(totalSize)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="nt-btn-secondary px-3 py-1.5 text-xs font-semibold"
                >
                  Change
                </button>
                <button
                  type="button"
                  onClick={() => setDroppedFiles([])}
                  className="nt-btn-secondary p-1.5 text-[#6B7280] hover:text-[#111214] dark:hover:text-white"
                  aria-label="Clear"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Instant Matched Actions */}
            <div className="flex flex-wrap gap-2">
              {matchedTools.length > 0 ? (
                matchedTools.map((tool, idx) => {
                  const Icon = ICON_MAP[tool.iconName] || Layers;
                  const isLaunching = launchingPath === tool.path;
                  return (
                    <button
                      key={tool.id}
                      type="button"
                      disabled={Boolean(launchingPath)}
                      onClick={() => handleActionLaunch(tool)}
                      className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        idx === 0
                          ? 'nt-btn-primary'
                          : 'nt-btn-secondary hover:border-[#2563EB]/40'
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      <span>{isLaunching ? 'Opening...' : tool.shortName}</span>
                    </button>
                  );
                })
              ) : (
                <span className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">
                  Select tool below
                </span>
              )}
            </div>
          </div>
        )}
      </section>

      {/* 2. Bespoke Visual Suite Strip */}
      <section aria-label="Suites" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {SUITES.map((suite) => {
          const isSelected = activeCategory === suite.id;
          return (
            <button
              key={suite.id}
              type="button"
              onClick={() =>
                setActiveCategory((prev) => (prev === suite.id ? 'all' : suite.id))
              }
              className={`group nt-card-interactive overflow-hidden text-left cursor-pointer flex flex-col ${
                isSelected
                  ? 'ring-2 ring-[#2563EB] border-[#2563EB]'
                  : ''
              }`}
            >
              <div className="aspect-[4/3] w-full bg-[#F8FAFC] dark:bg-[#181B22] overflow-hidden border-b border-[var(--nt-border)] flex items-center justify-center">
                <img
                  src={suite.image}
                  alt={suite.label}
                  loading="eager"
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <div className="px-3.5 py-2.5 flex items-center justify-between">
                <span className="text-xs font-bold text-[#111214] dark:text-[#F3F4F6]">
                  {suite.label}
                </span>
                <span className="font-mono text-[11px] text-[#6B7280] dark:text-[#9CA3AF]">
                  {suite.count}
                </span>
              </div>
            </button>
          );
        })}
      </section>

      {/* 3. Filter Bar + Action Grid */}
      <section aria-label="Tools" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {CATEGORIES.map((cat) => {
              const active = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                    active
                      ? 'bg-[#111214] dark:bg-[#2563EB] text-white'
                      : 'bg-white dark:bg-[#13151A] text-[#4B5563] dark:text-[#9CA3AF] border border-[var(--nt-border)] hover:text-[#111214] dark:hover:text-white'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          <div className="relative w-full sm:w-56">
            <Search className="h-3.5 w-3.5 text-[#6B7280] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter"
              aria-label="Filter tools"
              className="nt-input w-full pl-8 pr-7 py-1.5 text-xs"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[#6B7280] hover:text-[#111214] dark:hover:text-white cursor-pointer"
                aria-label="Clear filter"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* 1-2 Word Action Tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {filteredTools.map((tool) => {
            const Icon = ICON_MAP[tool.iconName] || Layers;
            return (
              <a
                key={tool.id}
                href={tool.path}
                className="group nt-card-interactive p-4 flex flex-col justify-between gap-4 min-h-[104px]"
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#EFF6FF] dark:bg-[#3B82F6]/15 text-[#2563EB] dark:text-[#60A5FA] transition-colors group-hover:bg-[#2563EB] group-hover:text-white">
                    <Icon className="h-4 w-4" />
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-[#9CA3AF] opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 group-hover:text-[#2563EB] transition-all" />
                </div>

                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-sm font-bold text-[#111214] dark:text-[#F3F4F6] truncate">
                    {tool.shortName}
                  </span>
                  {activeCategory === 'all' && (
                    <span className="font-mono text-[10px] text-[#6B7280] dark:text-[#9CA3AF] shrink-0">
                      {tool.shortTag}
                    </span>
                  )}
                </div>
              </a>
            );
          })}
        </div>
      </section>
    </div>
  );
};

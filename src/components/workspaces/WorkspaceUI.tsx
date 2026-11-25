import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, Loader2, Upload } from 'lucide-react';

interface WorkspaceDropzoneProps {
  onClick: () => void;
  onFilesDrop?: (files: FileList) => void;
  icon?: React.ReactNode;
  title: string;
  highlightText?: string;
  subtitle: string;
  badgeText?: string;
  children?: React.ReactNode;
}

/**
 * Shared tactile desktop dropzone used across NovaTools workspaces.
 */
export const WorkspaceDropzone: React.FC<WorkspaceDropzoneProps> = ({
  onClick,
  onFilesDrop,
  icon,
  title,
  highlightText = 'browse files',
  subtitle,
  badgeText,
  children,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);

  return (
    <div
      onClick={onClick}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragOver(false);
        if (onFilesDrop && e.dataTransfer.files?.length) {
          onFilesDrop(e.dataTransfer.files);
        }
      }}
      data-active={isDragOver ? 'true' : 'false'}
      className="nt-dropzone group relative flex cursor-pointer flex-col items-center justify-center p-8 sm:p-12 text-center"
    >
      {children}

      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#141413] text-[#FACC15] shadow-card transition-transform duration-150 group-hover:-translate-y-0.5">
        {icon || <Upload className="h-5 w-5" />}
      </div>

      <h3 className="mt-4 text-sm font-extrabold text-[#141413] dark:text-[#FAF7F0]">
        {title}{' '}
        <span className="underline decoration-[#FACC15] decoration-2 underline-offset-4">
          {highlightText}
        </span>
      </h3>

      <p className="mt-1.5 font-mono text-xs text-[#746D61] dark:text-[#938B7D] max-w-md">
        {subtitle}
      </p>

      {badgeText && (
        <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white dark:bg-[#1F1D19] px-3 py-1 text-[10px] font-mono font-semibold text-[#454038] dark:text-[#CBC4B6] border border-[var(--nt-border)] shadow-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-[#15803D] dark:bg-[#4ADE80]" />
          <span>{badgeText}</span>
        </div>
      )}
    </div>
  );
};

interface WorkspaceAlertProps {
  variant: 'error' | 'success' | 'info';
  message: string;
  action?: React.ReactNode;
}

/**
 * Unified inline status alert for workspace results and errors.
 */
export const WorkspaceAlert: React.FC<WorkspaceAlertProps> = ({ variant, message, action }) => {
  if (variant === 'error') {
    return (
      <div className="nt-badge-danger flex items-center justify-between gap-3 p-3.5 text-xs font-semibold">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{message}</span>
        </div>
        {action}
      </div>
    );
  }

  if (variant === 'success') {
    return (
      <div className="nt-badge-success rounded-xl flex flex-wrap items-center justify-between gap-3 p-3.5 text-xs font-semibold">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{message}</span>
        </div>
        {action}
      </div>
    );
  }

  return (
    <div className="nt-badge-yellow rounded-xl flex items-center justify-between gap-3 p-3.5 text-xs font-semibold">
      <div className="flex items-center gap-2">
        <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
        <span>{message}</span>
      </div>
      {action}
    </div>
  );
};

interface WorkspaceProgressProps {
  message: string;
  progress: number;
}

/**
 * Tactile progress bar for local browser processing tasks.
 */
export const WorkspaceProgress: React.FC<WorkspaceProgressProps> = ({ message, progress }) => (
  <div className="nt-well p-3.5 space-y-2">
    <div className="flex items-center justify-between text-xs">
      <span className="font-semibold text-[#141413] dark:text-[#FAF7F0] flex items-center gap-2">
        <Loader2 className="h-3.5 w-3.5 animate-spin text-[#CA8A04] dark:text-[#FACC15]" />
        <span>{message}</span>
      </span>
      <span className="font-mono font-bold text-[#141413] dark:text-[#FACC15]">
        {progress}%
      </span>
    </div>
    <div className="h-2 w-full overflow-hidden rounded-full bg-white dark:bg-[#141311] border border-[var(--nt-border)] p-0.5">
      <div
        className="h-full bg-[#FACC15] transition-all duration-200 rounded-full"
        style={{ width: `${Math.max(4, Math.min(100, progress))}%` }}
      />
    </div>
  </div>
);

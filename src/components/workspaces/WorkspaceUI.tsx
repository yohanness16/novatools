import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, Loader2, Upload } from 'lucide-react';

interface WorkspaceDropzoneProps {
  onClick: () => void;
  onFilesDrop?: (files: FileList) => void;
  icon?: React.ReactNode;
  title?: string;
  highlightText?: string;
  subtitle?: string;
  badgeText?: string;
  children?: React.ReactNode;
}

/**
 * Minimal action-led dropzone used across NovaTools workspaces.
 */
export const WorkspaceDropzone: React.FC<WorkspaceDropzoneProps> = ({
  onClick,
  onFilesDrop,
  icon,
  highlightText = 'Browse',
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
      className="nt-dropzone group relative flex cursor-pointer flex-col items-center justify-center p-10 sm:p-14 text-center"
    >
      {children}

      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#EFF6FF] dark:bg-[#3B82F6]/15 text-[#2563EB] dark:text-[#60A5FA] transition-transform duration-150 group-hover:scale-105">
        {icon || <Upload className="h-5 w-5" />}
      </div>

      <div className="mt-4 flex items-center gap-2">
        <span className="text-sm font-bold text-[#111214] dark:text-[#F3F4F6]">
          Drop file
        </span>
        <span className="nt-btn-primary px-3 py-1 text-xs font-semibold">
          {highlightText}
        </span>
      </div>
    </div>
  );
};

interface WorkspaceAlertProps {
  variant: 'error' | 'success' | 'info';
  message: string;
  action?: React.ReactNode;
}

export const WorkspaceAlert: React.FC<WorkspaceAlertProps> = ({ variant, message, action }) => {
  if (variant === 'error') {
    return (
      <div className="nt-badge-danger flex items-center justify-between gap-3 p-3 text-xs font-semibold">
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
      <div className="nt-badge-success rounded-lg flex flex-wrap items-center justify-between gap-3 p-3 text-xs font-semibold">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{message}</span>
        </div>
        {action}
      </div>
    );
  }

  return (
    <div className="nt-badge-yellow rounded-lg flex items-center justify-between gap-3 p-3 text-xs font-semibold">
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

export const WorkspaceProgress: React.FC<WorkspaceProgressProps> = ({ message, progress }) => (
  <div className="nt-well p-3 space-y-2">
    <div className="flex items-center justify-between text-xs">
      <span className="font-semibold text-[#111214] dark:text-[#F3F4F6] flex items-center gap-2">
        <Loader2 className="h-3.5 w-3.5 animate-spin text-[#2563EB]" />
        <span>{message}</span>
      </span>
      <span className="font-mono font-bold text-[#2563EB]">
        {progress}%
      </span>
    </div>
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white dark:bg-[#13151A]">
      <div
        className="h-full bg-[#2563EB] transition-all duration-200 rounded-full"
        style={{ width: `${Math.max(4, Math.min(100, progress))}%` }}
      />
    </div>
  </div>
);

'use client';

import { useState, useRef, DragEvent, ChangeEvent } from 'react';

interface FileUploaderProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  maxSize?: number; // in MB
  label?: string;
  description?: string;
  icon?: string;
}

export default function FileUploader({
  onFileSelect,
  accept = 'audio/*,video/*,.mp3,.mp4,.wav,.mov',
  maxSize = 500, // 500MB default
  label = 'Upload Audio or Video',
  description = 'Drag and drop your lecture recording here, or click to browse',
  icon = 'videocam'
}: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): boolean => {
    setError(null);

    // Check file size
    const maxBytes = maxSize * 1024 * 1024;
    if (file.size > maxBytes) {
      setError(`File size exceeds ${maxSize}MB limit`);
      return false;
    }

    return true;
  };

  const handleFile = (file: File) => {
    if (validateFile(file)) {
      setSelectedFile(file);
      onFileSelect(file);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const clearFile = () => {
    setSelectedFile(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getFileIcon = (file: File): string => {
    if (file.type.startsWith('audio/')) return 'audiotrack';
    if (file.type.startsWith('video/')) return 'videocam';
    return 'description';
  };

  return (
    <div className="w-full">
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileInput}
        className="hidden"
      />

      {/* Drop Zone */}
      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative glass border-2 border-dashed rounded-xl p-8 cursor-pointer
          transition-all duration-200
          ${isDragging
            ? 'border-cerulean bg-cerulean/5 scale-102'
            : 'border-oxford-blue/30 hover:border-oxford-blue/50'
          }
          ${selectedFile && !error ? 'bg-cerulean/5 border-cerulean/50' : ''}
          ${error ? 'border-amber-500/50 bg-amber-50/30' : ''}
        `}
      >
        <div className="flex flex-col items-center justify-center text-center">
          {/* Icon */}
          <div className={`w-16 h-16 mb-4 rounded-full flex items-center justify-center
            ${selectedFile && !error
              ? 'bg-success/10 border-2 border-success/30'
              : 'bg-cerulean/10 border-2 border-cerulean/20'
            }`}>
            <span className={`material-symbols-outlined text-4xl ${
              selectedFile && !error ? 'text-success' : 'text-cerulean'
            }`}>
              {selectedFile && !error ? 'check_circle' : 'cloud_upload'}
            </span>
          </div>

          {/* Text */}
          <p className="text-oxford-blue dark:text-text-dark font-semibold mb-2">
            {selectedFile && !error ? 'File uploaded successfully!' : description}
          </p>
          <p className="text-sm text-text-muted dark:text-text-dark-muted">
            {selectedFile && !error
              ? 'Click to change file or drag a different one'
              : `Supports ${accept.split(',').slice(0, 3).join(', ')} • Max ${maxSize}MB`
            }
          </p>
        </div>
      </div>

      {/* Uploaded File Display */}
      {selectedFile && !error && (
        <div className="mt-4 glass border border-oxford-blue/20 rounded-lg p-3
          flex items-center justify-between
          hover:border-cerulean transition-colors
          animate-slide-up">
          {/* File Icon + Name */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-cerulean/10 border border-cerulean/20 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-cerulean">
                {getFileIcon(selectedFile)}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-oxford-blue dark:text-text-dark font-medium truncate">
                {selectedFile.name}
              </p>
              <p className="text-xs text-text-muted dark:text-text-dark-muted">
                {formatFileSize(selectedFile.size)}
              </p>
            </div>
          </div>

          {/* Remove Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              clearFile();
            }}
            className="ml-2 p-1.5 rounded-full hover:bg-oxford-blue/10 dark:hover:bg-white/10 transition-colors flex-shrink-0"
            aria-label="Remove file"
          >
            <span className="material-symbols-outlined text-sm text-text-muted hover:text-oxford-blue dark:hover:text-text-dark transition-colors">
              close
            </span>
          </button>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="mt-4 glass border-2 border-amber-500/30 bg-amber-50/50 rounded-lg p-4 animate-shake">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-amber-600">warning</span>
            <div className="flex-1">
              <p className="text-sm text-amber-800 font-medium">{error}</p>
              <button
                onClick={() => setError(null)}
                className="text-xs text-amber-700 hover:text-amber-900 mt-1 underline"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

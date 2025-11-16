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

  return (
    <div className="w-full">
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileInput}
        className="hidden"
      />

      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          border-2 border-dashed rounded-xl p-8 cursor-pointer
          transition-all duration-200 ease-in-out
          ${isDragging
            ? 'border-primary bg-primary/5 scale-[1.02]'
            : 'border-gray-300 dark:border-gray-600 hover:border-primary/50'
          }
          ${selectedFile ? 'bg-green-50 dark:bg-green-900/20 border-green-500' : ''}
          ${error ? 'bg-red-50 dark:bg-red-900/20 border-red-500' : ''}
        `}
      >
        <div className="flex flex-col items-center justify-center text-center space-y-4">
          <span className="material-symbols-outlined text-5xl text-gray-400 dark:text-gray-500">
            {selectedFile ? 'check_circle' : icon}
          </span>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
              {label}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {description}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
              Max file size: {maxSize}MB
            </p>
          </div>

          {selectedFile && !error && (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 w-full max-w-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <span className="material-symbols-outlined text-green-600">
                    description
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(selectedFile.size)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    clearFile();
                  }}
                  className="ml-2 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                >
                  <span className="material-symbols-outlined text-sm text-gray-500">
                    close
                  </span>
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-4 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

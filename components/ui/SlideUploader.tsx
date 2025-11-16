'use client';

import { useState, useRef, DragEvent, ChangeEvent } from 'react';
import Image from 'next/image';

interface SlideUploaderProps {
  onFilesSelect: (files: File[]) => void;
  maxFiles?: number;
  maxSize?: number; // in MB per file
}

type FileType = 'pdf' | 'pptx' | 'image' | 'unknown';

interface FilePreview {
  file: File;
  type: FileType;
  preview?: string; // Only for images
}

export default function SlideUploader({
  onFilesSelect,
  maxFiles = 10,
  maxSize = 50 // 50MB per file
}: SlideUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<FilePreview[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getFileType = (file: File): FileType => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return 'pdf';
    if (ext === 'pptx' || ext === 'ppt') return 'pptx';
    if (file.type.startsWith('image/')) return 'image';
    return 'unknown';
  };

  const getFileIcon = (type: FileType): string => {
    switch (type) {
      case 'pdf': return 'picture_as_pdf';
      case 'pptx': return 'slideshow';
      case 'image': return 'image';
      default: return 'insert_drive_file';
    }
  };

  const getFileColor = (type: FileType): string => {
    switch (type) {
      case 'pdf': return 'text-red-500';
      case 'pptx': return 'text-orange-500';
      case 'image': return 'text-green-500';
      default: return 'text-gray-500';
    }
  };

  const validateFiles = (files: File[]): File[] => {
    setError(null);
    const validFiles: File[] = [];
    const maxBytes = maxSize * 1024 * 1024;

    for (const file of files) {
      const fileType = getFileType(file);

      // Check file type
      if (fileType === 'unknown') {
        setError('Only PDF, PPTX, PPT, and image files are allowed');
        continue;
      }

      // Check file size
      if (file.size > maxBytes) {
        setError(`Some files exceed ${maxSize}MB limit`);
        continue;
      }

      validFiles.push(file);
    }

    // Check total count
    if (selectedFiles.length + validFiles.length > maxFiles) {
      setError(`Maximum ${maxFiles} files allowed`);
      return validFiles.slice(0, maxFiles - selectedFiles.length);
    }

    return validFiles;
  };

  const createFilePreviews = async (files: File[]): Promise<FilePreview[]> => {
    const previews: FilePreview[] = [];

    for (const file of files) {
      const fileType = getFileType(file);
      const preview: FilePreview = { file, type: fileType };

      // Only create image preview for actual images
      if (fileType === 'image') {
        preview.preview = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
      }

      previews.push(preview);
    }

    return previews;
  };

  const handleFiles = async (files: File[]) => {
    const validFiles = validateFiles(files);
    if (validFiles.length > 0) {
      const newPreviews = await createFilePreviews(validFiles);
      const updatedPreviews = [...selectedFiles, ...newPreviews];
      setSelectedFiles(updatedPreviews);
      onFilesSelect(updatedPreviews.map(p => p.file));
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
      handleFiles(files);
    }
  };

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFiles(Array.from(files));
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const removeFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    onFilesSelect(newFiles.map(p => p.file));
    setError(null);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="w-full">
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.pptx,.ppt,image/*"
        multiple
        onChange={handleFileInput}
        className="hidden"
      />

      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          border-2 border-dashed rounded-xl p-6 cursor-pointer
          transition-all duration-200 ease-in-out
          ${isDragging
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/10 scale-[1.02]'
            : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'
          }
          ${error ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : ''}
        `}
      >
        <div className="flex flex-col items-center justify-center text-center space-y-3">
          <span className="material-symbols-outlined text-4xl text-gray-400 dark:text-gray-500">
            {selectedFiles.length > 0 ? 'folder_open' : 'upload_file'}
          </span>

          <div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
              Upload Lecture Slides (Optional)
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Upload PowerPoint, PDF, or slide images
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              Supports .pptx, .ppt, .pdf, and images • Max {maxFiles} files, {maxSize}MB each
            </p>
          </div>

          {selectedFiles.length > 0 && (
            <div className="text-sm font-medium text-blue-600 dark:text-blue-400">
              {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''} selected
            </div>
          )}

          {error && (
            <div className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-3 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Preview Grid */}
      {selectedFiles.length > 0 && (
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {selectedFiles.map((item, index) => (
            <div key={index} className="relative group">
              <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center">
                {item.type === 'image' && item.preview ? (
                  <Image
                    src={item.preview}
                    alt={`Slide ${index + 1}`}
                    width={200}
                    height={200}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center p-4">
                    <span className={`material-symbols-outlined text-5xl ${getFileColor(item.type)}`}>
                      {getFileIcon(item.type)}
                    </span>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 text-center">
                      {item.file.name.length > 12
                        ? item.file.name.slice(0, 12) + '...'
                        : item.file.name}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatFileSize(item.file.size)}
                    </p>
                  </div>
                )}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(index);
                }}
                className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
              {item.type === 'image' && (
                <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                  Image
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

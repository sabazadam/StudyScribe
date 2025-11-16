'use client';

import { useState, useRef, DragEvent, ChangeEvent } from 'react';
import Image from 'next/image';

interface ImageUploaderProps {
  onImagesSelect: (files: File[]) => void;
  maxFiles?: number;
  maxSize?: number; // in MB per file
}

export default function ImageUploader({
  onImagesSelect,
  maxFiles = 10,
  maxSize = 10 // 10MB per image
}: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFiles = (files: File[]): File[] => {
    setError(null);
    const validFiles: File[] = [];
    const maxBytes = maxSize * 1024 * 1024;

    for (const file of files) {
      // Check file type
      if (!file.type.startsWith('image/')) {
        setError('Only image files are allowed');
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
      setError(`Maximum ${maxFiles} images allowed`);
      return validFiles.slice(0, maxFiles - selectedFiles.length);
    }

    return validFiles;
  };

  const createPreviews = (files: File[]) => {
    const newPreviews: string[] = [];

    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        newPreviews.push(reader.result as string);
        if (newPreviews.length === files.length) {
          setPreviews(prev => [...prev, ...newPreviews]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFiles = (files: File[]) => {
    const validFiles = validateFiles(files);
    if (validFiles.length > 0) {
      const updatedFiles = [...selectedFiles, ...validFiles];
      setSelectedFiles(updatedFiles);
      createPreviews(validFiles);
      onImagesSelect(updatedFiles);
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

  const removeImage = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    setPreviews(newPreviews);
    onImagesSelect(newFiles);
    setError(null);
  };

  return (
    <div className="w-full">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
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
            ? 'border-accent bg-accent/5 scale-[1.02]'
            : 'border-gray-300 dark:border-gray-600 hover:border-accent/50'
          }
          ${error ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : ''}
        `}
      >
        <div className="flex flex-col items-center justify-center text-center space-y-3">
          <span className="material-symbols-outlined text-4xl text-gray-400 dark:text-gray-500">
            {selectedFiles.length > 0 ? 'photo_library' : 'add_photo_alternate'}
          </span>

          <div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
              Upload Lecture Photos
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Photos of whiteboards, handwritten notes, or diagrams
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              Max {maxFiles} images, {maxSize}MB each
            </p>
          </div>

          {selectedFiles.length > 0 && (
            <div className="text-sm font-medium text-accent">
              {selectedFiles.length} image{selectedFiles.length > 1 ? 's' : ''} selected
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
      {previews.length > 0 && (
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {previews.map((preview, index) => (
            <div key={index} className="relative group">
              <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <Image
                  src={preview}
                  alt={`Slide ${index + 1}`}
                  width={200}
                  height={200}
                  className="w-full h-full object-cover"
                />
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeImage(index);
                }}
                className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
              <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                {selectedFiles[index]?.name.slice(0, 15)}...
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

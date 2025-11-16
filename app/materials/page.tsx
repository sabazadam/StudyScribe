'use client';

import { useState, useEffect, useMemo } from 'react';

interface MaterialFile {
  id: string;
  fileName: string;
  originalName: string;
  filePath: string;
  fileType: 'audio' | 'video' | 'slide' | 'photo';
  size: number;
  uploadedAt: string;
}

interface LectureMaterial {
  id: string;
  instructorName: string;
  week: number;
  lectureNumber: number;
  audioFiles: MaterialFile[];
  slideFiles: MaterialFile[];
  photoFiles: MaterialFile[];
  uploadedAt: string;
  updatedAt: string;
}

export default function MaterialsPage() {
  // Form state
  const [instructorName, setInstructorName] = useState('');
  const [week, setWeek] = useState<number>(1);
  const [lectureNumber, setLectureNumber] = useState<number>(1);
  const [audioFiles, setAudioFiles] = useState<File[]>([]);
  const [slideFiles, setSlideFiles] = useState<File[]>([]);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);

  // UI state
  const [existingInstructors, setExistingInstructors] = useState<string[]>([]);
  const [materials, setMaterials] = useState<LectureMaterial[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [useExistingInstructor, setUseExistingInstructor] = useState(false);

  // Load existing instructors and materials
  useEffect(() => {
    loadInstructors();
    loadMaterials();
  }, []);

  const loadInstructors = async () => {
    try {
      const response = await fetch('/api/materials?action=instructors');
      const data = await response.json();
      if (data.success) {
        setExistingInstructors(data.instructors);
      }
    } catch (error) {
      console.error('Error loading instructors:', error);
    }
  };

  const loadMaterials = async () => {
    try {
      const response = await fetch('/api/materials');
      const data = await response.json();
      if (data.success) {
        setMaterials(data.materials);
      }
    } catch (error) {
      console.error('Error loading materials:', error);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'audio' | 'slide' | 'photo') => {
    const files = Array.from(e.target.files || []);

    if (files.length === 0) return;

    // Validate file count
    const maxFiles = 10;
    const maxFileSize = 50 * 1024 * 1024; // 50MB

    // Check file count
    if (type === 'audio' && audioFiles.length + files.length > maxFiles) {
      setMessage({ type: 'error', text: `Maximum ${maxFiles} audio files allowed` });
      return;
    }
    if (type === 'slide' && slideFiles.length + files.length > maxFiles) {
      setMessage({ type: 'error', text: `Maximum ${maxFiles} slide files allowed` });
      return;
    }
    if (type === 'photo' && photoFiles.length + files.length > maxFiles) {
      setMessage({ type: 'error', text: `Maximum ${maxFiles} photo files allowed` });
      return;
    }

    // Check file sizes
    const oversizedFiles = files.filter(f => f.size > maxFileSize);
    if (oversizedFiles.length > 0) {
      setMessage({
        type: 'error',
        text: `Some files exceed 50MB limit: ${oversizedFiles.map(f => f.name).join(', ')}`
      });
      return;
    }

    // Process files asynchronously to avoid blocking
    await new Promise(resolve => setTimeout(resolve, 0));

    if (type === 'audio') {
      setAudioFiles(prev => [...prev, ...files]);
    } else if (type === 'slide') {
      setSlideFiles(prev => [...prev, ...files]);
    } else if (type === 'photo') {
      setPhotoFiles(prev => [...prev, ...files]);
    }

    // Clear any previous errors
    setMessage(null);

    // Reset the input so the same file can be selected again
    e.target.value = '';
  };

  const removeFile = (index: number, type: 'audio' | 'slide' | 'photo') => {
    if (type === 'audio') {
      setAudioFiles(prev => prev.filter((_, i) => i !== index));
    } else if (type === 'slide') {
      setSlideFiles(prev => prev.filter((_, i) => i !== index));
    } else if (type === 'photo') {
      // Object URLs will be cleaned up automatically by useEffect
      setPhotoFiles(prev => prev.filter((_, i) => i !== index));
    }
    setMessage(null);
  };

  // Create memoized preview URLs for photos to avoid recreating on every render
  const photoPreviewUrls = useMemo(() => {
    return photoFiles.map(file => {
      try {
        return URL.createObjectURL(file);
      } catch (e) {
        console.error('Error creating object URL:', e);
        return '';
      }
    });
  }, [photoFiles]);

  // Clean up object URLs when they change or component unmounts
  useEffect(() => {
    return () => {
      // Cleanup function runs when photoPreviewUrls changes or component unmounts
      photoPreviewUrls.forEach(url => {
        if (url) {
          try {
            URL.revokeObjectURL(url);
          } catch (e) {
            // Ignore errors
          }
        }
      });
    };
  }, [photoPreviewUrls]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!instructorName.trim()) {
      setMessage({ type: 'error', text: 'Please enter or select an instructor name' });
      return;
    }

    if (audioFiles.length === 0 && slideFiles.length === 0 && photoFiles.length === 0) {
      setMessage({ type: 'error', text: 'Please upload at least one file' });
      return;
    }

    setIsUploading(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append('instructorName', instructorName.trim());
      formData.append('week', week.toString());
      formData.append('lectureNumber', lectureNumber.toString());

      // Add files with prefixes to identify type
      audioFiles.forEach((file, index) => {
        formData.append(`audio-${index}`, file);
      });

      slideFiles.forEach((file, index) => {
        formData.append(`slide-${index}`, file);
      });

      photoFiles.forEach((file, index) => {
        formData.append(`photo-${index}`, file);
      });

      const response = await fetch('/api/materials', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'Materials uploaded successfully!' });

        // Reset form
        setAudioFiles([]);
        setSlideFiles([]);
        setPhotoFiles([]);

        // Reload data
        await loadInstructors();
        await loadMaterials();

        // Clear message after 3 seconds
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to upload materials' });
      }
    } catch (error) {
      console.error('Error uploading materials:', error);
      setMessage({ type: 'error', text: 'An error occurred while uploading materials' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this material?')) {
      return;
    }

    try {
      const response = await fetch(`/api/materials?id=${id}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'Material deleted successfully' });
        await loadMaterials();
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to delete material' });
      }
    } catch (error) {
      console.error('Error deleting material:', error);
      setMessage({ type: 'error', text: 'An error occurred while deleting material' });
    }
  };

  // Group materials by instructor
  const groupedMaterials = materials.reduce((acc, material) => {
    if (!acc[material.instructorName]) {
      acc[material.instructorName] = [];
    }
    acc[material.instructorName].push(material);
    return acc;
  }, {} as Record<string, LectureMaterial[]>);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <div className="max-w-6xl mx-auto mb-6">
          <a
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900 font-medium hover:bg-white rounded-lg transition-all"
          >
            <span className="material-symbols-outlined">arrow_back</span>
            Back to Main Page
          </a>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Materials Management</h1>
          <p className="text-gray-600">Upload and manage course materials for instructors</p>
          <p className="text-sm text-purple-600 mt-2">
            Instructors: Upload weekly lecture materials here. Students can then select and use them on the main page.
          </p>
        </div>

        {/* Message */}
        {message && (
          <div className={`max-w-2xl mx-auto mb-6 p-4 rounded-lg ${
            message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {message.text}
          </div>
        )}

        {/* Upload Form */}
        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined">upload</span>
            Upload Materials
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Instructor Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <span className="material-symbols-outlined text-sm inline mr-1">person</span>
                Instructor Name
              </label>

              <div className="flex gap-4 mb-2">
                <button
                  type="button"
                  onClick={() => setUseExistingInstructor(true)}
                  className={`px-4 py-2 rounded-lg ${
                    useExistingInstructor
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  Select Existing
                </button>
                <button
                  type="button"
                  onClick={() => setUseExistingInstructor(false)}
                  className={`px-4 py-2 rounded-lg ${
                    !useExistingInstructor
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  Enter New
                </button>
              </div>

              {useExistingInstructor ? (
                <select
                  value={instructorName}
                  onChange={(e) => setInstructorName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select an instructor...</option>
                  {existingInstructors.map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={instructorName}
                  onChange={(e) => setInstructorName(e.target.value)}
                  placeholder="e.g., Asst. Prof. Yiğit Erçayhan"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              )}
            </div>

            {/* Week and Lecture Number */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <span className="material-symbols-outlined text-sm inline mr-1">calendar_today</span>
                  Week Number
                </label>
                <input
                  type="number"
                  value={week}
                  onChange={(e) => setWeek(parseInt(e.target.value) || 1)}
                  min="1"
                  max="52"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <span className="material-symbols-outlined text-sm inline mr-1">book</span>
                  Lecture Number
                </label>
                <input
                  type="number"
                  value={lectureNumber}
                  onChange={(e) => setLectureNumber(parseInt(e.target.value) || 1)}
                  min="1"
                  max="10"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            {/* Audio Files */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <span className="material-symbols-outlined text-sm inline mr-1">videocam</span>
                Audio/Video Files (Optional)
              </label>
              <input
                type="file"
                accept="audio/*,video/*"
                multiple
                onChange={(e) => handleFileChange(e, 'audio')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {audioFiles.length > 0 && (
                <div className="mt-2 space-y-2">
                  {audioFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                      <span className="text-sm">{file.name} ({formatFileSize(file.size)})</span>
                      <button
                        type="button"
                        onClick={() => removeFile(index, 'audio')}
                        className="text-red-500 hover:text-red-700"
                      >
                        <span className="material-symbols-outlined text-sm">delete</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Slide Files */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <span className="material-symbols-outlined text-sm inline mr-1">description</span>
                Slide Files (Optional)
              </label>
              <input
                type="file"
                accept=".pdf,.pptx,.ppt"
                multiple
                onChange={(e) => handleFileChange(e, 'slide')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {slideFiles.length > 0 && (
                <div className="mt-2 space-y-2">
                  {slideFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                      <span className="text-sm">{file.name} ({formatFileSize(file.size)})</span>
                      <button
                        type="button"
                        onClick={() => removeFile(index, 'slide')}
                        className="text-red-500 hover:text-red-700"
                      >
                        <span className="material-symbols-outlined text-sm">delete</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Photo Files */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <span className="material-symbols-outlined text-sm inline mr-1">image</span>
                Photo Files (Optional)
              </label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => handleFileChange(e, 'photo')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {photoFiles.length > 0 && (
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {photoFiles.map((file, index) => (
                    <div key={index} className="relative">
                      {photoPreviewUrls[index] ? (
                        <img
                          src={photoPreviewUrls[index]}
                          alt={file.name}
                          className="w-full h-24 object-cover rounded"
                        />
                      ) : (
                        <div className="w-full h-24 bg-gray-200 rounded flex items-center justify-center">
                          <span className="material-symbols-outlined text-gray-400">image</span>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => removeFile(index, 'photo')}
                        className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full hover:bg-red-700"
                      >
                        <span className="material-symbols-outlined text-xs">delete</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isUploading}
              className={`w-full py-3 px-6 rounded-lg text-white font-medium ${
                isUploading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700'
              }`}
            >
              {isUploading ? 'Uploading...' : 'Upload Materials'}
            </button>
          </form>
        </div>

        {/* Existing Materials */}
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Existing Materials</h2>

          {Object.keys(groupedMaterials).length === 0 ? (
            <div className="bg-white rounded-lg p-8 text-center text-gray-500">
              No materials uploaded yet
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedMaterials).map(([instructorName, instructorMaterials]) => (
                <div key={instructorName} className="bg-white rounded-lg shadow-lg p-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined">person</span>
                    {instructorName}
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {instructorMaterials
                      .sort((a, b) => a.week - b.week || a.lectureNumber - b.lectureNumber)
                      .map((material) => (
                      <div
                        key={material.id}
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <p className="font-semibold text-gray-800">
                              Week {material.week}, Lecture {material.lectureNumber}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(material.uploadedAt).toLocaleDateString()}
                            </p>
                          </div>
                          <button
                            onClick={() => handleDelete(material.id)}
                            className="text-red-500 hover:text-red-700 transition-colors"
                          >
                            <span className="material-symbols-outlined text-sm">delete</span>
                          </button>
                        </div>

                        <div className="space-y-1 text-sm">
                          {material.audioFiles.length > 0 && (
                            <p className="text-gray-600">
                              <span className="material-symbols-outlined text-xs inline mr-1">videocam</span>
                              {material.audioFiles.length} audio/video file(s)
                            </p>
                          )}
                          {material.slideFiles.length > 0 && (
                            <p className="text-gray-600">
                              <span className="material-symbols-outlined text-xs inline mr-1">description</span>
                              {material.slideFiles.length} slide file(s)
                            </p>
                          )}
                          {material.photoFiles.length > 0 && (
                            <p className="text-gray-600">
                              <span className="material-symbols-outlined text-xs inline mr-1">image</span>
                              {material.photoFiles.length} photo(s)
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

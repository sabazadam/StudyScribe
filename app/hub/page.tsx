'use client';

import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import MaterialModal from '@/components/ui/MaterialModal';
import HubToolbar, { ViewMode, SortOption } from '@/components/ui/HubToolbar';
import { SavedStudyMaterial } from '@/lib/studyMaterialStorage';

export default function StudyHub() {
  const [materials, setMaterials] = useState<SavedStudyMaterial[]>([]);
  const [filteredMaterials, setFilteredMaterials] = useState<SavedStudyMaterial[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal state
  const [selectedMaterial, setSelectedMaterial] = useState<SavedStudyMaterial | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Load materials on mount
  useEffect(() => {
    loadMaterials();
  }, []);

  // Apply filters when materials, search, filter, or sort changes
  useEffect(() => {
    applyFilters();
  }, [materials, searchQuery, filter, sortBy]);

  const loadMaterials = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/study-materials');
      const data = await response.json();

      if (data.success) {
        setMaterials(data.materials);
      } else {
        setError(data.error || 'Failed to load materials');
      }
    } catch (err) {
      console.error('Error loading materials:', err);
      setError('An error occurred while loading materials');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...materials];

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(m =>
        m.title.toLowerCase().includes(query) ||
        m.content.toLowerCase().includes(query) ||
        m.transcript.toLowerCase().includes(query)
      );
    }

    // Apply type filter
    if (filter !== 'all') {
      filtered = filtered.filter(m => m.materialType === filter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'a-z':
          return a.title.localeCompare(b.title);
        case 'z-a':
          return b.title.localeCompare(a.title);
        case 'type':
          return a.materialType.localeCompare(b.materialType);
        default:
          return 0;
      }
    });

    setFilteredMaterials(filtered);
  };

  const handleOpenMaterial = (material: SavedStudyMaterial) => {
    setSelectedMaterial(material);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedMaterial(null);
  };

  const handleDeleteMaterial = async (id: string) => {
    // Remove from local state
    setMaterials(prev => prev.filter(m => m.id !== id));
    // Reload to ensure consistency
    await loadMaterials();
  };

  const getTypeIcon = (type: string) => {
    const icons = {
      'exam': 'school',
      'summary': 'summarize',
      'quiz': 'quiz',
      'mock-exam': 'assignment',
      'explain': 'psychology',
      'custom': 'edit_note'
    };
    return icons[type as keyof typeof icons] || 'description';
  };

  const getTypeColor = (type: string) => {
    const colors = {
      'exam': 'text-primary',
      'summary': 'text-cerulean',
      'quiz': 'text-success',
      'mock-exam': 'text-warning',
      'explain': 'text-accent',
      'custom': 'text-info'
    };
    return colors[type as keyof typeof colors] || 'text-text-muted';
  };

  const getTypeBadgeClass = (type: string) => {
    const classes = {
      'exam': 'badge-primary',
      'summary': 'bg-cerulean/10 text-cerulean border-cerulean/20',
      'quiz': 'badge-success',
      'mock-exam': 'badge-warning',
      'explain': 'badge-accent',
      'custom': 'bg-info/10 text-info border-info/20'
    };
    return `badge ${classes[type as keyof typeof classes] || 'bg-text-muted/10 text-text-muted border-text-muted/20'}`;
  };

  return (
    <Layout>
      <div className="p-4 sm:p-6 lg:p-8 bg-mesh-academic dark:bg-mesh-academic-dark min-h-screen">
        <div className="container mx-auto max-w-7xl">
          {/* Header */}
          <div className="mb-8 animate-slide-up">
            <h2 className="text-4xl font-heading font-bold text-gradient-academic mb-2">My Study Hub</h2>
            <p className="text-text-muted dark:text-text-dark-muted">Manage and organize your AI-generated study materials</p>
          </div>

          {/* Toolbar */}
          <HubToolbar
            viewMode={viewMode}
            sortBy={sortBy}
            searchQuery={searchQuery}
            filter={filter}
            onViewModeChange={setViewMode}
            onSortChange={setSortBy}
            onSearchChange={setSearchQuery}
            onFilterChange={setFilter}
            totalCount={materials.length}
            filteredCount={filteredMaterials.length}
          />

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">Loading your materials...</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <p className="text-red-800">{error}</p>
              <button
                onClick={loadMaterials}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Documents Grid */}
          {!loading && !error && filteredMaterials.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {filteredMaterials.map((material) => (
                <div
                  key={material.id}
                  onClick={() => handleOpenMaterial(material)}
                  className="group relative rounded-xl overflow-hidden bg-white shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:scale-105 border border-gray-100"
                >
                  {/* Document Preview */}
                  <div className="aspect-square w-full bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center">
                    <span className={`material-symbols-outlined text-6xl ${getTypeColor(material.materialType)} opacity-50`}>
                      {getTypeIcon(material.materialType)}
                    </span>
                  </div>

                  {/* Document Info */}
                  <div className="p-4">
                    <h3 className="font-bold text-sm line-clamp-2 mb-1" title={material.title}>
                      {material.title}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(material.createdAt).toLocaleDateString()}
                    </p>
                    <div className="mt-2 flex items-center gap-1">
                      {material.sources.hasAudio && (
                        <span className="material-symbols-outlined text-xs text-blue-500" title="Audio">
                          videocam
                        </span>
                      )}
                      {material.sources.hasSlides && (
                        <span className="material-symbols-outlined text-xs text-purple-500" title="Slides">
                          description
                        </span>
                      )}
                      {material.sources.hasPhotos && (
                        <span className="material-symbols-outlined text-xs text-green-500" title="Photos">
                          image
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="text-white text-center">
                      <span className="material-symbols-outlined text-4xl mb-2">visibility</span>
                      <p className="text-sm font-medium">Click to view</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && filteredMaterials.length === 0 && (
            <div className="text-center py-20">
              <div className="w-full max-w-sm mx-auto mb-6">
                <div className="aspect-video bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg flex items-center justify-center">
                  <span className="material-symbols-outlined text-6xl text-primary/50">
                    folder_open
                  </span>
                </div>
              </div>
              <h3 className="text-xl font-bold mb-2">No materials found</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                {searchQuery || filter !== 'all'
                  ? 'Try adjusting your search or filter'
                  : 'Start creating study materials to see them here.'}
              </p>
              {!searchQuery && filter === 'all' && (
                <a
                  href="/"
                  className="inline-block bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold text-sm px-6 py-3 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all shadow-md hover:shadow-lg"
                >
                  Create Your First Material
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Material Modal */}
      <MaterialModal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        material={selectedMaterial}
        onDelete={handleDeleteMaterial}
      />
    </Layout>
  );
}

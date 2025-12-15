'use client';

import { useState, useEffect, useRef } from 'react';
import { Layout } from '@/components/layout/Layout';
import MaterialModal from '@/components/ui/MaterialModal';
import GenerateQuizModal from '@/components/quiz/GenerateQuizModal';
import HubToolbar, { ViewMode, SortOption } from '@/components/ui/HubToolbar';
import FolderList from '@/components/folders/FolderList';
import FolderBreadcrumb from '@/components/folders/FolderBreadcrumb';
import { SavedStudyMaterial, SavedMaterialListItem, materialsToSavedMaterials, listItemsToSavedListItems } from '@/lib/types/materialCompat';
import { Material, Folder, MaterialListItem } from '@/lib/types/firestore';
import { authenticatedFetch } from '@/lib/api/client';
import { useAuth } from '@/components/contexts/AuthContext';
import { DndContext, DragEndEvent, useDraggable, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { getCached, setCache, clearCache, CACHE_KEYS } from '@/lib/utils/cache';


// Draggable Material Card Component (uses lightweight list item)
function DraggableMaterialCard({
  material,
  onOpenMaterial,
  getTypeIcon,
  getTypeColor,
  folderName,
  folderEmoji,
}: {
  material: SavedMaterialListItem;
  onOpenMaterial: (material: SavedMaterialListItem) => void;
  getTypeIcon: (type: string) => string;
  getTypeColor: (type: string) => string;
  folderName?: string;
  folderEmoji?: string;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: material.id,
    data: { material },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
    cursor: isDragging ? 'grabbing' : 'grab',
    zIndex: isDragging ? 1000 : 'auto',
  };

  // Progress tracking simplified - would need separate API call for detailed progress
  const hasProgress = false; // Could be enhanced with a progress API later
  const progressPercent = 0;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative group/card"
    >
      <button
        onClick={() => onOpenMaterial(material)}
        className="relative w-full h-[320px]
          bg-white dark:bg-card-dark
          border border-gray-200/80 dark:border-gray-700/50
          rounded-2xl p-5
          hover:border-cerulean/50 dark:hover:border-cerulean/40
          hover:shadow-xl hover:shadow-cerulean/10
          transition-all duration-300 ease-out
          transform hover:-translate-y-1 hover:scale-[1.02]
          text-left overflow-hidden 
          focus:outline-none focus:ring-2 focus:ring-cerulean/50 focus:ring-offset-2
          flex flex-col"
      >
        {/* Subtle gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-cerulean/[0.02] via-transparent to-gold/[0.02]
          opacity-0 group-hover/card:opacity-100 transition-opacity duration-500 rounded-2xl pointer-events-none" />

        {/* Folder Badge (if in folder) */}
        {folderName && (
          <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm flex items-center gap-1.5 text-xs shadow-sm border border-gray-100 dark:border-gray-700 z-10">
            <span className="text-sm">{folderEmoji || '📁'}</span>
            <span className="text-gray-600 dark:text-gray-300 font-medium max-w-[70px] truncate">{folderName}</span>
          </div>
        )}

        {/* Drag Handle */}
        <div
          {...listeners}
          {...attributes}
          className={`absolute top-3 right-3 transition-all duration-200 cursor-move p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg z-10 ${isDragging ? 'opacity-100 bg-gray-100' : 'opacity-0 group-hover/card:opacity-60 hover:!opacity-100'
            }`}
          onClick={(e) => e.stopPropagation()}
        >
          <span className="material-symbols-outlined text-gray-400 text-base">drag_indicator</span>
        </div>

        {/* Dragging overlay */}
        {isDragging && (
          <div className="absolute inset-0 bg-cerulean/10 border-2 border-cerulean border-dashed rounded-2xl pointer-events-none z-20" />
        )}

        {/* Card content */}
        <div className="flex flex-col flex-1 min-h-0 relative z-[1]">
          {/* Icon Badge - Enhanced with gradient */}
          <div className="flex items-center justify-center w-11 h-11 mb-4 flex-shrink-0
            bg-gradient-to-br from-cerulean/10 to-cerulean/5 
            rounded-xl border border-cerulean/15
            group-hover/card:from-cerulean/15 group-hover/card:to-cerulean/10
            group-hover/card:border-cerulean/25 group-hover/card:shadow-sm
            transition-all duration-300">
            <span className={`material-symbols-outlined text-xl ${getTypeColor(material.materialType)}`}>
              {getTypeIcon(material.materialType)}
            </span>
          </div>

          {/* Title */}
          <h3 className="font-heading font-bold text-base text-oxford-blue dark:text-text-dark mb-1.5 line-clamp-2 flex-shrink-0 min-h-[48px] group-hover/card:text-cerulean transition-colors duration-200">
            {material.title || `${material.materialType} Material`}
          </h3>

          {/* Date */}
          <p className="text-xs text-text-muted dark:text-text-dark-muted mb-3 flex-shrink-0 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-xs opacity-60">calendar_today</span>
            {new Date(material.createdAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            })}
          </p>

          {/* Source Badges */}
          <div className="flex gap-1.5 flex-wrap mb-3 flex-shrink-0">
            {material.sources.hasAudio && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-cerulean/8 text-cerulean text-[10px] font-medium border border-cerulean/10">
                <span className="material-symbols-outlined text-[10px]">mic</span>
                Audio
              </span>
            )}
            {material.sources.hasSlides && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-cerulean/8 text-cerulean text-[10px] font-medium border border-cerulean/10">
                <span className="material-symbols-outlined text-[10px]">slideshow</span>
                Slides
              </span>
            )}
            {material.sources.hasPhotos && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-cerulean/8 text-cerulean text-[10px] font-medium border border-cerulean/10">
                <span className="material-symbols-outlined text-[10px]">image</span>
                Photos
              </span>
            )}
          </div>

          {/* Spacer */}
          <div className="flex-1 min-h-0"></div>

          {/* Progress Section - Enhanced */}
          <div className="flex-shrink-0 pt-3 border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-gray-500 dark:text-gray-400 font-medium">Study Progress</span>
              {hasProgress ? (
                <span className="font-semibold text-success flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">check_circle</span>
                  Complete
                </span>
              ) : (
                <span className="text-gray-400 dark:text-gray-500 text-[10px] font-medium px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded-full">
                  Not started
                </span>
              )}
            </div>

            {/* Progress Bar */}
            <div className="relative w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ease-out ${hasProgress
                  ? 'bg-gradient-to-r from-success to-success-light shadow-[0_0_8px_rgba(16,185,129,0.4)]'
                  : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                style={{ width: `${progressPercent}%` }}
              />
              {/* Shimmer effect for complete */}
              {hasProgress && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
              )}
            </div>

            {/* CTA for 0% progress */}
            {!hasProgress && (
              <p className="mt-2 text-[10px] text-cerulean font-medium opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 flex items-center gap-1">
                <span className="material-symbols-outlined text-xs">play_arrow</span>
                Click to start studying
              </p>
            )}
          </div>
        </div>
      </button>
    </div>
  );
}

export default function StudyHub() {
  const { user, loading: authLoading } = useAuth();
  // Use lightweight list items for display (no content/sources)
  const [materials, setMaterials] = useState<SavedMaterialListItem[]>([]);
  const [filteredMaterials, setFilteredMaterials] = useState<SavedMaterialListItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Pagination state
  const [nextCursor, setNextCursor] = useState<string | undefined>(undefined);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState<number | undefined>(undefined);
  const [loadingMore, setLoadingMore] = useState(false);
  const PAGE_SIZE = 8;

  // Modal state - selectedMaterial is full material loaded on demand
  const [selectedMaterial, setSelectedMaterial] = useState<SavedStudyMaterial | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [quizMaterialId, setQuizMaterialId] = useState<string>('');

  // Folder state
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [currentFolder, setCurrentFolder] = useState<Folder | null>(null);
  const [sidebarMode, setSidebarMode] = useState<'expanded' | 'collapsed'>('expanded');
  const [folders, setFolders] = useState<Folder[]>([]);

  // Load materials on mount - wait for auth to be ready
  useEffect(() => {
    // Only load materials when auth is ready and user is logged in
    if (!authLoading && user) {
      loadMaterials();
      loadFolders();
    } else if (!authLoading && !user) {
      // Auth finished loading but no user - show error
      setLoading(false);
      setError('Please sign in to view your materials');
    }
  }, [authLoading, user]);

  // Apply filters when materials, search, filter, sort, or folder changes
  useEffect(() => {
    applyFilters();
  }, [materials, searchQuery, filter, sortBy, selectedFolderId]);

  // Fetch current folder details when selectedFolderId changes
  useEffect(() => {
    if (selectedFolderId) {
      fetchCurrentFolder();
    } else {
      setCurrentFolder(null);
    }
  }, [selectedFolderId]);

  const loadFolders = async () => {
    try {
      const response = await authenticatedFetch('/api/folders');
      if (response.ok) {
        const data = await response.json();
        setFolders(data.folders || []);
      }
    } catch (err) {
      console.error('Error loading folders:', err);
    }
  };

  const loadMaterials = async (reset: boolean = true, forceRefresh: boolean = false) => {
    // Check cache first (only on initial load, not pagination)
    if (reset && !forceRefresh && user) {
      const cached = getCached<{
        materials: SavedMaterialListItem[];
        nextCursor?: string;
        hasMore: boolean;
        totalCount?: number;
      }>(CACHE_KEYS.MATERIALS_LIST, user.uid);

      if (cached) {
        setMaterials(cached.data.materials);
        setNextCursor(cached.data.nextCursor);
        setHasMore(cached.data.hasMore);
        setTotalCount(cached.data.totalCount);
        setLoading(false);

        // If cache is stale, refresh in background
        if (cached.isStale) {
          console.log('[Hub] Cache is stale, refreshing in background...');
          loadMaterials(true, true); // Force refresh
        }
        return;
      }
    }

    if (reset) {
      setLoading(true);
      setNextCursor(undefined);
    }
    setError('');

    try {
      // Use new lightweight list API with pagination
      const url = `/api/study-materials?mode=list&limit=${PAGE_SIZE}${!reset && nextCursor ? `&cursor=${nextCursor}` : ''}`;
      const response = await authenticatedFetch(url);

      if (!response.ok) {
        if (response.status === 401) {
          setError('Please sign in to view your materials');
          return;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        // Convert lightweight MaterialListItem to SavedMaterialListItem format
        const listItems: MaterialListItem[] = data.data.materials;
        const savedListItems = listItemsToSavedListItems(listItems);

        if (reset) {
          setMaterials(savedListItems);

          // Update cache with fresh data
          if (user) {
            setCache(CACHE_KEYS.MATERIALS_LIST, {
              materials: savedListItems,
              nextCursor: data.data.pagination?.nextCursor,
              hasMore: data.data.pagination?.hasMore || false,
              totalCount: data.data.pagination?.totalCount,
            }, user.uid);
          }
        } else {
          setMaterials(prev => [...prev, ...savedListItems]);
        }

        // Update pagination state
        setNextCursor(data.data.pagination?.nextCursor);
        setHasMore(data.data.pagination?.hasMore || false);
        if (data.data.pagination?.totalCount !== undefined) {
          setTotalCount(data.data.pagination.totalCount);
        }
      } else {
        setError(data.error || 'Failed to load materials');
      }
    } catch (err) {
      console.error('Error loading materials:', err);
      setError('An error occurred while loading materials');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Load more materials (pagination)
  const loadMoreMaterials = async () => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    await loadMaterials(false);
  };

  // Fetch full material details when opening modal
  const fetchFullMaterial = async (materialId: string): Promise<SavedStudyMaterial | null> => {
    try {
      const response = await authenticatedFetch(`/api/study-materials?id=${materialId}`);
      if (!response.ok) return null;

      const data = await response.json();
      if (data.success && data.data.material) {
        const fullMaterial: Material = data.data.material;
        const savedMaterials = materialsToSavedMaterials([fullMaterial]);
        return savedMaterials[0];
      }
      return null;
    } catch (err) {
      console.error('Error fetching full material:', err);
      return null;
    }
  };

  const getFolderInfo = (folderId: string | undefined | null) => {
    if (!folderId) return { name: undefined, emoji: undefined };
    const folder = folders.find(f => f.id === folderId);
    return { name: folder?.name, emoji: folder?.emoji };
  };

  const fetchCurrentFolder = async () => {
    if (!selectedFolderId) return;

    try {
      const response = await authenticatedFetch(`/api/folders/${selectedFolderId}`);

      if (response.ok) {
        const data = await response.json();
        setCurrentFolder(data.folder || null);
      } else {
        console.error('Failed to fetch folder details');
        setCurrentFolder(null);
      }
    } catch (err) {
      console.error('Error fetching folder:', err);
      setCurrentFolder(null);
    }
  };

  const applyFilters = () => {
    let filtered = [...materials];

    // Apply folder filter
    if (selectedFolderId) {
      filtered = filtered.filter(m => m.folderId === selectedFolderId);
    }

    // Apply search (title only - for deep content search, use API)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(m =>
        m.title.toLowerCase().includes(query)
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

  // Open material - fetch full details on demand
  const handleOpenMaterial = async (material: SavedMaterialListItem) => {
    // Show modal with loading state
    setModalOpen(true);
    setSelectedMaterial(null); // Clear previous

    // Fetch full material details
    const fullMaterial = await fetchFullMaterial(material.id);
    if (fullMaterial) {
      setSelectedMaterial(fullMaterial);
    } else {
      // Handle error - close modal
      setModalOpen(false);
      setError('Failed to load material details');
    }
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedMaterial(null);
  };

  const handleDeleteMaterial = async (id: string) => {
    // Remove from local state
    setMaterials(prev => prev.filter(m => m.id !== id));
    // Clear cache and reload to ensure consistency
    clearCache(CACHE_KEYS.MATERIALS_LIST);
    await loadMaterials(true, true);
  };

  const handleGenerateQuiz = (materialId: string) => {
    setQuizMaterialId(materialId);
    setShowQuizModal(true);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    // Validate drop target exists
    if (!over) {
      console.log('[Drag] Dropped outside valid target');
      return;
    }

    const materialId = active.id as string;
    const targetFolderId = over.id === 'all-materials' ? null : over.id as string;

    // Find the material being moved
    const material = materials.find(m => m.id === materialId);
    if (!material) {
      console.error('[Drag] Material not found:', materialId);
      return;
    }

    // Skip if already in target folder
    if (material.folderId === targetFolderId) {
      console.log('[Drag] Material already in target folder');
      return;
    }

    console.log('[Drag] Moving material:', {
      materialId,
      from: material.folderId || 'root',
      to: targetFolderId || 'root'
    });

    try {
      const response = await authenticatedFetch(`/api/materials/${materialId}/move`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ folderId: targetFolderId }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('[Drag] Move failed:', error);
        alert(`Failed to move material: ${error.error || 'Unknown error'}`);
        return;
      }

      console.log('[Drag] Move successful, updating local state...');

      // Update local state instead of full reload
      setMaterials(prev => prev.map(m =>
        m.id === materialId ? { ...m, folderId: targetFolderId } : m
      ));

      // Update folder counts locally instead of reloading
      const oldFolderId = material.folderId;
      setFolders(prev => prev.map(folder => {
        if (folder.id === oldFolderId) {
          // Remove from old folder
          return { ...folder, materialCount: Math.max(0, (folder.materialCount || 0) - 1) };
        }
        if (folder.id === targetFolderId) {
          // Add to new folder
          return { ...folder, materialCount: (folder.materialCount || 0) + 1 };
        }
        return folder;
      }));

    } catch (error) {
      console.error('[Drag] Error moving material:', error);
      alert('Network error: Failed to move material. Please try again.');
    }
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

  // Configure drag sensors to prevent accidental drags
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement before drag starts
      },
    })
  );

  return (
    <Layout>
      <DndContext onDragEnd={handleDragEnd} sensors={sensors}>
        {/* Add pt-20 to account for fixed navbar */}
        <div className="flex bg-mesh-academic dark:bg-mesh-academic-dark min-h-screen pt-20">
          {/* Sidebar - Collapsible */}
          <aside
            className={`${sidebarMode === 'expanded' ? 'w-56' : 'w-14'
              } transition-all duration-300 ease-in-out border-r border-gray-100 dark:border-gray-800 bg-white dark:bg-card-dark flex-shrink-0 flex flex-col`}
          >
            {/* Toggle Button - At top */}
            <div className="p-2 border-b border-gray-100 dark:border-gray-800">
              <button
                onClick={() => setSidebarMode(sidebarMode === 'expanded' ? 'collapsed' : 'expanded')}
                className={`w-full flex items-center ${sidebarMode === 'expanded' ? 'justify-between' : 'justify-center'} gap-2 px-2 py-2 rounded-lg
                  hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400
                  transition-all duration-200`}
                title={sidebarMode === 'expanded' ? 'Collapse sidebar' : 'Expand sidebar'}
              >
                {sidebarMode === 'expanded' && (
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Folders</span>
                )}
                <span className={`material-symbols-outlined text-lg transition-transform duration-300 ${sidebarMode === 'collapsed' ? 'rotate-180' : ''}`}>
                  chevron_left
                </span>
              </button>
            </div>

            {/* Sidebar Content */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden">
              {sidebarMode === 'expanded' ? (
                /* EXPANDED MODE - Full sidebar */
                <div className="p-4 pt-2">
                  <FolderList
                    selectedFolderId={selectedFolderId}
                    onSelectFolder={setSelectedFolderId}
                    onFoldersChange={loadMaterials}
                    onFoldersLoaded={setFolders}
                  />
                </div>
              ) : (
                /* COLLAPSED MODE - Icon strip */
                <div className="py-2 px-2 space-y-1">
                  {/* All Materials icon */}
                  <button
                    onClick={() => setSelectedFolderId(null)}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all group relative
                      ${!selectedFolderId
                        ? 'bg-cerulean/10 text-cerulean'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'
                      }`}
                    title="All Materials"
                  >
                    <span className="material-symbols-outlined text-xl">folder_open</span>
                    {/* Tooltip */}
                    <span className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                      All Materials
                    </span>
                  </button>

                  {/* Divider */}
                  <div className="border-t border-gray-100 dark:border-gray-800 my-2"></div>

                  {/* New Folder icon */}
                  <button
                    onClick={() => setSidebarMode('expanded')}
                    className="w-10 h-10 rounded-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 transition-all group relative"
                    title="New Folder"
                  >
                    <span className="material-symbols-outlined text-xl">add</span>
                    <span className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                      New Folder
                    </span>
                  </button>

                  {/* Folder icons */}
                  {(folders || []).map((folder) => (
                    <button
                      key={folder.id}
                      onClick={() => setSelectedFolderId(folder.id)}
                      className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all group relative
                        ${selectedFolderId === folder.id
                          ? 'bg-cerulean/10 text-cerulean'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'
                        }`}
                      title={folder.name}
                    >
                      <span className="text-lg">{folder.emoji || '📁'}</span>
                      {/* Tooltip */}
                      <span className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                        {folder.name}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1 overflow-x-hidden">
            <div className="p-4 sm:p-6 lg:p-8">
              <div className="container mx-auto max-w-7xl">
                {/* Header */}
                <div className="mb-8 animate-slide-up">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex-1">
                      <h2 className="text-4xl font-heading font-bold text-gradient-academic mb-2">My Study Hub</h2>
                      <p className="text-text-muted dark:text-text-dark-muted">Manage and organize your AI-generated study materials</p>
                    </div>
                  </div>

                  {/* Breadcrumb */}
                  <div className="mt-4">
                    <FolderBreadcrumb
                      currentFolder={currentFolder}
                      onNavigate={setSelectedFolderId}
                    />
                  </div>
                </div>

                {/* Stats Dashboard - Enhanced */}
                {!loading && !error && materials.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    {/* Total Materials */}
                    <div className="group relative p-5 bg-white dark:bg-card-dark rounded-xl border border-gray-100 dark:border-gray-800 hover:border-cerulean/30 transition-all duration-300 hover:shadow-lg hover:shadow-cerulean/5 overflow-hidden">
                      {/* Subtle gradient accent */}
                      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-green-500/10 to-transparent rounded-bl-full opacity-60 group-hover:opacity-100 transition-opacity" />

                      <div className="flex items-center gap-4 relative">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                          <span className="material-symbols-outlined text-green-600 dark:text-green-400 text-xl">check_circle</span>
                        </div>
                        <div>
                          <div className="text-3xl font-bold text-oxford-blue dark:text-text-dark tracking-tight">
                            {materials.length}
                          </div>
                          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                            Total Materials
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* In Folder / All Items */}
                    <div className="group relative p-5 bg-white dark:bg-card-dark rounded-xl border border-gray-100 dark:border-gray-800 hover:border-cerulean/30 transition-all duration-300 hover:shadow-lg hover:shadow-cerulean/5 overflow-hidden">
                      {/* Subtle gradient accent */}
                      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-amber-500/10 to-transparent rounded-bl-full opacity-60 group-hover:opacity-100 transition-opacity" />

                      <div className="flex items-center gap-4 relative">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                          <span className="material-symbols-outlined text-amber-600 dark:text-amber-400 text-xl">folder</span>
                        </div>
                        <div>
                          <div className="text-3xl font-bold text-oxford-blue dark:text-text-dark tracking-tight">
                            {selectedFolderId ? filteredMaterials.length : materials.length}
                          </div>
                          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                            {selectedFolderId ? 'In Folder' : 'All Items'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Study Types */}
                    <div className="group relative p-5 bg-white dark:bg-card-dark rounded-xl border border-gray-100 dark:border-gray-800 hover:border-cerulean/30 transition-all duration-300 hover:shadow-lg hover:shadow-cerulean/5 overflow-hidden">
                      {/* Subtle gradient accent */}
                      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-purple-500/10 to-transparent rounded-bl-full opacity-60 group-hover:opacity-100 transition-opacity" />

                      <div className="flex items-center gap-4 relative">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                          <span className="material-symbols-outlined text-purple-600 dark:text-purple-400 text-xl">category</span>
                        </div>
                        <div>
                          <div className="text-3xl font-bold text-oxford-blue dark:text-text-dark tracking-tight">
                            {new Set(materials.map(m => m.materialType)).size}
                          </div>
                          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                            Study Types
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

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
                      onClick={() => loadMaterials(true)}
                      className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Try Again
                    </button>
                  </div>
                )}

                {/* Materials Grid */}
                {!loading && !error && filteredMaterials.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {filteredMaterials.map((material) => {
                      const { name, emoji } = getFolderInfo(material.folderId);
                      return (
                        <DraggableMaterialCard
                          key={material.id}
                          material={material}
                          onOpenMaterial={handleOpenMaterial}
                          getTypeIcon={getTypeIcon}
                          getTypeColor={getTypeColor}
                          folderName={name}
                          folderEmoji={emoji}
                        />
                      );
                    })}
                  </div>
                )}

                {/* Load More Button */}
                {!loading && !error && hasMore && (
                  <div className="flex flex-col items-center mt-8 gap-3">
                    <button
                      onClick={loadMoreMaterials}
                      disabled={loadingMore}
                      className="px-6 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 
                                 rounded-xl font-medium text-gray-700 dark:text-gray-300
                                 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-cerulean
                                 transition-all shadow-sm hover:shadow-md
                                 disabled:opacity-50 disabled:cursor-not-allowed
                                 flex items-center gap-2"
                    >
                      {loadingMore ? (
                        <>
                          <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-cerulean"></span>
                          Loading...
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-lg">expand_more</span>
                          Load More Materials
                        </>
                      )}
                    </button>
                    {totalCount !== undefined && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Showing {filteredMaterials.length} of {totalCount} materials
                      </p>
                    )}
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
          </div>
        </div>
      </DndContext>

      {/* Material Modal */}
      <MaterialModal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        material={selectedMaterial}
        onDelete={handleDeleteMaterial}
        onGenerateQuiz={handleGenerateQuiz}
      />

      {/* Generate Quiz Modal */}
      <GenerateQuizModal
        isOpen={showQuizModal}
        onClose={() => setShowQuizModal(false)}
        preselectedMaterialId={quizMaterialId}
      />
    </Layout>
  );
}

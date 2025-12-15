'use client';

/**
 * SIMPLIFIED FOLDER LIST COMPONENT
 * ==============================================================================
 * Clean, minimal folder list with drag-and-drop support
 * Replaces complex FolderTree for better UX
 * ==============================================================================
 */

import { useState, useEffect } from 'react';
import { Folder } from '@/lib/types/firestore';
import { useDroppable } from '@dnd-kit/core';
import * as Sentry from '@sentry/nextjs';
import { useAuth } from '@/components/contexts/AuthContext';

interface FolderListProps {
  onSelectFolder: (folderId: string | null) => void;
  selectedFolderId: string | null;
  onFoldersChange?: () => void;
  onFoldersLoaded?: (folders: Folder[]) => void;
}

function FolderItem({
  folder,
  isSelected,
  onSelect,
  onDelete
}: {
  folder: Folder;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: folder.id,
    data: { folder }
  });

  return (
    <div
      ref={setNodeRef}
      onClick={onSelect}
      className={`
        group px-3 py-2 rounded-lg cursor-pointer transition-all
        flex items-center justify-between
        ${isSelected
          ? 'bg-cerulean/10 text-cerulean border border-cerulean/20'
          : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-oxford-blue dark:text-text-dark'
        }
        ${isOver ? 'bg-blue-100 dark:bg-blue-900/30 border-2 border-blue-500 scale-105' : ''}
      `}
    >
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <span className="text-xl flex-shrink-0">{folder.emoji || '📁'}</span>
        <span className="font-medium text-sm truncate">{folder.name}</span>
        {(folder.materialCount || 0) > 0 && (
          <span className="text-xs px-1.5 py-0.5 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 flex-shrink-0">
            {folder.materialCount}
          </span>
        )}
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-opacity"
        title="Delete folder"
      >
        <span className="material-symbols-outlined text-sm text-red-600 dark:text-red-400">delete</span>
      </button>
    </div>
  );
}

export default function FolderList({
  onSelectFolder,
  selectedFolderId,
  onFoldersChange,
  onFoldersLoaded,
}: FolderListProps) {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderEmoji, setNewFolderEmoji] = useState('📁');
  const { getIdToken } = useAuth();

  // Make "All Materials" droppable
  const { isOver: isAllMaterialsOver, setNodeRef: setAllMaterialsRef } = useDroppable({
    id: 'all-materials',
    data: { folder: null }
  });

  // Fetch folders
  const fetchFolders = async () => {
    return Sentry.startSpan(
      {
        op: 'ui.load',
        name: 'Fetch Folders List',
      },
      async () => {
        try {
          setLoading(true);
          const token = await getIdToken();
          if (!token) {
            throw new Error('Authentication required');
          }

          const response = await fetch('/api/folders', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (!response.ok) {
            throw new Error('Failed to fetch folders');
          }

          const data = await response.json();
          // Show only top-level folders (no parent)
          const topLevel = (data.folders || []).filter((f: Folder) => !f.parentFolderId);
          setFolders(topLevel);
          // Notify parent component about loaded folders
          onFoldersLoaded?.(topLevel);
        } catch (error) {
          console.error('[FolderList] Error fetching folders:', error);
          Sentry.captureException(error, {
            tags: { component: 'FolderList' },
          });
        } finally {
          setLoading(false);
        }
      }
    );
  };

  useEffect(() => {
    fetchFolders();
  }, [getIdToken]);

  // Create new folder
  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newFolderName.trim()) return;

    return Sentry.startSpan(
      {
        op: 'ui.action',
        name: 'Create Folder',
      },
      async (span) => {
        span.setAttribute('folder_name', newFolderName);

        try {
          setCreatingFolder(true);
          const token = await getIdToken();
          if (!token) {
            throw new Error('Authentication required');
          }

          const response = await fetch('/api/folders', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              name: newFolderName,
              emoji: newFolderEmoji,
              parentFolderId: null // INTENTIONAL: Flat folder structure - no nesting allowed
            })
          });

          if (!response.ok) {
            throw new Error('Failed to create folder');
          }

          // Reset form
          setNewFolderName('');
          setNewFolderEmoji('📁');
          setCreatingFolder(false);

          // Refresh folders
          await fetchFolders();
          onFoldersChange?.();
        } catch (error) {
          console.error('[FolderList] Error creating folder:', error);
          Sentry.captureException(error, {
            tags: { component: 'FolderList' },
          });
          setCreatingFolder(false);
        }
      }
    );
  };

  // Delete folder
  const handleDeleteFolder = async (folderId: string) => {
    if (!confirm('Delete this folder? Materials inside will not be deleted.')) return;

    return Sentry.startSpan(
      {
        op: 'ui.action',
        name: 'Delete Folder',
      },
      async () => {
        try {
          const token = await getIdToken();
          if (!token) {
            throw new Error('Authentication required');
          }

          const response = await fetch(`/api/folders/${folderId}?deleteMaterials=false`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (!response.ok) {
            throw new Error('Failed to delete folder');
          }

          // If deleted folder was selected, clear selection
          if (selectedFolderId === folderId) {
            onSelectFolder(null);
          }

          // Refresh folders
          await fetchFolders();
          onFoldersChange?.();
        } catch (error) {
          console.error('[FolderList] Error deleting folder:', error);
          Sentry.captureException(error, {
            tags: { component: 'FolderList' },
          });
        }
      }
    );
  };

  // Common emoji options
  const emojiOptions = ['📁', '📚', '🎓', '📖', '💼', '🗂️', '📝', '🎯'];

  return (
    <div className="space-y-2">
      {/* "All Materials" button */}
      <div
        ref={setAllMaterialsRef}
        onClick={() => onSelectFolder(null)}
        className={`
          px-3 py-2 rounded-lg cursor-pointer transition-all
          flex items-center gap-2
          ${!selectedFolderId
            ? 'bg-cerulean/10 text-cerulean border border-cerulean/20'
            : 'hover:bg-gray-50 dark:hover:bg-gray-800/50 text-oxford-blue dark:text-text-dark'
          }
          ${isAllMaterialsOver ? 'bg-blue-100 dark:bg-blue-900/30 border-2 border-blue-500 scale-105' : ''}
        `}
      >
        <span className="material-symbols-outlined text-lg">folder_open</span>
        <span className="font-medium text-sm">All Materials</span>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-100 dark:border-gray-800"></div>

      {/* "New Folder" button */}
      {!creatingFolder ? (
        <button
          onClick={() => setCreatingFolder(true)}
          className="w-full px-3 py-2 rounded-lg border border-dashed border-gray-200 dark:border-gray-700
                     hover:border-cerulean hover:bg-cerulean/5 transition-all
                     flex items-center justify-center gap-1.5 text-gray-500 dark:text-gray-400 hover:text-cerulean text-sm"
        >
          <span className="material-symbols-outlined text-base">add</span>
          <span className="font-medium">New Folder</span>
        </button>
      ) : (
        <form onSubmit={handleCreateFolder} className="space-y-2 p-2 bg-gray-50 dark:bg-gray-900/50 rounded-lg overflow-hidden">
          {/* Emoji + Input Row - with overflow control */}
          <div className="flex items-center gap-1.5 min-w-0">
            {/* Emoji picker - compact */}
            <select
              value={newFolderEmoji}
              onChange={(e) => setNewFolderEmoji(e.target.value)}
              className="w-10 h-8 text-base bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded 
                         focus:outline-none focus:ring-1 focus:ring-cerulean cursor-pointer flex-shrink-0 text-center"
            >
              {emojiOptions.map(emoji => (
                <option key={emoji} value={emoji}>{emoji}</option>
              ))}
            </select>

            {/* Folder name input - allow shrinking */}
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Folder name..."
              autoFocus
              className="flex-1 min-w-0 px-2 py-1.5 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700
                         rounded focus:outline-none focus:ring-1 focus:ring-cerulean"
            />
          </div>

          {/* Action buttons - stacked on narrow containers */}
          <div className="flex gap-1.5">
            <button
              type="submit"
              disabled={!newFolderName.trim()}
              className="flex-1 px-2 py-1.5 text-xs font-medium bg-cerulean text-white rounded hover:bg-cerulean/90
                         disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Create
            </button>
            <button
              type="button"
              onClick={() => {
                setCreatingFolder(false);
                setNewFolderName('');
                setNewFolderEmoji('📁');
              }}
              className="flex-1 px-2 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 
                         bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700
                         rounded transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Loading state */}
      {loading && (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-cerulean mx-auto"></div>
        </div>
      )}

      {/* Folder list */}
      {!loading && (
        <div className="space-y-1">
          {folders.map((folder) => (
            <FolderItem
              key={folder.id}
              folder={folder}
              isSelected={selectedFolderId === folder.id}
              onSelect={() => onSelectFolder(folder.id)}
              onDelete={() => handleDeleteFolder(folder.id)}
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && folders.length === 0 && !creatingFolder && (
        <div className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">
          No folders yet. Create one!
        </div>
      )}
    </div>
  );
}

'use client';

/**
 * FOLDER TREE COMPONENT
 * ==============================================================================
 * Hierarchical display of folders with create/rename/delete actions
 * Used in Study Hub for folder organization
 * ==============================================================================
 */

import { useState, useEffect } from 'react';
import { Folder } from '@/lib/types/firestore';
import * as Sentry from '@sentry/nextjs';
import { useAuth } from '@/components/contexts/AuthContext';

interface FolderTreeProps {
  onSelectFolder: (folderId: string | null) => void;
  selectedFolderId: string | null;
  onFoldersChange?: () => void;
}

export default function FolderTree({
  onSelectFolder,
  selectedFolderId,
  onFoldersChange,
}: FolderTreeProps) {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [parentFolderId, setParentFolderId] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const { getIdToken } = useAuth();

  // Fetch folders
  const fetchFolders = async () => {
    return Sentry.startSpan(
      {
        op: 'ui.load',
        name: 'Fetch Folders Tree',
      },
      async () => {
        try {
          setLoading(true);

          // Get authentication token
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
          setFolders(data.folders || []);
        } catch (error) {
          console.error('[FolderTree] Error fetching folders:', error);
          Sentry.captureException(error, {
            tags: { component: 'FolderTree' },
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
        span.setAttribute('has_parent', !!parentFolderId);

        try {
          setCreatingFolder(true);

          // Get authentication token
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
              name: newFolderName.trim(),
              parentFolderId,
            }),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to create folder');
          }

          // Reset form
          setNewFolderName('');
          setParentFolderId(null);

          // Refresh folders
          await fetchFolders();
          onFoldersChange?.();
        } catch (error) {
          console.error('[FolderTree] Error creating folder:', error);
          Sentry.captureException(error, {
            tags: { component: 'FolderTree', action: 'create' },
          });
          alert(error instanceof Error ? error.message : 'Failed to create folder');
        } finally {
          setCreatingFolder(false);
        }
      }
    );
  };

  // Delete folder
  const handleDeleteFolder = async (folderId: string, folderName: string) => {
    const confirmMessage = `Delete "${folderName}" and all its contents? This action cannot be undone.`;

    if (!confirm(confirmMessage)) return;

    return Sentry.startSpan(
      {
        op: 'ui.action',
        name: 'Delete Folder',
      },
      async (span) => {
        span.setAttribute('folder_id', folderId);

        try {
          // Get authentication token
          const token = await getIdToken();
          if (!token) {
            throw new Error('Authentication required');
          }

          const response = await fetch(`/api/folders/${folderId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to delete folder');
          }

          // Refresh folders
          await fetchFolders();
          onFoldersChange?.();

          // Deselect if this was the selected folder
          if (selectedFolderId === folderId) {
            onSelectFolder(null);
          }
        } catch (error) {
          console.error('[FolderTree] Error deleting folder:', error);
          Sentry.captureException(error, {
            tags: { component: 'FolderTree', action: 'delete' },
          });
          alert(error instanceof Error ? error.message : 'Failed to delete folder');
        }
      }
    );
  };

  // Toggle folder expansion
  const toggleFolder = (folderId: string) => {
    setExpandedFolders((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  };

  // Build hierarchical structure
  const buildTree = (parentId: string | null = null): Folder[] => {
    return folders
      .filter((f) => f.parentFolderId === parentId)
      .sort((a, b) => a.name.localeCompare(b.name));
  };

  // Render folder item recursively
  const renderFolder = (folder: Folder, level: number = 0) => {
    const hasChildren = folders.some((f) => f.parentFolderId === folder.id);
    const isExpanded = expandedFolders.has(folder.id);
    const isSelected = selectedFolderId === folder.id;
    const children = buildTree(folder.id);

    return (
      <div key={folder.id} className="select-none">
        <div
          className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all duration-200
            ${isSelected ? 'bg-primary/10 text-primary' : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-oxford-blue dark:text-text-dark'}
          `}
          style={{ paddingLeft: `${level * 20 + 12}px` }}
        >
          {/* Expand/Collapse Icon */}
          {hasChildren && (
            <button
              onClick={() => toggleFolder(folder.id)}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors duration-200"
            >
              <span className="material-symbols-outlined text-sm">
                {isExpanded ? 'expand_more' : 'chevron_right'}
              </span>
            </button>
          )}
          {!hasChildren && <div className="w-6" />}

          {/* Folder Icon & Name */}
          <div
            onClick={() => onSelectFolder(folder.id)}
            className="flex items-center gap-2 flex-1"
          >
            <span className="text-xl">{folder.emoji || '📁'}</span>
            <span className="font-medium text-sm">{folder.name}</span>
            {folder.materialCount !== undefined && folder.materialCount > 0 && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                ({folder.materialCount})
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => handleDeleteFolder(folder.id, folder.name)}
              className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors duration-200"
              title="Delete folder"
            >
              <span className="material-symbols-outlined text-sm text-red-600 dark:text-red-400">
                delete
              </span>
            </button>
          </div>
        </div>

        {/* Render children */}
        {isExpanded && hasChildren && (
          <div>
            {children.map((child) => renderFolder(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const rootFolders = buildTree(null);

  if (loading) {
    return (
      <div className="space-y-2">
        <div className="animate-pulse space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* All Materials button */}
      <div
        onClick={() => onSelectFolder(null)}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all duration-200
          ${selectedFolderId === null ? 'bg-primary/10 text-primary' : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-oxford-blue dark:text-text-dark'}
        `}
      >
        <span className="material-symbols-outlined text-xl">folder_open</span>
        <span className="font-medium text-sm">All Materials</span>
      </div>

      {/* Folder tree */}
      <div className="space-y-1 group">
        {rootFolders.map((folder) => renderFolder(folder))}
      </div>

      {/* Create folder form */}
      <form onSubmit={handleCreateFolder} className="border-t border-border-light dark:border-border-dark pt-4 mt-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder="New folder name..."
            disabled={creatingFolder}
            className="flex-1 px-3 py-2 text-sm rounded-lg border border-border-light dark:border-border-dark
              bg-white dark:bg-card-dark text-oxford-blue dark:text-text-dark
              focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
              disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            type="submit"
            disabled={creatingFolder || !newFolderName.trim()}
            className="px-4 py-2 bg-primary hover:bg-primary-dark text-white text-sm font-semibold rounded-lg
              transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
              flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            Create
          </button>
        </div>
      </form>

      {folders.length === 0 && (
        <p className="text-center text-sm text-gray-500 dark:text-gray-400 py-4">
          No folders yet. Create one to organize your materials.
        </p>
      )}
    </div>
  );
}

'use client';

/**
 * FOLDER PICKER COMPONENT
 * ==============================================================================
 * Dropdown selector for choosing a folder when creating/moving materials
 * Displays hierarchical folder structure with indentation
 * ==============================================================================
 */

import { useState, useEffect } from 'react';
import { Folder } from '@/lib/types/firestore';
import * as Sentry from '@sentry/nextjs';
import { useAuth } from '@/contexts/AuthContext';

interface FolderPickerProps {
  selectedFolderId: string | null;
  onSelectFolder: (folderId: string | null) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
}

export default function FolderPicker({
  selectedFolderId,
  onSelectFolder,
  label = 'Save to Folder',
  placeholder = 'Select a folder (optional)',
  disabled = false,
}: FolderPickerProps) {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { getIdToken } = useAuth();

  // Fetch user's folders
  useEffect(() => {
    const fetchFolders = async () => {
      return Sentry.startSpan(
        {
          op: 'ui.load',
          name: 'Fetch Folders for Picker',
        },
        async () => {
          try {
            setLoading(true);
            setError(null);

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
          } catch (err) {
            console.error('[FolderPicker] Error fetching folders:', err);
            Sentry.captureException(err, {
              tags: { component: 'FolderPicker' },
            });
            setError('Failed to load folders');
          } finally {
            setLoading(false);
          }
        }
      );
    };

    fetchFolders();
  }, [getIdToken]);

  // Build hierarchical folder tree
  const buildFolderTree = (folders: Folder[]): Folder[] => {
    // Sort by path length (parents before children) and then by name
    return folders.sort((a, b) => {
      if (a.path.length !== b.path.length) {
        return a.path.length - b.path.length;
      }
      return a.name.localeCompare(b.name);
    });
  };

  const sortedFolders = buildFolderTree(folders);

  // Calculate indentation level based on path length
  const getIndentLevel = (folder: Folder): number => {
    return folder.path.length - 1;
  };

  if (loading) {
    return (
      <div className="space-y-2">
        {label && (
          <label className="block text-sm font-medium text-oxford-blue dark:text-text-dark">
            {label}
          </label>
        )}
        <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-10 rounded-lg"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-2">
        {label && (
          <label className="block text-sm font-medium text-oxford-blue dark:text-text-dark">
            {label}
          </label>
        )}
        <div className="text-sm text-red-600 dark:text-red-400">{error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-oxford-blue dark:text-text-dark">
          {label}
        </label>
      )}

      <select
        value={selectedFolderId || ''}
        onChange={(e) => onSelectFolder(e.target.value || null)}
        disabled={disabled}
        className="w-full px-4 py-2.5 rounded-lg border border-border-light dark:border-border-dark
          bg-white dark:bg-card-dark text-oxford-blue dark:text-text-dark
          focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-all duration-200"
      >
        <option value="">{placeholder}</option>

        {sortedFolders.map((folder) => {
          const indent = getIndentLevel(folder);
          const prefix = '\u00A0\u00A0'.repeat(indent * 2); // Two spaces per level
          const emoji = folder.emoji ? `${folder.emoji} ` : '📁 ';

          return (
            <option key={folder.id} value={folder.id}>
              {prefix}{emoji}{folder.name}
            </option>
          );
        })}
      </select>

      {folders.length === 0 && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          No folders yet. Materials will be saved to your main hub.
        </p>
      )}

      {selectedFolderId && (
        <button
          type="button"
          onClick={() => onSelectFolder(null)}
          className="text-xs text-primary hover:text-primary-dark transition-colors duration-200"
        >
          Clear selection
        </button>
      )}
    </div>
  );
}

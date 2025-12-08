'use client';

/**
 * FOLDER BREADCRUMB COMPONENT
 * ==============================================================================
 * Displays folder navigation path (e.g., CS101 > Week 3 > Midterm Prep)
 * Allows users to navigate up the folder hierarchy
 * ==============================================================================
 */

import { Folder } from '@/lib/types/firestore';

interface FolderBreadcrumbProps {
  currentFolder: Folder | null;
  onNavigate: (folderId: string | null) => void;
}

export default function FolderBreadcrumb({
  currentFolder,
  onNavigate,
}: FolderBreadcrumbProps) {
  if (!currentFolder) {
    return (
      <div className="flex items-center gap-2 text-sm text-oxford-blue dark:text-text-dark">
        <span className="material-symbols-outlined text-lg">folder_open</span>
        <span className="font-medium">All Materials</span>
      </div>
    );
  }

  // Build breadcrumb path from folder.path
  const breadcrumbs = currentFolder.path.map((name, index) => ({
    name,
    // For navigation, we'd need to look up the actual folder IDs
    // For now, we'll just display the path
    isLast: index === currentFolder.path.length - 1,
  }));

  return (
    <div className="flex items-center gap-2 text-sm overflow-x-auto">
      {/* Home/All Materials */}
      <button
        onClick={() => onNavigate(null)}
        className="flex items-center gap-1 text-oxford-blue dark:text-text-dark hover:text-primary dark:hover:text-primary transition-colors duration-200 flex-shrink-0"
      >
        <span className="material-symbols-outlined text-lg">home</span>
        <span className="hidden sm:inline">All Materials</span>
      </button>

      {/* Breadcrumb path */}
      {breadcrumbs.map((crumb, index) => (
        <div key={index} className="flex items-center gap-2 flex-shrink-0">
          <span className="material-symbols-outlined text-sm text-gray-400">
            chevron_right
          </span>

          {crumb.isLast ? (
            <span className="font-medium text-primary flex items-center gap-1">
              <span className="text-lg">{currentFolder.emoji || '📁'}</span>
              <span>{crumb.name}</span>
            </span>
          ) : (
            <button
              onClick={() => {
                // Navigate to this level
                // This would require parent folder ID tracking
                // For now, clicking non-last items goes to root
                onNavigate(null);
              }}
              className="text-oxford-blue dark:text-text-dark hover:text-primary dark:hover:text-primary transition-colors duration-200"
            >
              {crumb.name}
            </button>
          )}
        </div>
      ))}

      {/* Material count */}
      {currentFolder.materialCount !== undefined && currentFolder.materialCount > 0 && (
        <span className="ml-auto text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
          {currentFolder.materialCount} {currentFolder.materialCount === 1 ? 'item' : 'items'}
        </span>
      )}
    </div>
  );
}

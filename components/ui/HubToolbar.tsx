'use client';

import React from 'react';

export type ViewMode = 'grid' | 'list' | 'timeline';
export type SortOption = 'recent' | 'oldest' | 'a-z' | 'z-a' | 'type';

interface HubToolbarProps {
  viewMode: ViewMode;
  sortBy: SortOption;
  searchQuery: string;
  filter: string;
  onViewModeChange: (mode: ViewMode) => void;
  onSortChange: (sort: SortOption) => void;
  onSearchChange: (query: string) => void;
  onFilterChange: (filter: string) => void;
  totalCount: number;
  filteredCount: number;
}

export default function HubToolbar({
  viewMode,
  sortBy,
  searchQuery,
  filter,
  onViewModeChange,
  onSortChange,
  onSearchChange,
  onFilterChange,
  totalCount,
  filteredCount
}: HubToolbarProps) {
  return (
    <div className="space-y-4 mb-8">
      {/* Top Row: Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-grow">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-text-muted dark:text-text-dark-muted">
            search
          </span>
          <input
            type="search"
            placeholder="Search your materials..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-lg bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark focus:ring-2 focus:ring-primary focus:border-primary placeholder-text-muted text-oxford-blue dark:text-text-dark transition-all"
          />
        </div>

        {/* Filter Dropdown */}
        <div className="relative min-w-[180px]">
          <select
            value={filter}
            onChange={(e) => onFilterChange(e.target.value)}
            className="appearance-none bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark rounded-lg pl-4 pr-12 py-3 text-sm font-semibold focus:ring-2 focus:ring-primary focus:border-primary w-full text-oxford-blue dark:text-text-dark transition-all"
          >
            <option value="all">All Types</option>
            <option value="exam">Exam Prep</option>
            <option value="summary">Summaries</option>
            <option value="quiz">Quizzes</option>
            <option value="mock-exam">Mock Exams</option>
            <option value="explain">Explanations</option>
            <option value="custom">Custom</option>
          </select>
          <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-text-muted dark:text-text-dark-muted pointer-events-none">
            expand_more
          </span>
        </div>

        {/* Sort Dropdown */}
        <div className="relative min-w-[180px]">
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as SortOption)}
            className="appearance-none bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark rounded-lg pl-4 pr-12 py-3 text-sm font-semibold focus:ring-2 focus:ring-primary focus:border-primary w-full text-oxford-blue dark:text-text-dark transition-all"
          >
            <option value="recent">Most Recent</option>
            <option value="oldest">Oldest First</option>
            <option value="a-z">A to Z</option>
            <option value="z-a">Z to A</option>
            <option value="type">By Type</option>
          </select>
          <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-text-muted dark:text-text-dark-muted pointer-events-none">
            sort
          </span>
        </div>
      </div>

      {/* Bottom Row: View Mode Toggle and Count */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-text-muted dark:text-text-dark-muted">
            Showing <span className="font-semibold text-oxford-blue dark:text-text-dark">{filteredCount}</span> of <span className="font-semibold">{totalCount}</span>
          </span>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 p-1 bg-background dark:bg-card-dark rounded-lg border border-border-light dark:border-border-dark">
          <button
            onClick={() => onViewModeChange('grid')}
            className={`p-2 rounded-md transition-all ${
              viewMode === 'grid'
                ? 'bg-primary text-white shadow-sm'
                : 'text-text-muted dark:text-text-dark-muted hover:text-primary dark:hover:text-cerulean hover:bg-primary/5'
            }`}
            title="Grid View"
          >
            <span className="material-symbols-outlined text-xl">grid_view</span>
          </button>
          <button
            onClick={() => onViewModeChange('list')}
            className={`p-2 rounded-md transition-all ${
              viewMode === 'list'
                ? 'bg-primary text-white shadow-sm'
                : 'text-text-muted dark:text-text-dark-muted hover:text-primary dark:hover:text-cerulean hover:bg-primary/5'
            }`}
            title="List View"
          >
            <span className="material-symbols-outlined text-xl">view_list</span>
          </button>
          <button
            onClick={() => onViewModeChange('timeline')}
            className={`p-2 rounded-md transition-all ${
              viewMode === 'timeline'
                ? 'bg-primary text-white shadow-sm'
                : 'text-text-muted dark:text-text-dark-muted hover:text-primary dark:hover:text-cerulean hover:bg-primary/5'
            }`}
            title="Timeline View"
          >
            <span className="material-symbols-outlined text-xl">timeline</span>
          </button>
        </div>
      </div>
    </div>
  );
}

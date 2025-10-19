'use client'

import { useState } from 'react'
import { Layout } from '@/components/layout/Layout'
import { Card } from '@/components/ui/Card'

export default function StudyHub() {
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState('all')

  const documents = [
    {
      id: 1,
      title: 'Lecture Summary - History 101',
      date: 'Jan 15, 2024',
      type: 'lecture',
      icon: 'description',
    },
    {
      id: 2,
      title: 'Lecture Summary - Biology 202',
      date: 'Feb 20, 2024',
      type: 'lecture',
      icon: 'description',
    },
    {
      id: 3,
      title: 'Enhanced Images - Chemistry 303',
      date: 'Mar 25, 2024',
      type: 'image',
      icon: 'image',
    },
    {
      id: 4,
      title: 'Lecture Summary - Physics 404',
      date: 'Apr 30, 2024',
      type: 'lecture',
      icon: 'description',
    },
    {
      id: 5,
      title: 'Lecture Summary - Math 505',
      date: 'May 05, 2024',
      type: 'lecture',
      icon: 'description',
    },
    {
      id: 6,
      title: 'Enhanced Images - English 606',
      date: 'Jun 10, 2024',
      type: 'image',
      icon: 'image',
    },
  ]

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = filter === 'all' || doc.type === filter
    return matchesSearch && matchesFilter
  })

  return (
    <Layout>
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="container mx-auto max-w-7xl">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <h2 className="text-3xl font-bold">My Study Hub</h2>

            <div className="flex items-center gap-4">
              {/* Search */}
              <div className="relative flex-grow max-w-sm">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  search
                </span>
                <input
                  type="search"
                  placeholder="Search your materials..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-gray-100 dark:bg-gray-800 border-transparent focus:ring-2 focus:ring-primary focus:border-transparent placeholder-gray-400"
                />
              </div>

              {/* Filter */}
              <div className="relative">
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="appearance-none bg-gray-100 dark:bg-gray-800 border-transparent rounded-lg pl-4 pr-10 py-2.5 text-sm font-medium focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="all">All</option>
                  <option value="lecture">Lecture Summaries</option>
                  <option value="image">Enhanced Images</option>
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                  expand_more
                </span>
              </div>
            </div>
          </div>

          {/* Documents Grid */}
          {filteredDocuments.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {filteredDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className="group relative rounded-xl overflow-hidden bg-card-light dark:bg-card-dark shadow-sm hover:shadow-lg transition-shadow duration-300"
                >
                  {/* Document Preview */}
                  <div className="aspect-square w-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                    <span className="material-symbols-outlined text-5xl text-primary/50">
                      {doc.icon}
                    </span>
                  </div>

                  {/* Document Info */}
                  <div className="p-4">
                    <h3 className="font-bold text-sm truncate">{doc.title}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {doc.date}
                    </p>
                  </div>

                  {/* Hover Actions */}
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="flex items-center gap-4">
                      <button
                        className="h-10 w-10 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors"
                        title="Download"
                      >
                        <span className="material-symbols-outlined">download</span>
                      </button>
                      <button
                        className="h-10 w-10 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors"
                        title="Rename"
                      >
                        <span className="material-symbols-outlined">
                          drive_file_rename_outline
                        </span>
                      </button>
                      <button
                        className="h-10 w-10 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors"
                        title="Delete"
                      >
                        <span className="material-symbols-outlined">delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Empty State */
            <div className="text-center py-20">
              <div className="w-full max-w-sm mx-auto mb-6">
                <div className="aspect-video bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg flex items-center justify-center">
                  <span className="material-symbols-outlined text-6xl text-primary/50">
                    folder_open
                  </span>
                </div>
              </div>
              <h3 className="text-xl font-bold mb-2">No documents found</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                {searchQuery
                  ? 'Try adjusting your search or filter'
                  : 'Start processing your lectures to see them here.'}
              </p>
              {!searchQuery && (
                <a
                  href="/process-lecture"
                  className="inline-block bg-primary text-white font-bold text-sm px-6 py-3 rounded-lg hover:bg-primary-dark transition-colors"
                >
                  Process Your First Lecture
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}

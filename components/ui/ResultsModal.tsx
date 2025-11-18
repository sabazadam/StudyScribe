'use client';

import React, { useEffect, useState } from 'react';
import ChatMessage from './ChatMessage';
import FeedbackWidget from './FeedbackWidget';

interface ResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: string;
  onSave: () => void;
  onDownload: () => void;
  onCreateAnother: () => void;
  onStartOver: () => void;
  onShowTranscript?: () => void;
  isSaved: boolean;
  isSaving: boolean;
  hasTranscript?: boolean;
  materialType: string;
}

export default function ResultsModal({
  isOpen,
  onClose,
  content,
  onSave,
  onDownload,
  onCreateAnother,
  onStartOver,
  onShowTranscript,
  isSaved,
  isSaving,
  hasTranscript = false,
  materialType
}: ResultsModalProps) {
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Handle scroll to show/hide scroll-to-top button
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    setShowScrollTop(target.scrollTop > 300);
  };

  const scrollToTop = () => {
    const contentArea = document.getElementById('modal-content-area');
    if (contentArea) {
      contentArea.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-midnight-blue/80 backdrop-blur-md"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Container */}
      <div className="relative w-full h-full max-w-7xl mx-auto flex flex-col animate-scale-in">
        {/* Header */}
        <div className="glass dark:glass-dark border-b border-border-light dark:border-border-dark px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-2xl text-primary">auto_awesome</span>
            <h2 className="text-2xl font-heading font-bold text-oxford-blue dark:text-text-dark">
              Your Study Materials
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-oxford-blue/10 dark:hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <span className="material-symbols-outlined text-2xl text-oxford-blue dark:text-text-dark">close</span>
          </button>
        </div>

        {/* Content Area - Scrollable */}
        <div
          id="modal-content-area"
          className="flex-1 overflow-y-auto bg-background-light dark:bg-background-dark modal-content custom-scrollbar"
          onScroll={handleScroll}
        >
          <div className="max-w-4xl mx-auto px-6 py-8">
            {/* Content */}
            <div className="prose-optimized">
              <ChatMessage
                content={content}
                role="assistant"
                timestamp={new Date().toISOString()}
              />
            </div>

            {/* Feedback Widget */}
            <div className="mt-12 pt-8 border-t border-border-light dark:border-border-dark">
              <FeedbackWidget
                materialType={materialType}
                onFeedbackSubmit={(rating, comment) => {
                  console.log('Feedback:', { rating, comment, materialType });
                }}
              />
            </div>
          </div>
        </div>

        {/* Floating Action Buttons */}
        <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-50">
          {/* Scroll to Top - Only show when scrolled */}
          {showScrollTop && (
            <button
              onClick={scrollToTop}
              className="w-14 h-14 rounded-full bg-oxford-blue/90 hover:bg-oxford-blue text-white shadow-lg hover:shadow-xl transition-all flex items-center justify-center tooltip-trigger animate-slide-up"
              aria-label="Scroll to top"
            >
              <span className="material-symbols-outlined text-2xl">arrow_upward</span>
              <span className="tooltip bg-oxford-blue text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap -left-24 top-1/2 -translate-y-1/2">
                Scroll to Top
              </span>
            </button>
          )}

          {/* Save to Hub */}
          <button
            onClick={onSave}
            disabled={isSaving || isSaved}
            className={`w-14 h-14 rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center tooltip-trigger btn-magnetic ${
              isSaved
                ? 'bg-success hover:bg-success text-white cursor-default animate-success-pop'
                : 'bg-primary hover:bg-primary-dark text-white'
            }`}
            aria-label={isSaved ? 'Saved to hub' : 'Save to hub'}
          >
            <span className="material-symbols-outlined text-2xl">
              {isSaved ? 'check_circle' : isSaving ? 'hourglass_empty' : 'bookmark'}
            </span>
            <span className="tooltip bg-oxford-blue text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap -left-28 top-1/2 -translate-y-1/2">
              {isSaved ? 'Saved!' : 'Save to Hub'}
            </span>
          </button>

          {/* Download */}
          <button
            onClick={onDownload}
            className="w-14 h-14 rounded-full bg-cerulean hover:bg-cerulean/90 text-white shadow-lg hover:shadow-xl transition-all flex items-center justify-center tooltip-trigger btn-magnetic"
            aria-label="Download material"
          >
            <span className="material-symbols-outlined text-2xl">download</span>
            <span className="tooltip bg-oxford-blue text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap -left-24 top-1/2 -translate-y-1/2">
              Download
            </span>
          </button>

          {/* Transcript - Only show if available */}
          {hasTranscript && onShowTranscript && (
            <button
              onClick={onShowTranscript}
              className="w-14 h-14 rounded-full bg-accent hover:bg-accent-dark text-white shadow-lg hover:shadow-xl transition-all flex items-center justify-center tooltip-trigger btn-magnetic"
              aria-label="View transcript"
            >
              <span className="material-symbols-outlined text-2xl">article</span>
              <span className="tooltip bg-oxford-blue text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap -left-24 top-1/2 -translate-y-1/2">
                Transcript
              </span>
            </button>
          )}

          {/* Create Another */}
          <button
            onClick={onCreateAnother}
            className="w-14 h-14 rounded-full bg-gold hover:bg-gold/90 text-midnight-blue shadow-lg hover:shadow-xl transition-all flex items-center justify-center tooltip-trigger btn-magnetic"
            aria-label="Create another material"
          >
            <span className="material-symbols-outlined text-2xl">add_circle</span>
            <span className="tooltip bg-oxford-blue text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap -left-32 top-1/2 -translate-y-1/2">
              Create Another
            </span>
          </button>

          {/* Start Over */}
          <button
            onClick={onStartOver}
            className="w-14 h-14 rounded-full bg-oxford-blue/70 hover:bg-oxford-blue text-white shadow-lg hover:shadow-xl transition-all flex items-center justify-center tooltip-trigger btn-magnetic"
            aria-label="Start over"
          >
            <span className="material-symbols-outlined text-2xl">refresh</span>
            <span className="tooltip bg-oxford-blue text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap -left-24 top-1/2 -translate-y-1/2">
              Start Over
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

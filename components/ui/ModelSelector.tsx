'use client';

import { useState } from 'react';
import { AVAILABLE_MODELS, type ModelTier } from '@/lib/models';

interface ModelSelectorProps {
  selectedTier: ModelTier;
  onSelectTier: (tier: ModelTier) => void;
}

export default function ModelSelector({ selectedTier, onSelectTier }: ModelSelectorProps) {
  const tiers: ModelTier[] = ['default', 'better', 'star'];

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
        AI Model Quality
      </label>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {tiers.map((tier) => {
          const model = AVAILABLE_MODELS[tier];
          const isSelected = selectedTier === tier;

          return (
            <button
              key={tier}
              type="button"
              onClick={() => onSelectTier(tier)}
              className={`
                relative p-4 rounded-lg border-2 transition-all
                ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800'
                }
              `}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{model.icon}</span>
                <div className="flex-1 text-left">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {model.name}
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {model.description}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-2 font-mono">
                    {model.id}
                  </p>
                </div>
              </div>
              {isSelected && (
                <div className="absolute top-2 right-2">
                  <svg
                    className="w-5 h-5 text-blue-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}
            </button>
          );
        })}
      </div>
      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
        Higher quality models provide better results but may take slightly longer to process.
      </div>
    </div>
  );
}

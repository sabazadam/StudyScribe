'use client'

/**
 * Image Proposals Component
 *
 * Displays image proposals from Gemini's visual markers
 * Allows users to approve, regenerate, or skip each proposed image
 * Implements the hybrid approval workflow
 */

import { useState } from 'react'
import { ImageProposal, ProposalStatus, MaterialImageData } from '@/lib/types/image'

interface ImageProposalsProps {
  imageData: MaterialImageData
  onProposalUpdate?: (proposalId: string, status: ProposalStatus) => void
  onGenerateImage?: (proposalId: string) => void
}

export default function ImageProposals({
  imageData,
  onProposalUpdate,
  onGenerateImage,
}: ImageProposalsProps) {
  const [expandedProposals, setExpandedProposals] = useState<Set<string>>(new Set())

  if (!imageData || imageData.proposals.length === 0) {
    return null
  }

  const toggleExpand = (proposalId: string) => {
    const newExpanded = new Set(expandedProposals)
    if (newExpanded.has(proposalId)) {
      newExpanded.delete(proposalId)
    } else {
      newExpanded.add(proposalId)
    }
    setExpandedProposals(newExpanded)
  }

  const handleApprove = (proposalId: string) => {
    onProposalUpdate?.(proposalId, 'approved')
    onGenerateImage?.(proposalId)
  }

  const handleRegenerate = (proposalId: string) => {
    onProposalUpdate?.(proposalId, 'regenerating')
    onGenerateImage?.(proposalId)
  }

  const handleSkip = (proposalId: string) => {
    onProposalUpdate?.(proposalId, 'rejected')
  }

  const getStatusBadge = (status: ProposalStatus) => {
    const badges = {
      pending: { text: 'Pending', class: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
      approved: { text: 'Approved', class: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
      generated: { text: 'Generated', class: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
      regenerating: { text: 'Regenerating', class: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' },
      rejected: { text: 'Skipped', class: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400' },
      failed: { text: 'Failed', class: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
    }

    const badge = badges[status]
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${badge.class}`}>
        {badge.text}
      </span>
    )
  }

  const getImageTypeIcon = (imageType: string) => {
    const icons: Record<string, string> = {
      flowchart: 'account_tree',
      diagram: 'schema',
      comparison: 'compare_arrows',
      hierarchy: 'device_hub',
      cycle: 'refresh',
      'concept-map': 'hub',
      system: 'settings_input_component',
      process: 'linear_scale',
      timeline: 'timeline',
      relationship: 'link',
      other: 'image',
    }

    return icons[imageType] || 'image'
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-primary text-2xl">auto_awesome</span>
          <div>
            <h3 className="font-heading font-bold text-lg">
              AI-Generated Image Proposals
            </h3>
            <p className="text-sm text-secondary-text dark:text-secondary-text-dark">
              Gemini has suggested {imageData.proposals.length} diagram{imageData.proposals.length !== 1 ? 's' : ''} to help visualize key concepts
            </p>
          </div>
        </div>
        {imageData.limitReached && (
          <span className="px-3 py-1 bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 rounded-full text-xs font-semibold">
            Max 2 images
          </span>
        )}
      </div>

      {/* Cost Notice */}
      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <p className="text-sm text-blue-700 dark:text-blue-400">
          💡 Image generation uses Google Imagen 3 and has associated costs (~$0.04 per image).
          You can approve, regenerate, or skip each proposal.
        </p>
      </div>

      {/* Proposals */}
      <div className="space-y-3">
        {imageData.proposals.map((proposal, index) => {
          const isExpanded = expandedProposals.has(proposal.id)

          return (
            <div
              key={proposal.id}
              className="glass dark:glass-dark rounded-lg border border-border-light dark:border-border-dark overflow-hidden"
            >
              {/* Proposal Header */}
              <div
                className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                onClick={() => toggleExpand(proposal.id)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <span className="material-symbols-outlined text-primary mt-1">
                      {getImageTypeIcon(proposal.imageType)}
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold">
                          Image Proposal {index + 1}
                        </h4>
                        {getStatusBadge(proposal.status)}
                      </div>
                      <p className="text-sm text-secondary-text dark:text-secondary-text-dark">
                        {proposal.originalDescription}
                      </p>
                      <p className="text-xs text-secondary-text dark:text-secondary-text-dark mt-1">
                        Type: <span className="font-semibold capitalize">{proposal.imageType.replace('-', ' ')}</span>
                      </p>
                    </div>
                  </div>
                  <span className={`material-symbols-outlined transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                    expand_more
                  </span>
                </div>
              </div>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="p-4 border-t border-border-light dark:border-border-dark bg-white dark:bg-midnight-blue">
                  {/* Enhanced Prompt Preview */}
                  <div className="mb-4">
                    <h5 className="text-sm font-semibold mb-2">Enhanced Prompt for Imagen 3:</h5>
                    <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700 text-sm font-mono text-secondary-text dark:text-secondary-text-dark">
                      {proposal.enhancedPrompt}
                    </div>
                  </div>

                  {/* Generated Image (if available) */}
                  {proposal.status === 'generated' && proposal.generatedImage && (
                    <div className="mb-4">
                      <h5 className="text-sm font-semibold mb-2">Generated Image:</h5>
                      <div className="border border-border-light dark:border-border-dark rounded-lg overflow-hidden">
                        {proposal.generatedImage.imageData ? (
                          <img
                            src={`data:${proposal.generatedImage.mimeType};base64,${proposal.generatedImage.imageData}`}
                            alt={proposal.originalDescription}
                            className="w-full h-auto"
                          />
                        ) : proposal.generatedImage.imageUrl ? (
                          <img
                            src={proposal.generatedImage.imageUrl}
                            alt={proposal.originalDescription}
                            className="w-full h-auto"
                          />
                        ) : (
                          <div className="p-8 text-center text-secondary-text dark:text-secondary-text-dark">
                            Image data unavailable
                          </div>
                        )}
                      </div>
                      {proposal.generatedImage.cost && (
                        <p className="text-xs text-secondary-text dark:text-secondary-text-dark mt-2">
                          Cost: ${proposal.generatedImage.cost.toFixed(4)}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Regeneration Count */}
                  {proposal.regenerationCount > 0 && (
                    <p className="text-xs text-secondary-text dark:text-secondary-text-dark mb-3">
                      Regenerated {proposal.regenerationCount} time{proposal.regenerationCount !== 1 ? 's' : ''}
                    </p>
                  )}

                  {/* Action Buttons */}
                  {proposal.status === 'pending' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApprove(proposal.id)}
                        className="flex-1 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors font-semibold flex items-center justify-center gap-2"
                      >
                        <span className="material-symbols-outlined text-sm">check_circle</span>
                        Generate Image
                      </button>
                      <button
                        onClick={() => handleSkip(proposal.id)}
                        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-primary-text dark:text-primary-text-dark rounded-lg transition-colors font-semibold"
                      >
                        Skip
                      </button>
                    </div>
                  )}

                  {proposal.status === 'generated' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleRegenerate(proposal.id)}
                        className="flex-1 px-4 py-2 bg-accent hover:bg-accent-dark text-midnight-blue rounded-lg transition-colors font-semibold flex items-center justify-center gap-2"
                      >
                        <span className="material-symbols-outlined text-sm">refresh</span>
                        Regenerate
                      </button>
                    </div>
                  )}

                  {proposal.status === 'failed' && proposal.generatedImage?.error && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-sm text-red-700 dark:text-red-400">
                      <p className="font-semibold mb-1">Generation Failed:</p>
                      <p>{proposal.generatedImage.error}</p>
                      <button
                        onClick={() => handleRegenerate(proposal.id)}
                        className="mt-2 px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded transition-colors text-xs font-semibold"
                      >
                        Retry
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Total Cost Summary */}
      {imageData.totalCost > 0 && (
        <div className="p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">Total Image Generation Cost:</span>
            <span className="text-sm font-bold text-primary">
              ${imageData.totalCost.toFixed(4)} USD
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

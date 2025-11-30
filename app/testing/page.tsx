'use client'

/**
 * TESTING PAGE - DELETE BEFORE PRODUCTION
 *
 * This page is for A/B testing and comparing different prompt versions.
 * It should be deleted or disabled before deploying to production.
 *
 * Features:
 * - Side-by-side comparison of old vs new prompts
 * - Quality metrics and feedback
 * - Visual marker testing
 * - Image proposal preview
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import ChatMessage from '@/components/ui/ChatMessage'

interface ComparisonResult {
  version: 'old' | 'new'
  content: string
  materialType: string
  timestamp: string
  imageData?: any
  hasImages?: boolean
}

export default function TestingPage() {
  const router = useRouter()
  const [sampleContent, setSampleContent] = useState('')
  const [materialType, setMaterialType] = useState<string>('summary')
  const [oldResult, setOldResult] = useState<ComparisonResult | null>(null)
  const [newResult, setNewResult] = useState<ComparisonResult | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Sample educational content for testing
  const loadSampleContent = () => {
    setSampleContent(`
# Introduction to Neural Networks

## What are Neural Networks?

Neural networks are computational models inspired by the human brain. They consist of interconnected nodes (neurons) organized in layers that process and transform data.

### Key Components:

1. **Input Layer**: Receives the raw data
2. **Hidden Layers**: Process the data through weighted connections
3. **Output Layer**: Produces the final prediction or classification

### How They Work:

Each neuron receives inputs, applies weights to them, sums them up, and passes the result through an activation function. The network learns by adjusting these weights through a process called backpropagation.

### Types of Neural Networks:

- **Feedforward Networks**: Data flows in one direction
- **Convolutional Networks (CNNs)**: Specialized for image processing
- **Recurrent Networks (RNNs)**: Handle sequential data like text or time series

### Applications:

Neural networks power many modern AI applications including image recognition, natural language processing, autonomous vehicles, and medical diagnosis.

### Training Process:

1. Initialize random weights
2. Forward propagation: Pass data through the network
3. Calculate loss (error)
4. Backpropagation: Update weights to reduce error
5. Repeat until convergence
    `)
  }

  const generateWithNewPrompts = async () => {
    if (!sampleContent.trim()) {
      setError('Please enter or load sample content')
      return
    }

    setIsGenerating(true)
    setError(null)

    try {
      const response = await fetch('/api/generate-materials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: sampleContent,
          slideText: '',
          imageAnalysis: '',
          materialType,
          modelTier: 'default',
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate materials')
      }

      const data = await response.json()

      setNewResult({
        version: 'new',
        content: data.content,
        materialType,
        timestamp: data.timestamp,
        imageData: data.imageData,
        hasImages: data.hasImages,
      })
    } catch (err: any) {
      setError(err.message || 'Generation failed')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-indigo-50 dark:from-midnight-blue dark:via-midnight-blue dark:to-deep-purple p-6">
      {/* Warning Banner */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-red-500 text-2xl">warning</span>
            <div>
              <h3 className="font-bold text-red-900">⚠️ TESTING PAGE - DELETE BEFORE PRODUCTION</h3>
              <p className="text-red-700 text-sm mt-1">
                This page is for internal testing only. It must be removed or disabled before deploying to production.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-heading font-bold text-gradient-academic mb-2">
              Prompt Testing & Comparison
            </h1>
            <p className="text-secondary-text dark:text-secondary-text-dark">
              Compare old and new prompt versions side-by-side
            </p>
          </div>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-secondary-light hover:bg-secondary text-white rounded-lg transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Input Section */}
        <div className="glass dark:glass-dark rounded-xl p-6 border border-border-light dark:border-border-dark">
          <h2 className="text-2xl font-heading font-bold mb-4">Test Configuration</h2>

          {/* Material Type Selector */}
          <div className="mb-4">
            <label className="block text-sm font-semibold mb-2">Material Type</label>
            <select
              value={materialType}
              onChange={(e) => setMaterialType(e.target.value)}
              className="w-full px-4 py-2 border border-border-light dark:border-border-dark rounded-lg focus:ring-2 focus:ring-primary bg-white dark:bg-midnight-blue text-primary-text dark:text-primary-text-dark"
            >
              <option value="summary">Summary</option>
              <option value="exam">Exam Preparation</option>
              <option value="quiz">Quiz</option>
              <option value="mock-exam">Mock Exam</option>
              <option value="explain">Explanation</option>
            </select>
          </div>

          {/* Sample Content */}
          <div className="mb-4">
            <label className="block text-sm font-semibold mb-2">Sample Content</label>
            <button
              onClick={loadSampleContent}
              className="mb-2 px-4 py-2 bg-accent hover:bg-accent-dark text-midnight-blue rounded-lg transition-colors text-sm font-semibold"
            >
              Load Sample: Neural Networks
            </button>
            <textarea
              value={sampleContent}
              onChange={(e) => setSampleContent(e.target.value)}
              className="w-full h-64 px-4 py-2 border border-border-light dark:border-border-dark rounded-lg focus:ring-2 focus:ring-primary bg-white dark:bg-midnight-blue text-primary-text dark:text-primary-text-dark font-mono text-sm"
              placeholder="Enter or load sample educational content..."
            />
          </div>

          {/* Generate Button */}
          <button
            onClick={generateWithNewPrompts}
            disabled={isGenerating || !sampleContent.trim()}
            className="w-full px-6 py-3 bg-primary hover:bg-primary-dark text-white rounded-lg transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center justify-center gap-2"
          >
            {isGenerating ? (
              <>
                <span className="material-symbols-outlined animate-spin">progress_activity</span>
                Generating...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined">science</span>
                Generate with New Prompts
              </>
            )}
          </button>

          {error && (
            <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
              {error}
            </div>
          )}
        </div>

        {/* Results Comparison */}
        {newResult && (
          <div className="grid grid-cols-1 gap-6">
            {/* New Version Results */}
            <div className="glass dark:glass-dark rounded-xl p-6 border-2 border-primary">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-heading font-bold text-primary">
                  New Enhanced Prompts
                </h2>
                <span className="px-3 py-1 bg-primary text-white rounded-full text-sm font-semibold">
                  CURRENT
                </span>
              </div>

              {/* Image Data Info */}
              {newResult.hasImages && newResult.imageData && (
                <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="material-symbols-outlined text-blue-600">image</span>
                    <h3 className="font-bold text-blue-900 dark:text-blue-300">
                      Image Proposals Generated
                    </h3>
                  </div>
                  <p className="text-sm text-blue-700 dark:text-blue-400 mb-2">
                    Found {newResult.imageData.visualMarkers?.length || 0} visual markers,
                    generated {newResult.imageData.proposals?.length || 0} image proposals,
                    successfully created {newResult.imageData.finalImages?.length || 0} images
                  </p>
                  {newResult.imageData.totalCost > 0 && (
                    <p className="text-sm font-semibold text-green-700 dark:text-green-400">
                      Total cost: ${newResult.imageData.totalCost.toFixed(4)} USD
                    </p>
                  )}
                  {newResult.imageData.proposals?.map((proposal: any, idx: number) => (
                    <div key={idx} className="mt-2 p-3 bg-white dark:bg-midnight-blue rounded border border-blue-200 dark:border-blue-800">
                      <p className="font-semibold text-sm">Proposal {idx + 1}:</p>
                      <p className="text-xs text-secondary-text dark:text-secondary-text-dark mt-1">
                        {proposal.originalDescription}
                      </p>
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                        Type: {proposal.imageType}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Generated Content */}
              <div className="mb-4">
                <h4 className="font-semibold mb-2">Generated Content (Rendered):</h4>
                <div className="p-4 bg-white dark:bg-midnight-blue rounded-lg border border-border-light dark:border-border-dark overflow-auto max-h-96">
                  <ChatMessage
                    content={newResult.content}
                    role="assistant"
                    showMarkdown={true}
                  />
                </div>
              </div>

              <div className="mb-4">
                <h4 className="font-semibold mb-2">Raw Markdown (with embedded images):</h4>
                <div className="p-4 bg-white dark:bg-midnight-blue rounded-lg border border-border-light dark:border-border-dark overflow-auto max-h-64">
                  <pre className="text-xs whitespace-pre-wrap font-mono">
                    {newResult.content}
                  </pre>
                </div>
              </div>

              {/* Metrics */}
              <div className="mt-4 grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-white dark:bg-midnight-blue rounded-lg border border-border-light dark:border-border-dark">
                  <p className="text-2xl font-bold text-primary">
                    {newResult.content.length}
                  </p>
                  <p className="text-xs text-secondary-text dark:text-secondary-text-dark">Characters</p>
                </div>
                <div className="text-center p-3 bg-white dark:bg-midnight-blue rounded-lg border border-border-light dark:border-border-dark">
                  <p className="text-2xl font-bold text-primary">
                    {newResult.content.split(/\s+/).length}
                  </p>
                  <p className="text-xs text-secondary-text dark:text-secondary-text-dark">Words</p>
                </div>
                <div className="text-center p-3 bg-white dark:bg-midnight-blue rounded-lg border border-border-light dark:border-border-dark">
                  <p className="text-2xl font-bold text-primary">
                    {newResult.imageData?.proposals?.length || 0}
                  </p>
                  <p className="text-xs text-secondary-text dark:text-secondary-text-dark">Images</p>
                </div>
              </div>
            </div>

            {/* Quality Checklist */}
            <div className="glass dark:glass-dark rounded-xl p-6 border border-border-light dark:border-border-dark">
              <h3 className="text-xl font-heading font-bold mb-4">Quality Checklist</h3>
              <div className="space-y-2">
                <label className="flex items-center gap-3 p-3 bg-white dark:bg-midnight-blue rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                  <input type="checkbox" className="w-5 h-5 text-primary" />
                  <span>Contains storytelling elements and narrative flow</span>
                </label>
                <label className="flex items-center gap-3 p-3 bg-white dark:bg-midnight-blue rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                  <input type="checkbox" className="w-5 h-5 text-primary" />
                  <span>Key concepts are highlighted (bold/italic/blockquotes)</span>
                </label>
                <label className="flex items-center gap-3 p-3 bg-white dark:bg-midnight-blue rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                  <input type="checkbox" className="w-5 h-5 text-primary" />
                  <span>Includes visual markers where appropriate</span>
                </label>
                <label className="flex items-center gap-3 p-3 bg-white dark:bg-midnight-blue rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                  <input type="checkbox" className="w-5 h-5 text-primary" />
                  <span>Has interactive self-check questions</span>
                </label>
                <label className="flex items-center gap-3 p-3 bg-white dark:bg-midnight-blue rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                  <input type="checkbox" className="w-5 h-5 text-primary" />
                  <span>Uses analogies and memorable mental models</span>
                </label>
                <label className="flex items-center gap-3 p-3 bg-white dark:bg-midnight-blue rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                  <input type="checkbox" className="w-5 h-5 text-primary" />
                  <span>Content is engaging and student-friendly</span>
                </label>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Warning */}
      <div className="max-w-7xl mx-auto mt-12">
        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-lg">
          <p className="text-yellow-800 text-sm font-semibold">
            📝 Remember to delete this page before production deployment!
          </p>
        </div>
      </div>
    </div>
  )
}

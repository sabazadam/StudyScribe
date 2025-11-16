'use client'

import { useState } from 'react'
import EnhancedMarkdown from '@/components/ui/EnhancedMarkdown'

const SAMPLE_TRANSCRIPT = `Today we're going to discuss Neural Networks and Deep Learning, including the mathematical foundations.

A neural network is a computational model inspired by biological neural networks in animal brains. It consists of interconnected nodes called neurons arranged in layers.

There are three main types of layers:
1. Input Layer - receives the raw data
2. Hidden Layers - process the information through weighted connections
3. Output Layer - produces the final result

The forward propagation can be expressed mathematically as:

$$y = f(Wx + b)$$

where $W$ represents weights, $x$ is the input vector, $b$ is the bias, and $f$ is the activation function.

The learning process happens through backpropagation. The goal is to minimize the loss function using gradient descent:

$$\\theta_{new} = \\theta_{old} - \\alpha \\frac{\\partial L}{\\partial \\theta}$$

where $\\alpha$ is the learning rate and $L$ is the loss function.

Common activation functions include:
- **ReLU** (Rectified Linear Unit): $f(x) = \\max(0, x)$ - most popular for hidden layers
- **Sigmoid**: $f(x) = \\frac{1}{1 + e^{-x}}$ - outputs between 0 and 1
- **Tanh**: $f(x) = \\frac{e^x - e^{-x}}{e^x + e^{-x}}$ - outputs between -1 and 1
- **Softmax**: Used for multi-class classification in output layer

For a neural network with $L$ layers, the output can be computed as:

$$a^{(L)} = f^{(L)}(W^{(L)}a^{(L-1)} + b^{(L)})$$

The loss function for binary classification is often the cross-entropy:

$$L = -\\frac{1}{m}\\sum_{i=1}^{m}[y^{(i)}\\log(\\hat{y}^{(i)}) + (1-y^{(i)})\\log(1-\\hat{y}^{(i)})]$$

Deep learning refers to neural networks with multiple hidden layers. The depth allows the network to learn hierarchical representations of data.

Applications include image recognition, natural language processing, recommendation systems, and autonomous vehicles.`

const OUTPUT_TYPES = [
  { value: 'exam', label: 'Study Material for Exam' },
  { value: 'summary', label: 'Summarize Content' },
  { value: 'quiz', label: 'Quiz' },
  { value: 'mock-exam', label: 'Mock Exam' },
  { value: 'explain', label: 'Explaining Part by Part' },
  { value: 'custom', label: 'Custom Request' },
]

export default function TestPage() {
  const [transcript, setTranscript] = useState(SAMPLE_TRANSCRIPT)
  const [outputType, setOutputType] = useState('exam')
  const [customPrompt, setCustomPrompt] = useState('')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleGenerate = async () => {
    setLoading(true)
    setError('')
    setResult('')

    try {
      const response = await fetch('/api/test-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript,
          outputType,
          customPrompt: outputType === 'custom' ? customPrompt : undefined,
        }),
      })

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`)
      }

      const data = await response.json()
      setResult(data.content)
    } catch (err: any) {
      setError(err.message || 'Failed to generate content')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Gemini API Test Lab
          </h1>
          <p className="text-gray-600 mt-2">
            Test prompt engineering and validate Gemini API responses
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Panel */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Input Transcript
              </h2>
              <textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                className="w-full h-64 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none font-mono text-sm"
                placeholder="Paste your lecture transcript here..."
              />
              <button
                onClick={() => setTranscript(SAMPLE_TRANSCRIPT)}
                className="mt-2 px-4 py-2 text-sm text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors"
              >
                Load Sample Transcript
              </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Output Type
              </h2>
              <select
                value={outputType}
                onChange={(e) => setOutputType(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                {OUTPUT_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>

              {outputType === 'custom' && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Custom Request
                  </label>
                  <textarea
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    className="w-full h-24 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                    placeholder="e.g., 'Create flashcards focusing on key definitions' or 'Explain this using simple analogies'"
                  />
                </div>
              )}

              <button
                onClick={handleGenerate}
                disabled={loading || !transcript.trim()}
                className="w-full mt-4 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
              >
                {loading ? 'Generating...' : 'Generate with Gemini'}
              </button>
            </div>
          </div>

          {/* Output Panel */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Generated Output
            </h2>

            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {loading && (
              <div className="flex items-center justify-center h-96">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Generating with Gemini...</p>
                </div>
              </div>
            )}

            {!loading && result && (
              <div className="bg-white rounded-lg border border-gray-200 overflow-auto max-h-[600px] p-4">
                <EnhancedMarkdown content={result} />
              </div>
            )}

            {!loading && !result && !error && (
              <div className="flex items-center justify-center h-96 text-gray-400">
                <div className="text-center">
                  <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p>Generated content will appear here</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Info Panel */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="font-semibold text-blue-900 mb-2">Testing Tips</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Use the sample transcript or paste your own lecture content</li>
            <li>• Try different output types to compare prompt effectiveness</li>
            <li>• For custom requests, be specific about what you want</li>
            <li>• Check console for detailed prompt that was sent to Gemini</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

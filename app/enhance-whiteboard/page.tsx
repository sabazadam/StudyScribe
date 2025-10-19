'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Layout } from '@/components/layout/Layout'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

export default function EnhanceWhiteboard() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [enhanced, setEnhanced] = useState(false)
  const [extractedText, setExtractedText] = useState('')

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      setFile(selectedFile)

      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(selectedFile)
    }
  }

  const handleEnhance = async () => {
    if (!file) {
      alert('Please upload an image first')
      return
    }

    setLoading(true)

    // Simulate processing
    setTimeout(() => {
      setEnhanced(true)
      setExtractedText(
        'This is an example of the extracted text from the enhanced whiteboard image. The AI has processed the handwriting and converted it into a digital format, making it easy to copy, edit, and save.\n\nKey Concepts:\n• Concept 1: Example explanation\n• Concept 2: Another important point\n• Concept 3: Final key takeaway'
      )
      setLoading(false)
    }, 2000)
  }

  const handleCopyText = () => {
    navigator.clipboard.writeText(extractedText)
    alert('Text copied to clipboard!')
  }

  return (
    <Layout>
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="container mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-3xl font-bold">Whiteboard Enhancer</h2>
              {enhanced && (
                <div className="flex items-center gap-4">
                  <Button variant="secondary">
                    <span className="material-symbols-outlined mr-2">save</span>
                    Save to Study Hub
                  </Button>
                  <Button variant="outline">
                    <span className="material-symbols-outlined mr-2">download</span>
                    Download
                  </Button>
                </div>
              )}
            </div>
            <Link
              href="/"
              className="text-sm font-medium text-primary hover:text-primary-dark transition-colors"
            >
              ← Back to Dashboard
            </Link>
          </div>

          {!preview ? (
            /* Upload Section */
            <div className="max-w-2xl mx-auto">
              <div className="relative block w-full rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 p-12 text-center hover:border-gray-400 dark:hover:border-gray-500 transition-colors">
                <input
                  type="file"
                  id="image-upload"
                  className="hidden"
                  accept="image/*,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                />

                <span className="material-symbols-outlined text-6xl text-gray-400 mb-4">
                  image
                </span>

                <p className="mt-4 block text-lg font-semibold">
                  Drag & Drop your whiteboard image here
                </p>

                <div className="mt-4 flex items-center justify-center">
                  <span className="text-sm text-gray-500">Or</span>
                  <label
                    htmlFor="image-upload"
                    className="ml-2 rounded bg-primary/10 px-3 py-1.5 text-sm font-semibold text-primary hover:bg-primary/20 cursor-pointer transition-colors"
                  >
                    browse files
                  </label>
                </div>

                <p className="mt-2 text-xs text-gray-500">JPG, PNG up to 10MB</p>
              </div>
            </div>
          ) : loading ? (
            /* Loading State */
            <div className="flex flex-col items-center justify-center py-20">
              <LoadingSpinner size="lg" />
              <p className="mt-4 text-lg font-medium">Enhancing your image...</p>
              <p className="text-sm text-gray-500 mt-2">This may take a moment</p>
            </div>
          ) : (
            /* Results Section */
            <div className="space-y-8">
              {/* Before/After Comparison */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Original */}
                <div>
                  <h3 className="text-xl font-bold mb-4">Original</h3>
                  <div className="bg-card-light dark:bg-card-dark rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                    <div
                      className="w-full aspect-[4/3] bg-center bg-no-repeat bg-cover"
                      style={{ backgroundImage: `url(${preview})` }}
                    />
                  </div>
                </div>

                {/* Enhanced */}
                <div>
                  <h3 className="text-xl font-bold mb-4">Enhanced</h3>
                  <div className="bg-card-light dark:bg-card-dark rounded-xl shadow-lg overflow-hidden border-2 border-primary/20">
                    <div
                      className="w-full aspect-[4/3] bg-center bg-no-repeat bg-cover"
                      style={{
                        backgroundImage: `url(${preview})`,
                        filter: 'contrast(1.2) brightness(1.1) sharpen(1)',
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Extracted Text */}
              <div>
                <h3 className="text-xl font-bold mb-4">Extracted Text</h3>
                <div className="bg-card-light dark:bg-card-dark p-4 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
                  <textarea
                    className="w-full h-48 p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-primary focus:border-primary resize-none"
                    value={extractedText}
                    onChange={(e) => setExtractedText(e.target.value)}
                    placeholder="AI-extracted text will appear here..."
                  />
                  <div className="mt-4 flex justify-end">
                    <Button variant="outline" onClick={handleCopyText}>
                      <span className="material-symbols-outlined text-base mr-2">
                        content_copy
                      </span>
                      Copy Text
                    </Button>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-center gap-4">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setFile(null)
                    setPreview(null)
                    setEnhanced(false)
                    setExtractedText('')
                  }}
                >
                  Process Another Image
                </Button>
              </div>
            </div>
          )}

          {/* Process Button (only show when preview exists but not loading/enhanced) */}
          {preview && !loading && !enhanced && (
            <div className="flex justify-center mt-8">
              <Button onClick={handleEnhance} size="lg">
                Enhance & Extract Text
              </Button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}

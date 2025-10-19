'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Layout } from '@/components/layout/Layout'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

export default function ProcessLecture() {
  const [file, setFile] = useState<File | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [loading, setLoading] = useState(false)
  const [options, setOptions] = useState({
    summary: false,
    concepts: false,
    quiz: false,
  })

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0])
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleSubmit = async () => {
    if (!file || (!options.summary && !options.concepts && !options.quiz)) {
      alert('Please upload a file and select at least one option')
      return
    }

    setLoading(true)
    // Simulate processing
    setTimeout(() => {
      setLoading(false)
      alert('Study guide generated! (This is a demo)')
    }, 2000)
  }

  return (
    <Layout>
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="max-w-2xl w-full py-12">
          {/* Header */}
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-2">
              Create Your New Study Guide
            </h2>
            <Link
              href="/"
              className="text-sm font-medium text-primary hover:text-primary-dark transition-colors"
            >
              ← Back to Dashboard
            </Link>
          </div>

          <div className="space-y-12">
            {/* Step 1: Upload File */}
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white font-bold text-sm">
                  1
                </span>
                <h3 className="text-xl font-semibold">Upload Your File</h3>
              </div>

              <div
                className={`relative block w-full rounded-lg border-2 border-dashed p-12 text-center transition-colors ${
                  dragActive
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  accept="audio/*,video/*,.mp3,.mp4,.wav,.mov"
                  onChange={handleChange}
                />

                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 48 48"
                >
                  <path
                    d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                  />
                </svg>

                {file ? (
                  <div className="mt-4">
                    <p className="text-lg font-semibold text-primary">{file.name}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                ) : (
                  <>
                    <p className="mt-4 block text-lg font-semibold">
                      Drag & Drop your audio/video file here
                    </p>
                    <div className="mt-4 flex items-center justify-center">
                      <span className="text-sm text-gray-500">Or</span>
                      <label
                        htmlFor="file-upload"
                        className="ml-2 rounded bg-primary/10 px-3 py-1.5 text-sm font-semibold text-primary hover:bg-primary/20 cursor-pointer transition-colors"
                      >
                        browse files
                      </label>
                    </div>
                    <p className="mt-2 text-xs text-gray-500">
                      MP3, MP4, WAV, MOV up to 2GB
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Step 2: Choose Features */}
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white font-bold text-sm">
                  2
                </span>
                <h3 className="text-xl font-semibold">Choose Your AI Features</h3>
              </div>

              <p className="text-gray-600 dark:text-gray-300">
                Select the sections for your PDF study guide:
              </p>

              <div className="space-y-4">
                <label className="relative flex items-start p-4 rounded-lg border border-gray-200 dark:border-gray-700 has-[:checked]:border-primary has-[:checked]:bg-primary/5 transition-all cursor-pointer">
                  <input
                    type="checkbox"
                    className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary mt-0.5"
                    checked={options.summary}
                    onChange={(e) =>
                      setOptions({ ...options, summary: e.target.checked })
                    }
                  />
                  <div className="ml-4">
                    <span className="font-semibold block">Briefly summarize lecture</span>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Get a concise summary of the key points.
                    </p>
                  </div>
                </label>

                <label className="relative flex items-start p-4 rounded-lg border border-gray-200 dark:border-gray-700 has-[:checked]:border-primary has-[:checked]:bg-primary/5 transition-all cursor-pointer">
                  <input
                    type="checkbox"
                    className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary mt-0.5"
                    checked={options.concepts}
                    onChange={(e) =>
                      setOptions({ ...options, concepts: e.target.checked })
                    }
                  />
                  <div className="ml-4">
                    <span className="font-semibold block">
                      Explain concepts part-by-part
                    </span>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      A detailed breakdown of complex topics.
                    </p>
                  </div>
                </label>

                <label className="relative flex items-start p-4 rounded-lg border border-gray-200 dark:border-gray-700 has-[:checked]:border-primary has-[:checked]:bg-primary/5 transition-all cursor-pointer">
                  <input
                    type="checkbox"
                    className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary mt-0.5"
                    checked={options.quiz}
                    onChange={(e) => setOptions({ ...options, quiz: e.target.checked })}
                  />
                  <div className="ml-4">
                    <span className="font-semibold block">Write me a quiz</span>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Test your knowledge with practice questions.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-6">
              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full"
                size="lg"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <LoadingSpinner size="sm" />
                    <span>Generating Study Guide...</span>
                  </div>
                ) : (
                  'Generate Study Guide'
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Header } from '@/components/layout/Header'
import { authenticatedPost, authenticatedFormPost } from '@/lib/api/client'

interface SelectedMaterial {
  id: string
  title: string
  materialType: string
  createdAt: string
}

interface ExamAnalysis {
  questionTypes: string[]
  questionCount: Record<string, number>
  difficulty: string
  topicDistribution: Record<string, number>
  formattingStyle: string
  totalQuestions: number
}

export default function ExamGeneratorPage() {
  const { user } = useAuth()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Step management
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1)

  // Step 1: Upload exam
  const [examFile, setExamFile] = useState<File | null>(null)
  const [extracting, setExtracting] = useState(false)
  const [examText, setExamText] = useState<string>('')

  // Step 2: Analyze exam
  const [analyzing, setAnalyzing] = useState(false)
  const [examAnalysis, setExamAnalysis] = useState<ExamAnalysis | null>(null)

  // Step 3: Select materials
  const [materials, setMaterials] = useState<SelectedMaterial[]>([])
  const [selectedMaterials, setSelectedMaterials] = useState<SelectedMaterial[]>([])
  const [loadingMaterials, setLoadingMaterials] = useState(false)

  // Step 4: Generate exam
  const [generating, setGenerating] = useState(false)
  const [generatedExam, setGeneratedExam] = useState<any>(null)
  const [includeAnswerKey, setIncludeAnswerKey] = useState(true)
  const [targetQuestionCount, setTargetQuestionCount] = useState<number>(10)

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      router.push('/auth/signin?redirect=/exam-generator')
    }
  }, [user, router])

  // Load user's materials when reaching step 3
  useEffect(() => {
    if (currentStep === 3 && materials.length === 0) {
      loadMaterials()
    }
  }, [currentStep])

  const loadMaterials = async () => {
    setLoadingMaterials(true)
    try {
      const response = await authenticatedPost('/api/study-materials/list', {})
      if (response.ok) {
        const data = await response.json()
        setMaterials(data.materials || [])
      }
    } catch (error) {
      console.error('Failed to load materials:', error)
    } finally {
      setLoadingMaterials(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (file.type !== 'application/pdf') {
      alert('Please upload a PDF file')
      return
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      alert('File size must be less than 10MB')
      return
    }

    setExamFile(file)
  }

  const handleExtractText = async () => {
    if (!examFile) return

    setExtracting(true)
    try {
      const formData = new FormData()
      formData.append('pdf', examFile)

      const response = await authenticatedFormPost('/api/extract-pdf', formData)

      if (response.ok) {
        const data = await response.json()
        setExamText(data.text)
        setCurrentStep(2)
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to extract text from PDF')
      }
    } catch (error) {
      console.error('PDF extraction error:', error)
      alert('Failed to extract text from PDF')
    } finally {
      setExtracting(false)
    }
  }

  const handleAnalyzeExam = async () => {
    if (!examText) return

    setAnalyzing(true)
    try {
      const response = await authenticatedPost('/api/analyze-exam', {
        examText,
      })

      if (response.ok) {
        const data = await response.json()
        setExamAnalysis(data.analysis)
        setTargetQuestionCount(data.analysis.totalQuestions || 10)
        setCurrentStep(3)
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to analyze exam')
      }
    } catch (error) {
      console.error('Exam analysis error:', error)
      alert('Failed to analyze exam')
    } finally {
      setAnalyzing(false)
    }
  }

  const toggleMaterialSelection = (material: SelectedMaterial) => {
    if (selectedMaterials.find(m => m.id === material.id)) {
      setSelectedMaterials(selectedMaterials.filter(m => m.id !== material.id))
    } else {
      if (selectedMaterials.length >= 5) {
        alert('You can select a maximum of 5 materials')
        return
      }
      setSelectedMaterials([...selectedMaterials, material])
    }
  }

  const handleGenerateExam = async () => {
    if (selectedMaterials.length < 2) {
      alert('Please select at least 2 materials')
      return
    }

    setGenerating(true)
    try {
      const response = await authenticatedPost('/api/generate-exam', {
        examAnalysis,
        materialIds: selectedMaterials.map(m => m.id),
        questionCount: targetQuestionCount,
        includeAnswerKey,
      })

      if (response.ok) {
        const data = await response.json()
        setGeneratedExam(data.exam)
        setCurrentStep(4)
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to generate exam')
      }
    } catch (error) {
      console.error('Exam generation error:', error)
      alert('Failed to generate exam')
    } finally {
      setGenerating(false)
    }
  }

  const handleDownloadPDF = async () => {
    if (!generatedExam) return

    try {
      const response = await authenticatedPost('/api/export-exam-pdf', {
        exam: generatedExam,
        includeAnswerKey,
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `mock-exam-${Date.now()}.pdf`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      } else {
        alert('Failed to generate PDF')
      }
    } catch (error) {
      console.error('PDF export error:', error)
      alert('Failed to export PDF')
    }
  }

  const handleReset = () => {
    setCurrentStep(1)
    setExamFile(null)
    setExamText('')
    setExamAnalysis(null)
    setSelectedMaterials([])
    setGeneratedExam(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Header />

      <main className="pt-24 pb-16 px-6">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-heading font-bold text-gradient-academic mb-3">
              Mock Exam Generator
            </h1>
            <p className="text-lg text-oxford-blue/70">
              Upload a past exam, and we'll generate a similar one based on your study materials
            </p>
          </div>

          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {[1, 2, 3, 4].map((step) => (
                <div key={step} className="flex items-center flex-1">
                  <div className={`
                    flex items-center justify-center w-10 h-10 rounded-full font-semibold
                    ${currentStep >= step
                      ? 'bg-primary text-white'
                      : 'bg-gray-200 text-gray-500'
                    }
                  `}>
                    {step}
                  </div>
                  {step < 4 && (
                    <div className={`flex-1 h-1 mx-2 ${
                      currentStep > step ? 'bg-primary' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2 text-sm">
              <span className={currentStep >= 1 ? 'text-primary font-medium' : 'text-gray-500'}>Upload</span>
              <span className={currentStep >= 2 ? 'text-primary font-medium' : 'text-gray-500'}>Analyze</span>
              <span className={currentStep >= 3 ? 'text-primary font-medium' : 'text-gray-500'}>Select Materials</span>
              <span className={currentStep >= 4 ? 'text-primary font-medium' : 'text-gray-500'}>Generate</span>
            </div>
          </div>

          {/* Step 1: Upload Exam */}
          {currentStep === 1 && (
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-oxford-blue mb-4">
                Upload Past Exam
              </h2>
              <p className="text-oxford-blue/70 mb-6">
                Upload a PDF of a past mock exam. We'll analyze its structure and question types.
              </p>

              <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {!examFile ? (
                  <>
                    <span className="material-symbols-outlined text-6xl text-gray-400 mb-4">
                      upload_file
                    </span>
                    <p className="text-lg text-oxford-blue mb-2">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-sm text-oxford-blue/60 mb-4">
                      PDF files only (max 10MB)
                    </p>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark transition-colors"
                    >
                      Select PDF
                    </button>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-6xl text-green-500 mb-4">
                      check_circle
                    </span>
                    <p className="text-lg text-oxford-blue mb-2 font-semibold">
                      {examFile.name}
                    </p>
                    <p className="text-sm text-oxford-blue/60 mb-4">
                      {(examFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    <div className="flex gap-3 justify-center">
                      <button
                        onClick={() => {
                          setExamFile(null)
                          if (fileInputRef.current) fileInputRef.current.value = ''
                        }}
                        className="px-6 py-3 bg-gray-200 text-oxford-blue rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                      >
                        Remove
                      </button>
                      <button
                        onClick={handleExtractText}
                        disabled={extracting}
                        className="px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {extracting ? (
                          <>
                            <span className="animate-spin material-symbols-outlined">
                              progress_activity
                            </span>
                            Extracting...
                          </>
                        ) : (
                          'Continue'
                        )}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Analyze Exam */}
          {currentStep === 2 && (
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-oxford-blue mb-4">
                Exam Text Extracted
              </h2>
              <p className="text-oxford-blue/70 mb-6">
                We've extracted {examText.split(/\s+/).length} words from your exam. Click continue to analyze its structure.
              </p>

              <div className="bg-gray-50 rounded-xl p-6 mb-6 max-h-96 overflow-y-auto">
                <pre className="text-sm text-oxford-blue whitespace-pre-wrap font-mono">
                  {examText.substring(0, 1000)}...
                </pre>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setCurrentStep(1)}
                  className="px-6 py-3 bg-gray-200 text-oxford-blue rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleAnalyzeExam}
                  disabled={analyzing}
                  className="px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {analyzing ? (
                    <>
                      <span className="animate-spin material-symbols-outlined">
                        progress_activity
                      </span>
                      Analyzing...
                    </>
                  ) : (
                    'Analyze Exam Structure'
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Select Materials */}
          {currentStep === 3 && (
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-oxford-blue mb-4">
                Select Study Materials
              </h2>
              <p className="text-oxford-blue/70 mb-2">
                Select 2-5 materials to generate questions from. The exam will be based on these materials.
              </p>

              {examAnalysis && (
                <div className="bg-blue-50 rounded-xl p-4 mb-6">
                  <h3 className="font-semibold text-oxford-blue mb-2">Exam Analysis</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-oxford-blue/70">Total Questions:</span>
                      <span className="ml-2 font-semibold">{examAnalysis.totalQuestions}</span>
                    </div>
                    <div>
                      <span className="text-oxford-blue/70">Difficulty:</span>
                      <span className="ml-2 font-semibold capitalize">{examAnalysis.difficulty}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-oxford-blue/70">Question Types:</span>
                      <span className="ml-2 font-semibold">{examAnalysis.questionTypes.join(', ')}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="mb-4">
                <p className="text-sm text-oxford-blue/70">
                  Selected: {selectedMaterials.length} / 5 materials
                </p>
              </div>

              {loadingMaterials ? (
                <div className="text-center py-12">
                  <span className="animate-spin material-symbols-outlined text-4xl text-primary">
                    progress_activity
                  </span>
                  <p className="mt-4 text-oxford-blue/70">Loading your materials...</p>
                </div>
              ) : materials.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-oxford-blue/70 mb-4">You don't have any study materials yet.</p>
                  <button
                    onClick={() => router.push('/create')}
                    className="px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark transition-colors"
                  >
                    Create Your First Material
                  </button>
                </div>
              ) : (
                <div className="grid gap-3 mb-6 max-h-96 overflow-y-auto">
                  {materials.map((material) => {
                    const isSelected = selectedMaterials.find(m => m.id === material.id)
                    return (
                      <div
                        key={material.id}
                        onClick={() => toggleMaterialSelection(material)}
                        className={`
                          p-4 rounded-xl border-2 cursor-pointer transition-all
                          ${isSelected
                            ? 'border-primary bg-primary/5'
                            : 'border-gray-200 hover:border-primary/50'
                          }
                        `}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold text-oxford-blue">{material.title}</h4>
                            <p className="text-sm text-oxford-blue/60 capitalize">{material.materialType}</p>
                          </div>
                          {isSelected && (
                            <span className="material-symbols-outlined text-primary">
                              check_circle
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setCurrentStep(2)}
                  className="px-6 py-3 bg-gray-200 text-oxford-blue rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={() => setCurrentStep(4)}
                  disabled={selectedMaterials.length < 2}
                  className="px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue to Generation
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Generate & Download */}
          {currentStep === 4 && (
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-oxford-blue mb-4">
                Generate Mock Exam
              </h2>

              {!generatedExam ? (
                <>
                  <p className="text-oxford-blue/70 mb-6">
                    Configure your exam settings and generate a new mock exam based on your selected materials.
                  </p>

                  <div className="space-y-4 mb-6">
                    <div>
                      <label className="block text-sm font-semibold text-oxford-blue mb-2">
                        Number of Questions: {targetQuestionCount}
                      </label>
                      <input
                        type="range"
                        min="5"
                        max="50"
                        value={targetQuestionCount}
                        onChange={(e) => setTargetQuestionCount(Number(e.target.value))}
                        className="w-full"
                      />
                    </div>

                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="answerKey"
                        checked={includeAnswerKey}
                        onChange={(e) => setIncludeAnswerKey(e.target.checked)}
                        className="w-5 h-5 text-primary rounded focus:ring-primary"
                      />
                      <label htmlFor="answerKey" className="text-oxford-blue font-medium">
                        Include answer key
                      </label>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setCurrentStep(3)}
                      className="px-6 py-3 bg-gray-200 text-oxford-blue rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleGenerateExam}
                      disabled={generating}
                      className="px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {generating ? (
                        <>
                          <span className="animate-spin material-symbols-outlined">
                            progress_activity
                          </span>
                          Generating... (20-30s)
                        </>
                      ) : (
                        'Generate Exam'
                      )}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-oxford-blue/70 mb-6">
                    Your mock exam has been generated successfully! Download it as a PDF or start over to create another one.
                  </p>

                  <div className="bg-green-50 rounded-xl p-6 mb-6">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="material-symbols-outlined text-green-600 text-3xl">
                        check_circle
                      </span>
                      <h3 className="text-xl font-bold text-green-800">Exam Generated!</h3>
                    </div>
                    <p className="text-green-700">
                      {generatedExam.questions?.length || targetQuestionCount} questions generated based on {selectedMaterials.length} materials
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={handleReset}
                      className="px-6 py-3 bg-gray-200 text-oxford-blue rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                    >
                      Create Another Exam
                    </button>
                    <button
                      onClick={handleDownloadPDF}
                      className="px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark transition-colors flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined">download</span>
                      Download PDF
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

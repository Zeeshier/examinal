import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import DashboardLayout from '../components/DashboardLayout'
import {
    ArrowRight,
    ArrowLeft,
    FileText,
    Clock,
    Award,
    CheckCircle2,
    Upload,
    Sparkles,
    Plus,
    Trash2,
    Brain,
    PenTool,
    ListChecks,
    MessageSquare,
    Loader2,
    AlertCircle,
    FilePlus
} from 'lucide-react'

const API_URL = 'http://localhost:8000'

const STEPS = ['Details', 'Type', 'Source', 'Questions']

export default function CreateExam() {
    const { token } = useAuth()
    const navigate = useNavigate()
    const [step, setStep] = useState(0)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [examId, setExamId] = useState(null)

    // Step 1: Exam details
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        duration_minutes: 30,
        total_marks: 100,
        passing_marks: 40
    })

    // Step 2: Exam type
    const [examType, setExamType] = useState('mcq') // 'mcq' | 'subjective'

    // Step 3: Question source
    const [questionSource, setQuestionSource] = useState('') // 'ai' | 'manual'
    const [file, setFile] = useState(null)
    const [aiConfig, setAiConfig] = useState({ num_questions: 5, difficulty: 'medium' })
    const [generating, setGenerating] = useState(false)

    // Step 4: Questions
    const [questions, setQuestions] = useState([])
    const [currentQuestion, setCurrentQuestion] = useState({
        question_text: '',
        question_type: 'objective',
        options: ['', '', '', ''],
        correct_answer: '',
        model_answer: '',
        marks: 1
    })
    const [publishing, setPublishing] = useState(false)
    const [uploadProgress, setUploadProgress] = useState(0)

    const update = (field, value) => setFormData(prev => ({ ...prev, [field]: value }))

    // --- Step Navigation ---
    const canProceed = () => {
        if (step === 0) return formData.title.trim() && formData.duration_minutes > 0 && formData.total_marks > 0
        if (step === 1) return true
        if (step === 2) {
            if (questionSource === 'ai') return !!file
            return !!questionSource
        }
        return true
    }

    const nextStep = async () => {
        if (step === 0) {
            // Create exam on server
            setLoading(true)
            setError('')
            try {
                const res = await fetch(`${API_URL}/api/exams/`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        ...formData,
                        duration_minutes: parseInt(formData.duration_minutes),
                        total_marks: parseFloat(formData.total_marks),
                        passing_marks: formData.passing_marks ? parseFloat(formData.passing_marks) : null,
                        exam_type: examType
                    })
                })
                if (!res.ok) {
                    const data = await res.json()
                    setError(data.detail || 'Failed to create exam')
                    return
                }
                const exam = await res.json()
                setExamId(exam.id)
            } catch {
                setError('Unable to connect to server')
                return
            } finally {
                setLoading(false)
            }
        }

        if (step === 2 && questionSource === 'ai') {
            // Upload file + generate questions
            await handleAIGenerate()
            return
        }

        setStep(prev => Math.min(prev + 1, 3))
    }

    const prevStep = () => setStep(prev => Math.max(prev - 1, 0))

    // --- AI Generation ---
    const handleAIGenerate = async () => {
        if (!file || !examId) return
        setGenerating(true)
        setError('')
        setUploadProgress(0)

        try {
            // 1. Upload file
            const fileBody = new FormData()
            fileBody.append('file', file)

            const progressInterval = setInterval(() => {
                setUploadProgress(prev => Math.min(prev + 8, 60))
            }, 400)

            const uploadRes = await fetch(`${API_URL}/api/upload/${examId}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: fileBody
            })

            clearInterval(progressInterval)
            setUploadProgress(70)

            if (!uploadRes.ok) {
                const data = await uploadRes.json()
                setError(data.detail || 'File upload failed')
                setGenerating(false)
                return
            }

            // 2. Generate questions
            setUploadProgress(80)
            const genRes = await fetch(`${API_URL}/api/ai/generate`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    exam_id: examId,
                    num_questions: aiConfig.num_questions,
                    difficulty: aiConfig.difficulty
                })
            })

            setUploadProgress(95)

            if (!genRes.ok) {
                const data = await genRes.json()
                setError(data.detail || 'AI generation failed')
                setGenerating(false)
                return
            }

            const generated = await genRes.json()
            // Map AI response to question format
            const mapped = generated.map((q, i) => ({
                question_text: q.question_text,
                question_type: q.type === 'objective' ? 'objective' : 'subjective',
                options: q.options || [],
                correct_answer: q.correct_answer || '',
                model_answer: q.model_answer || '',
                marks: parseFloat(formData.total_marks) / generated.length
            }))

            setQuestions(mapped)
            setUploadProgress(100)
            setTimeout(() => setStep(3), 300)
        } catch {
            setError('AI generation failed. Check your NVIDIA API key.')
        } finally {
            setGenerating(false)
        }
    }

    // --- Manual Question Management ---
    const addQuestion = () => {
        if (!currentQuestion.question_text.trim()) return

        const q = { ...currentQuestion }
        if (q.question_type === 'objective') {
            q.options = q.options.filter(o => o.trim())
        }
        setQuestions(prev => [...prev, q])
        setCurrentQuestion({
            question_text: '',
            question_type: examType === 'mcq' ? 'objective' : 'subjective',
            options: ['', '', '', ''],
            correct_answer: '',
            model_answer: '',
            marks: 1
        })
    }

    const removeQuestion = (index) => {
        setQuestions(prev => prev.filter((_, i) => i !== index))
    }

    // --- Publish ---
    const handlePublish = async () => {
        if (questions.length === 0) {
            setError('Add at least one question before publishing')
            return
        }
        setPublishing(true)
        setError('')

        try {
            // 1. Save questions
            const qRes = await fetch(`${API_URL}/api/exams/${examId}/questions`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ questions })
            })

            if (!qRes.ok) {
                const data = await qRes.json()
                setError(data.detail || 'Failed to save questions')
                return
            }

            // 2. Publish exam
            const pubRes = await fetch(`${API_URL}/api/exams/${examId}/publish`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            })

            if (!pubRes.ok) {
                const data = await pubRes.json()
                setError(data.detail || 'Failed to publish exam')
                return
            }

            navigate('/instructor/dashboard')
        } catch {
            setError('Unable to connect to server')
        } finally {
            setPublishing(false)
        }
    }

    // --- File Handling ---
    const handleDrop = (e) => {
        e.preventDefault()
        const dropped = e.dataTransfer.files[0]
        if (dropped && (dropped.type === 'application/pdf' || dropped.name.endsWith('.docx'))) {
            setFile(dropped)
        } else {
            setError('Only PDF and DOCX files are supported')
        }
    }

    const handleFileInput = (e) => {
        const selected = e.target.files?.[0]
        if (selected) setFile(selected)
    }

    // --- Render Helpers ---
    const renderStepIndicator = () => (
        <div className="flex items-center justify-center gap-2 mb-8">
            {STEPS.map((label, i) => (
                <div key={i} className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${i < step ? 'bg-success text-white' :
                            i === step ? 'bg-primary text-white ring-2 ring-primary/30' :
                                'bg-white/[0.06] text-text-muted'
                        }`}>
                        {i < step ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                    </div>
                    <span className={`text-xs font-medium hidden sm:inline ${i === step ? 'text-white' : 'text-text-muted'
                        }`}>{label}</span>
                    {i < STEPS.length - 1 && (
                        <div className={`w-8 h-px ${i < step ? 'bg-success' : 'bg-white/10'}`} />
                    )}
                </div>
            ))}
        </div>
    )

    const renderStep0 = () => (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="space-y-5">
            <div>
                <label className="block text-xs font-semibold text-text-secondary mb-2 uppercase tracking-wider">Exam Title *</label>
                <div className="relative">
                    <input type="text" className="input-premium pl-10 w-full" placeholder="e.g. AI Fundamentals Quiz" value={formData.title} onChange={e => update('title', e.target.value)} required />
                    <FileText className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
            </div>
            <div>
                <label className="block text-xs font-semibold text-text-secondary mb-2 uppercase tracking-wider">Description</label>
                <textarea className="input-premium w-full resize-none" rows={3} placeholder="Brief description of the exam..." value={formData.description} onChange={e => update('description', e.target.value)} />
            </div>
            <div className="grid grid-cols-3 gap-4">
                <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-2 uppercase tracking-wider">Duration</label>
                    <div className="relative">
                        <input type="number" className="input-premium pl-10 w-full" value={formData.duration_minutes} onChange={e => update('duration_minutes', e.target.value)} min={1} />
                        <Clock className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                    </div>
                    <span className="text-[10px] text-text-muted mt-1 block">minutes</span>
                </div>
                <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-2 uppercase tracking-wider">Total Marks</label>
                    <div className="relative">
                        <input type="number" className="input-premium pl-10 w-full" value={formData.total_marks} onChange={e => update('total_marks', e.target.value)} min={1} />
                        <Award className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-2 uppercase tracking-wider">Pass Marks</label>
                    <input type="number" className="input-premium w-full" value={formData.passing_marks} onChange={e => update('passing_marks', e.target.value)} min={0} />
                </div>
            </div>
        </motion.div>
    )

    const renderStep1 = () => (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="space-y-4">
            <p className="text-text-secondary text-sm text-center mb-6">What type of questions will this exam have?</p>
            <div className="grid grid-cols-2 gap-4">
                {[
                    { type: 'mcq', icon: ListChecks, label: 'Multiple Choice', desc: 'Auto-graded MCQs with options' },
                    { type: 'subjective', icon: MessageSquare, label: 'Subjective', desc: 'Open-ended answers, AI-graded' }
                ].map(({ type, icon: Icon, label, desc }) => (
                    <button
                        key={type}
                        type="button"
                        onClick={() => {
                            setExamType(type)
                            setCurrentQuestion(prev => ({
                                ...prev,
                                question_type: type === 'mcq' ? 'objective' : 'subjective'
                            }))
                        }}
                        className={`relative p-6 rounded-2xl border text-left transition-all group ${examType === type
                                ? 'border-primary/30 bg-primary/[0.08] ring-1 ring-primary/20'
                                : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]'
                            }`}
                    >
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${examType === type ? 'bg-primary/20' : 'bg-white/[0.06]'
                            }`}>
                            <Icon className={`w-6 h-6 ${examType === type ? 'text-primary' : 'text-text-muted'}`} />
                        </div>
                        <h3 className="font-semibold text-white mb-1">{label}</h3>
                        <p className="text-xs text-text-muted">{desc}</p>
                        {examType === type && (
                            <motion.div layoutId="type-check" className="absolute top-3 right-3">
                                <CheckCircle2 className="w-5 h-5 text-primary" />
                            </motion.div>
                        )}
                    </button>
                ))}
            </div>
        </motion.div>
    )

    const renderStep2 = () => (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="space-y-4">
            <p className="text-text-secondary text-sm text-center mb-6">How do you want to add questions?</p>
            <div className="grid grid-cols-2 gap-4">
                {[
                    { source: 'ai', icon: Brain, label: 'AI Generate', desc: 'Upload a document and let AI create questions' },
                    { source: 'manual', icon: PenTool, label: 'Manual Entry', desc: 'Add questions yourself one by one' }
                ].map(({ source, icon: Icon, label, desc }) => (
                    <button
                        key={source}
                        type="button"
                        onClick={() => setQuestionSource(source)}
                        className={`relative p-6 rounded-2xl border text-left transition-all ${questionSource === source
                                ? 'border-primary/30 bg-primary/[0.08] ring-1 ring-primary/20'
                                : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]'
                            }`}
                    >
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${questionSource === source ? 'bg-primary/20' : 'bg-white/[0.06]'
                            }`}>
                            <Icon className={`w-6 h-6 ${questionSource === source ? 'text-primary' : 'text-text-muted'}`} />
                        </div>
                        <h3 className="font-semibold text-white mb-1">{label}</h3>
                        <p className="text-xs text-text-muted">{desc}</p>
                        {questionSource === source && (
                            <motion.div layoutId="source-check" className="absolute top-3 right-3">
                                <CheckCircle2 className="w-5 h-5 text-primary" />
                            </motion.div>
                        )}
                    </button>
                ))}
            </div>

            {/* AI-specific: file upload + config */}
            {questionSource === 'ai' && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-6 space-y-4">
                    <div
                        onDrop={handleDrop}
                        onDragOver={e => e.preventDefault()}
                        className={`border-2 border-dashed rounded-2xl p-8 text-center transition-colors cursor-pointer ${file ? 'border-success/30 bg-success/[0.04]' : 'border-white/10 hover:border-primary/30'
                            }`}
                        onClick={() => document.getElementById('file-input').click()}
                    >
                        <input id="file-input" type="file" className="hidden" accept=".pdf,.docx" onChange={handleFileInput} />
                        {file ? (
                            <div className="flex items-center justify-center gap-3">
                                <CheckCircle2 className="w-5 h-5 text-success" />
                                <span className="text-white font-medium">{file.name}</span>
                                <span className="text-xs text-text-muted">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                                <button onClick={e => { e.stopPropagation(); setFile(null) }} className="text-error hover:text-red-400 ml-2">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <div>
                                <Upload className="w-8 h-8 text-text-muted mx-auto mb-3" />
                                <p className="text-sm text-text-secondary">Drop a PDF or DOCX file here</p>
                                <p className="text-xs text-text-muted mt-1">or click to browse</p>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-text-secondary mb-2 uppercase tracking-wider">Number of Questions</label>
                            <input type="number" className="input-premium w-full" value={aiConfig.num_questions} onChange={e => setAiConfig(prev => ({ ...prev, num_questions: parseInt(e.target.value) || 5 }))} min={1} max={20} />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-text-secondary mb-2 uppercase tracking-wider">Difficulty</label>
                            <select className="input-premium w-full" value={aiConfig.difficulty} onChange={e => setAiConfig(prev => ({ ...prev, difficulty: e.target.value }))}>
                                <option value="easy">Easy</option>
                                <option value="medium">Medium</option>
                                <option value="hard">Hard</option>
                            </select>
                        </div>
                    </div>

                    {generating && (
                        <div className="space-y-2">
                            <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
                                <motion.div className="h-full bg-gradient-to-r from-primary to-purple-500 rounded-full" animate={{ width: `${uploadProgress}%` }} transition={{ duration: 0.3 }} />
                            </div>
                            <p className="text-xs text-text-muted text-center">
                                {uploadProgress < 70 ? 'Uploading document...' : uploadProgress < 95 ? 'AI is generating questions...' : 'Almost done...'}
                            </p>
                        </div>
                    )}
                </motion.div>
            )}
        </motion.div>
    )

    const renderStep3 = () => (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="space-y-6">
            {/* Question List */}
            {questions.length > 0 && (
                <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-2">
                    {questions.map((q, i) => (
                        <div key={i} className="glass rounded-xl p-4 border border-white/[0.06] group">
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Q{i + 1}</span>
                                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${q.question_type === 'objective' ? 'bg-blue-500/10 text-blue-400' : 'bg-purple-500/10 text-purple-400'
                                            }`}>
                                            {q.question_type === 'objective' ? 'MCQ' : 'Subjective'}
                                        </span>
                                        <span className="text-[10px] text-text-muted">{q.marks} marks</span>
                                    </div>
                                    <p className="text-sm text-white leading-relaxed">{q.question_text}</p>
                                    {q.question_type === 'objective' && q.options?.length > 0 && (
                                        <div className="mt-2 space-y-1">
                                            {q.options.map((opt, j) => (
                                                <div key={j} className={`text-xs px-2 py-1 rounded ${opt === q.correct_answer ? 'text-success bg-success/10' : 'text-text-muted'
                                                    }`}>
                                                    {String.fromCharCode(65 + j)}. {opt} {opt === q.correct_answer && '✓'}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <button onClick={() => removeQuestion(i)} className="text-text-muted hover:text-error transition-colors opacity-0 group-hover:opacity-100">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add Question Form (manual mode, or add more after AI) */}
            <div className="glass rounded-xl p-5 border border-white/[0.06] space-y-4">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <FilePlus className="w-4 h-4 text-primary" />
                    {questions.length > 0 ? 'Add Another Question' : 'Add a Question'}
                </h3>

                <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-2 uppercase tracking-wider">Question Text *</label>
                    <textarea
                        className="input-premium w-full resize-none"
                        rows={2}
                        placeholder="Enter your question..."
                        value={currentQuestion.question_text}
                        onChange={e => setCurrentQuestion(prev => ({ ...prev, question_text: e.target.value }))}
                    />
                </div>

                {examType === 'mcq' || currentQuestion.question_type === 'objective' ? (
                    <>
                        <div className="space-y-2">
                            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider">Options</label>
                            {currentQuestion.options.map((opt, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <span className="text-xs text-text-muted w-5">{String.fromCharCode(65 + i)}</span>
                                    <input
                                        type="text"
                                        className="input-premium flex-1"
                                        placeholder={`Option ${String.fromCharCode(65 + i)}`}
                                        value={opt}
                                        onChange={e => {
                                            const newOpts = [...currentQuestion.options]
                                            newOpts[i] = e.target.value
                                            setCurrentQuestion(prev => ({ ...prev, options: newOpts }))
                                        }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setCurrentQuestion(prev => ({ ...prev, correct_answer: opt }))}
                                        className={`text-xs px-2 py-1 rounded-lg transition-colors ${currentQuestion.correct_answer === opt && opt
                                                ? 'bg-success/20 text-success'
                                                : 'bg-white/[0.04] text-text-muted hover:text-white'
                                            }`}
                                    >
                                        {currentQuestion.correct_answer === opt && opt ? '✓ Correct' : 'Set Correct'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </>
                ) : (
                    <div>
                        <label className="block text-xs font-semibold text-text-secondary mb-2 uppercase tracking-wider">Model Answer (for AI grading)</label>
                        <textarea
                            className="input-premium w-full resize-none"
                            rows={3}
                            placeholder="The expected answer for AI grading reference..."
                            value={currentQuestion.model_answer}
                            onChange={e => setCurrentQuestion(prev => ({ ...prev, model_answer: e.target.value }))}
                        />
                    </div>
                )}

                <div className="flex items-center justify-between">
                    <div className="w-24">
                        <label className="block text-xs font-semibold text-text-secondary mb-1 uppercase tracking-wider">Marks</label>
                        <input
                            type="number"
                            className="input-premium w-full"
                            value={currentQuestion.marks}
                            onChange={e => setCurrentQuestion(prev => ({ ...prev, marks: parseFloat(e.target.value) || 1 }))}
                            min={0.5}
                            step={0.5}
                        />
                    </div>
                    <button
                        onClick={addQuestion}
                        disabled={!currentQuestion.question_text.trim()}
                        className="btn-primary-new px-4 py-2 text-sm font-semibold flex items-center gap-2 disabled:opacity-40"
                    >
                        <Plus className="w-4 h-4" /> Add
                    </button>
                </div>
            </div>
        </motion.div>
    )

    return (
        <DashboardLayout>
            <div className="max-w-2xl mx-auto py-8 px-4">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="font-display text-2xl font-bold text-white">Create Exam</h1>
                    <p className="text-sm text-text-muted mt-1">Set up your exam in a few steps</p>
                </div>

                {renderStepIndicator()}

                {error && (
                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-4 p-3 rounded-xl bg-error/10 border border-error/15 text-error text-sm font-medium flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        {error}
                    </motion.div>
                )}

                <div className="glass rounded-2xl p-6 border border-white/[0.06]">
                    <AnimatePresence mode="wait">
                        {step === 0 && renderStep0()}
                        {step === 1 && renderStep1()}
                        {step === 2 && renderStep2()}
                        {step === 3 && renderStep3()}
                    </AnimatePresence>
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-between mt-6">
                    <button
                        onClick={prevStep}
                        disabled={step === 0}
                        className="btn-ghost-new px-4 py-2 text-sm font-medium flex items-center gap-2 disabled:opacity-30"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back
                    </button>

                    {step < 3 ? (
                        <button
                            onClick={nextStep}
                            disabled={!canProceed() || loading || generating}
                            className="btn-primary-new px-6 py-2.5 text-sm font-semibold flex items-center gap-2 disabled:opacity-40"
                        >
                            {loading || generating ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    {generating ? 'Generating...' : 'Creating...'}
                                </>
                            ) : (
                                <>
                                    Next <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    ) : (
                        <button
                            onClick={handlePublish}
                            disabled={publishing || questions.length === 0}
                            className="btn-primary-new px-6 py-2.5 text-sm font-semibold flex items-center gap-2 disabled:opacity-40"
                        >
                            {publishing ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" /> Publishing...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-4 h-4" /> Publish Exam ({questions.length} questions)
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </DashboardLayout>
    )
}

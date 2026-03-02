import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import IntegrityBar from '../components/IntegrityBar'
import {
    Clock,
    ChevronLeft,
    ChevronRight,
    CheckCircle2,
    AlertCircle,
    Send,
    Loader2,
    ShieldCheck
} from 'lucide-react'

const API_URL = 'http://localhost:8000'

export default function ExamTakingPage() {
    const { examId } = useParams()
    const { token } = useAuth()
    const navigate = useNavigate()

    const [exam, setExam] = useState(null)
    const [questions, setQuestions] = useState([])
    const [answers, setAnswers] = useState({})
    const [currentQ, setCurrentQ] = useState(0)
    const [timeLeft, setTimeLeft] = useState(0)
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [violations, setViolations] = useState(0)
    const [submitted, setSubmitted] = useState(false)

    // Fetch exam data
    useEffect(() => {
        const fetchExam = async () => {
            try {
                const res = await fetch(`${API_URL}/api/exams/${examId}/take`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
                if (res.ok) {
                    const data = await res.json()
                    setExam(data.exam)
                    setQuestions(data.questions || [])
                    setTimeLeft((data.exam.duration_minutes || 30) * 60)

                    // Restore saved answers
                    const saved = localStorage.getItem(`exam_answers_${examId}`)
                    if (saved) setAnswers(JSON.parse(saved))
                }
            } catch (err) {
                console.error(err)
            } finally {
                setLoading(false)
            }
        }
        fetchExam()
    }, [examId, token])

    // Timer
    useEffect(() => {
        if (timeLeft <= 0 || submitted) return
        const interval = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    handleSubmit()
                    return 0
                }
                return prev - 1
            })
        }, 1000)
        return () => clearInterval(interval)
    }, [timeLeft, submitted])

    // Save answers
    useEffect(() => {
        if (Object.keys(answers).length > 0) {
            localStorage.setItem(`exam_answers_${examId}`, JSON.stringify(answers))
        }
    }, [answers, examId])

    // Fullscreen
    useEffect(() => {
        try {
            document.documentElement.requestFullscreen?.()
        } catch { }
        return () => {
            try { document.exitFullscreen?.() } catch { }
        }
    }, [])

    // Block copy/paste
    useEffect(() => {
        const block = (e) => e.preventDefault()
        document.addEventListener('copy', block)
        document.addEventListener('paste', block)
        document.addEventListener('cut', block)
        return () => {
            document.removeEventListener('copy', block)
            document.removeEventListener('paste', block)
            document.removeEventListener('cut', block)
        }
    }, [])

    const handleAnswer = (questionId, answer) => {
        setAnswers(prev => ({ ...prev, [questionId]: answer }))
    }

    const handleSubmit = useCallback(async () => {
        if (submitting || submitted) return
        setSubmitting(true)

        try {
            const formattedAnswers = questions.map(q => ({
                question_id: q.id,
                answer: answers[q.id] || ''
            }))

            await fetch(`${API_URL}/api/exams/${examId}/submit`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ answers: formattedAnswers, violations })
            })

            localStorage.removeItem(`exam_answers_${examId}`)
            setSubmitted(true)
            setTimeout(() => navigate('/student/dashboard'), 3000)
        } catch (err) {
            console.error(err)
        } finally {
            setSubmitting(false)
        }
    }, [answers, questions, examId, token, violations, submitting, submitted, navigate])

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60)
        const s = seconds % 60
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    }

    const question = questions[currentQ]
    const answeredCount = questions.filter(q => answers[q.id]).length
    const progress = questions.length > 0 ? (answeredCount / questions.length) * 100 : 0
    const isLowTime = timeLeft < 120

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    if (submitted) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-6">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bento-card !p-12 text-center max-w-md"
                >
                    <div className="w-16 h-16 rounded-2xl bg-success/10 flex items-center justify-center mx-auto mb-5">
                        <CheckCircle2 className="w-8 h-8 text-success" />
                    </div>
                    <h2 className="text-2xl font-display font-bold text-white mb-2">Exam Submitted</h2>
                    <p className="text-text-secondary text-sm mb-1">Your answers have been recorded.</p>
                    <p className="text-text-muted text-xs">Redirecting to dashboard...</p>
                </motion.div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background text-text-primary">
            <IntegrityBar violations={violations} onViolation={() => setViolations(v => v + 1)} />

            {/* Top Bar */}
            <div className="fixed top-0 left-0 right-0 z-40 bg-surface/95 backdrop-blur-xl border-b border-white/[0.04]">
                <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <ShieldCheck className="w-4 h-4 text-primary" />
                        <span className="font-semibold text-white text-sm truncate max-w-[200px]">{exam?.title}</span>
                    </div>

                    {/* Timer */}
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl font-mono text-sm font-bold ${isLowTime
                        ? 'bg-error/10 text-error border border-error/15 animate-pulse'
                        : 'bg-surface-elevated text-white border border-white/[0.06]'
                        }`}>
                        <Clock className="w-3.5 h-3.5" />
                        {formatTime(timeLeft)}
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="btn-primary-new px-4 py-2 text-xs font-semibold"
                    >
                        {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><Send className="w-3.5 h-3.5 mr-1" /> Submit</>}
                    </button>
                </div>

                {/* Progress Bar */}
                <div className="h-[2px] bg-white/[0.03]">
                    <motion.div
                        className="h-full bg-gradient-to-r from-primary to-primary-glow"
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.3 }}
                    />
                </div>
            </div>

            {/* Main Content */}
            <div className="pt-20 pb-8 px-4">
                <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_200px] gap-6">

                    {/* Question Area */}
                    <div>
                        <AnimatePresence mode="wait">
                            {question && (
                                <motion.div
                                    key={question.id}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.2 }}
                                    className="bento-card"
                                >
                                    {/* Question Header */}
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center gap-3">
                                            <span className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                                                {currentQ + 1}
                                            </span>
                                            <span className="badge bg-white/[0.04] text-text-muted border border-white/[0.06]">
                                                {question.question_type === 'objective' ? 'MCQ' : 'Written'}
                                            </span>
                                        </div>
                                        <span className="text-xs text-text-muted">{question.marks || 1} mark{(question.marks || 1) > 1 ? 's' : ''}</span>
                                    </div>

                                    {/* Question Text */}
                                    <p className="text-white font-medium mb-6 leading-relaxed">
                                        {question.question_text}
                                    </p>

                                    {/* Answer Input */}
                                    {question.question_type === 'objective' ? (
                                        <div className="space-y-2.5">
                                            {(Array.isArray(question.options) ? question.options : Object.values(question.options || {})).map((option, i) => {
                                                const isSelected = answers[question.id] === option
                                                return (
                                                    <button
                                                        key={i}
                                                        onClick={() => handleAnswer(question.id, option)}
                                                        className={`w-full text-left p-4 rounded-xl border transition-all duration-200 flex items-center gap-3 ${isSelected
                                                            ? 'border-primary/30 bg-primary/[0.08] text-white'
                                                            : 'border-white/[0.06] bg-white/[0.02] text-text-secondary hover:bg-white/[0.04] hover:border-white/[0.10]'
                                                            }`}
                                                    >
                                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${isSelected
                                                            ? 'border-primary bg-primary'
                                                            : 'border-white/20'
                                                            }`}>
                                                            {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                                                        </div>
                                                        <span className="text-sm">{option}</span>
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    ) : (
                                        <textarea
                                            className="input-premium w-full min-h-[150px] resize-none"
                                            placeholder="Write your answer here..."
                                            value={answers[question.id] || ''}
                                            onChange={(e) => handleAnswer(question.id, e.target.value)}
                                        />
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Navigation */}
                        <div className="flex items-center justify-between mt-5">
                            <button
                                onClick={() => setCurrentQ(Math.max(0, currentQ - 1))}
                                disabled={currentQ === 0}
                                className="btn-ghost-new px-4 py-2.5 text-sm flex items-center gap-1.5 disabled:opacity-30"
                            >
                                <ChevronLeft className="w-4 h-4" /> Previous
                            </button>
                            <span className="text-xs text-text-muted">
                                {currentQ + 1} of {questions.length}
                            </span>
                            <button
                                onClick={() => setCurrentQ(Math.min(questions.length - 1, currentQ + 1))}
                                disabled={currentQ === questions.length - 1}
                                className="btn-ghost-new px-4 py-2.5 text-sm flex items-center gap-1.5 disabled:opacity-30"
                            >
                                Next <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Question Map */}
                    <div className="hidden lg:block">
                        <div className="bento-card !p-4 sticky top-24">
                            <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Questions</h4>
                            <div className="grid grid-cols-4 gap-1.5">
                                {questions.map((q, i) => (
                                    <button
                                        key={q.id}
                                        onClick={() => setCurrentQ(i)}
                                        className={`w-full aspect-square rounded-lg text-[11px] font-bold flex items-center justify-center transition-all ${i === currentQ
                                            ? 'bg-primary text-white ring-2 ring-primary/30'
                                            : answers[q.id]
                                                ? 'bg-success/15 text-success border border-success/10'
                                                : 'bg-white/[0.03] text-text-muted border border-white/[0.04] hover:bg-white/[0.06]'
                                            }`}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                            </div>
                            <div className="mt-4 pt-3 border-t border-white/[0.04] space-y-2">
                                <div className="flex items-center gap-2 text-[10px]">
                                    <div className="w-3 h-3 rounded bg-success/15 border border-success/10" />
                                    <span className="text-text-muted">Answered ({answeredCount})</span>
                                </div>
                                <div className="flex items-center gap-2 text-[10px]">
                                    <div className="w-3 h-3 rounded bg-white/[0.03] border border-white/[0.04]" />
                                    <span className="text-text-muted">Unanswered ({questions.length - answeredCount})</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

import { useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import DashboardLayout from '../components/DashboardLayout'
import {
    FileText,
    Brain,
    Sparkles,
    CheckCircle2,
    Loader2,
    RefreshCw,
    ArrowRight
} from 'lucide-react'

export default function AIGenerationView() {
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()

    const [stage, setStage] = useState(0)
    const [isGenerating, setIsGenerating] = useState(false)
    const [generatedQuestions, setGeneratedQuestions] = useState([])

    const stages = [
        { label: 'Analyzing Context', icon: FileText, description: 'Reading your uploaded materials' },
        { label: 'Extracting Knowledge', icon: Brain, description: 'Identifying key concepts' },
        { label: 'Synthesizing Questions', icon: Sparkles, description: 'Generating relevant questions' },
        { label: 'Validating Output', icon: CheckCircle2, description: 'Quality checking results' },
    ]

    const startGeneration = () => {
        setIsGenerating(true)
        setStage(0)

        let currentStage = 0
        const interval = setInterval(() => {
            currentStage++
            if (currentStage < stages.length) {
                setStage(currentStage)
            } else {
                clearInterval(interval)
                setGeneratedQuestions([
                    { id: 1, type: 'objective', text: 'What is the primary purpose of encapsulation?', difficulty: 'medium' },
                    { id: 2, type: 'objective', text: 'Which sorting algorithm is O(n log n)?', difficulty: 'easy' },
                    { id: 3, type: 'subjective', text: 'Explain polymorphism in your own words.', difficulty: 'hard' },
                ])
                setIsGenerating(false)
            }
        }, 2000)
    }

    const getDifficultyStyles = (d) => {
        switch (d) {
            case 'easy': return 'bg-success/10 text-success border-success/10'
            case 'medium': return 'bg-warning/10 text-warning border-warning/10'
            case 'hard': return 'bg-error/10 text-error border-error/10'
            default: return 'bg-primary/10 text-primary border-primary/10'
        }
    }

    return (
        <DashboardLayout>
            <div className="max-w-3xl mx-auto">
                {!isGenerating && generatedQuestions.length === 0 ? (
                    /* === Initial State === */
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center py-20"
                    >
                        <div className="w-20 h-20 mx-auto mb-8 rounded-2xl bg-primary/10 border border-primary/10 flex items-center justify-center">
                            <Sparkles className="w-10 h-10 text-primary" />
                        </div>

                        <h1 className="text-3xl md:text-4xl font-display font-bold text-white mb-3">
                            AI Question Generator
                        </h1>
                        <p className="text-text-secondary text-lg mb-10 max-w-md mx-auto">
                            Transform your documents into high-quality exam questions instantly.
                        </p>

                        <button
                            onClick={startGeneration}
                            className="btn-primary-new px-8 py-3.5 text-base font-semibold group mx-auto"
                        >
                            Start Generation
                            <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </motion.div>

                ) : isGenerating ? (
                    /* === Generating === */
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="py-20"
                    >
                        <div className="text-center mb-12">
                            <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-surface-elevated border border-white/[0.06] flex items-center justify-center relative overflow-hidden">
                                <div className="absolute inset-0 bg-primary/[0.03] animate-pulse" />
                                {(() => {
                                    const CurrentIcon = stages[stage]?.icon || Loader2
                                    return <CurrentIcon className={`w-7 h-7 text-white relative z-10 ${stages[stage] ? '' : 'animate-spin'}`} />
                                })()}
                            </div>
                            <h2 className="text-xl font-display font-bold text-white mb-1">{stages[stage]?.label}</h2>
                            <p className="text-sm text-text-muted">{stages[stage]?.description}</p>
                        </div>

                        <div className="max-w-sm mx-auto space-y-2">
                            {stages.map((s, i) => (
                                <div
                                    key={s.label}
                                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-300 ${i === stage
                                        ? 'bg-primary/[0.06] border-primary/15'
                                        : i < stage
                                            ? 'bg-success/[0.04] border-success/10'
                                            : 'bg-white/[0.02] border-white/[0.04]'
                                        }`}
                                >
                                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold transition-all ${i < stage
                                        ? 'bg-success/15 text-success'
                                        : i === stage
                                            ? 'bg-primary text-white animate-pulse-ring'
                                            : 'bg-white/[0.04] text-text-muted'
                                        }`}>
                                        {i < stage ? <CheckCircle2 className="w-3.5 h-3.5" /> : i === stage ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : i + 1}
                                    </div>
                                    <div className="flex-1">
                                        <span className={`text-sm font-medium ${i <= stage ? 'text-white' : 'text-text-muted'}`}>
                                            {s.label}
                                        </span>
                                    </div>
                                    {i < stage && <span className="text-[10px] text-success font-bold">Done</span>}
                                </div>
                            ))}
                        </div>
                    </motion.div>

                ) : (
                    /* === Results === */
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-xl font-display font-bold text-white">Generated Questions</h2>
                                <p className="text-sm text-text-muted">{generatedQuestions.length} questions generated</p>
                            </div>
                            <button
                                className="btn-ghost-new px-4 py-2 text-sm flex items-center gap-2"
                                onClick={() => setGeneratedQuestions([])}
                            >
                                <RefreshCw className="w-3.5 h-3.5" />
                                Reset
                            </button>
                        </div>

                        <div className="space-y-3">
                            {generatedQuestions.map((q, i) => (
                                <motion.div
                                    key={q.id}
                                    className="bento-card !p-5 flex items-start gap-4 group"
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.08 }}
                                >
                                    <span className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                                        {i + 1}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-white text-sm mb-2 leading-relaxed">{q.text}</p>
                                        <div className="flex gap-2">
                                            <span className="badge bg-primary/10 text-primary border border-primary/10 capitalize">{q.type}</span>
                                            <span className={`badge border capitalize ${getDifficultyStyles(q.difficulty)}`}>{q.difficulty}</span>
                                        </div>
                                    </div>
                                    <button className="text-text-muted hover:text-success transition-colors opacity-0 group-hover:opacity-100">
                                        <CheckCircle2 className="w-5 h-5" />
                                    </button>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </div>
        </DashboardLayout>
    )
}

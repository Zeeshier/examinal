import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
    ShieldCheck,
    Monitor,
    EyeOff,
    Clock,
    AlertTriangle,
    ArrowLeft,
    ArrowRight,
    CheckCircle2
} from 'lucide-react'

export default function ExamStart() {
    const { examId } = useParams()
    const navigate = useNavigate()

    const rules = [
        { icon: Monitor, text: 'The exam will enter fullscreen mode automatically' },
        { icon: EyeOff, text: 'Tab switching and window changes are monitored' },
        { icon: ShieldCheck, text: 'Copy, paste, and cut actions are disabled' },
        { icon: AlertTriangle, text: '3 violations will auto-submit your exam' },
        { icon: Clock, text: 'Your answers are auto-saved periodically' },
    ]

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden">
            {/* Ambient */}
            <div className="aurora-blob w-[400px] h-[400px] bg-primary/15 top-[-15%] right-[-10%]" />
            <div className="aurora-blob w-[300px] h-[300px] bg-purple-600/10 bottom-[-10%] left-[-5%]" style={{ animationDelay: '2s' }} />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-lg w-full relative z-10"
            >
                <div className="bento-card !p-8 text-center">
                    {/* Icon */}
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/10 flex items-center justify-center mx-auto mb-6">
                        <ShieldCheck className="w-8 h-8 text-primary" />
                    </div>

                    <h1 className="text-2xl font-display font-bold text-white mb-2">Before You Begin</h1>
                    <p className="text-text-secondary text-sm mb-8">Please review the exam rules below</p>

                    {/* Rules */}
                    <div className="space-y-3 text-left mb-8">
                        {rules.map((rule, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -12 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2 + i * 0.08 }}
                                className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]"
                            >
                                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                    <rule.icon className="w-4 h-4 text-primary" />
                                </div>
                                <span className="text-sm text-text-secondary">{rule.text}</span>
                            </motion.div>
                        ))}
                    </div>

                    {/* Acknowledgment */}
                    <p className="text-xs text-text-muted mb-6 leading-relaxed">
                        By clicking "Start Exam", you agree to maintain academic integrity throughout the assessment.
                    </p>

                    {/* Actions */}
                    <div className="flex gap-3">
                        <Link to="/student/dashboard" className="flex-1">
                            <button className="btn-ghost-new w-full py-3 text-sm flex items-center justify-center gap-2">
                                <ArrowLeft className="w-4 h-4" /> Go Back
                            </button>
                        </Link>
                        <button
                            onClick={() => navigate(`/student/exam/${examId}`)}
                            className="flex-1 btn-primary-new py-3 text-sm font-semibold flex items-center justify-center gap-2 group"
                        >
                            Start Exam
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    )
}

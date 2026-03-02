import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import DashboardLayout from '../components/DashboardLayout'
import GlowButton from '../components/GlowButton'
import QuickInsights from '../components/QuickInsights'
import { SkeletonCard } from '../components/SkeletonPulse'
import {
    FileText,
    CheckCircle2,
    Edit3,
    Sparkles,
    Plus,
    Clock,
    BookOpen,
    BarChart3,
    ArrowRight
} from 'lucide-react'

const API_URL = 'http://localhost:8000'

export default function InstructorDashboard() {
    const { token, user } = useAuth()
    const [exams, setExams] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchExams()
    }, [])

    const fetchExams = async () => {
        try {
            const res = await fetch(`${API_URL}/api/exams/`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            if (res.ok) setExams(await res.json())
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const handlePublish = async (examId) => {
        try {
            const res = await fetch(`${API_URL}/api/exams/${examId}/publish`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            })
            if (res.ok) fetchExams()
        } catch (err) {
            console.error(err)
        }
    }

    const getGreeting = () => {
        const hour = new Date().getHours()
        if (hour < 12) return 'Good morning'
        if (hour < 17) return 'Good afternoon'
        return 'Good evening'
    }

    const published = exams.filter(e => e.is_published).length
    const drafts = exams.filter(e => !e.is_published).length

    const stats = [
        { label: 'Total Exams', value: exams.length, icon: BookOpen, color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/10' },
        { label: 'Published', value: published, icon: CheckCircle2, color: 'text-success', bg: 'bg-success/10', border: 'border-success/10' },
        { label: 'Drafts', value: drafts, icon: Edit3, color: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/10' },
    ]

    return (
        <DashboardLayout>
            {/* Greeting Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
                <div>
                    <motion.h1
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-2xl md:text-3xl font-display font-bold text-white mb-1"
                    >
                        {getGreeting()}, <span className="text-gradient-primary">{user?.full_name || user?.username}</span>
                    </motion.h1>
                    <p className="text-text-muted text-sm">
                        {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                    </p>
                </div>
                <Link to="/instructor/create-exam">
                    <GlowButton icon={<Plus className="w-4 h-4" />} size="md">
                        New Exam
                    </GlowButton>
                </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-3 space-y-6">
                    {/* Stat Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {stats.map((stat, i) => (
                            <motion.div
                                key={stat.label}
                                className="bento-card !p-5 flex items-center justify-between"
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                            >
                                <div>
                                    <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">{stat.label}</p>
                                    <p className="text-3xl font-display font-bold text-white mt-1">{stat.value}</p>
                                </div>
                                <div className={`p-2.5 rounded-xl ${stat.bg} ${stat.color} border ${stat.border}`}>
                                    <stat.icon className="w-5 h-5" />
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Recent Exams */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-white">Recent Exams</h2>
                            <span className="text-xs text-text-muted">{exams.length} total</span>
                        </div>

                        {loading ? (
                            <div className="space-y-4">
                                {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
                            </div>
                        ) : exams.length === 0 ? (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="bento-card !p-12 text-center"
                            >
                                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                                    <FileText className="w-7 h-7 text-primary" />
                                </div>
                                <h3 className="text-lg font-semibold text-white mb-2">No exams yet</h3>
                                <p className="text-text-muted text-sm mb-6">Create your first AI-powered exam</p>
                                <Link to="/instructor/create-exam">
                                    <GlowButton icon={<Plus className="w-4 h-4" />}>
                                        Create Exam
                                    </GlowButton>
                                </Link>
                            </motion.div>
                        ) : (
                            <div className="space-y-3">
                                {exams.map((exam, index) => (
                                    <motion.div
                                        key={exam.id}
                                        className="bento-card !p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 group"
                                        initial={{ opacity: 0, y: 12 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.03 }}
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${exam.is_published
                                                ? 'bg-success/10 text-success border-success/10'
                                                : 'bg-warning/10 text-warning border-warning/10'
                                                }`}>
                                                {exam.is_published ? <CheckCircle2 className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <h3 className="font-semibold text-white group-hover:text-primary transition-colors text-sm truncate">
                                                    {exam.title}
                                                </h3>
                                                <div className="flex items-center gap-3 mt-1 text-xs text-text-muted">
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        {exam.duration_minutes}m
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <BarChart3 className="w-3 h-3" />
                                                        {exam.total_marks} marks
                                                    </span>
                                                    <span className={`badge ${exam.is_published ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
                                                        {exam.is_published ? 'Published' : 'Draft'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 shrink-0">
                                            {!exam.is_published && (
                                                <button
                                                    onClick={() => handlePublish(exam.id)}
                                                    className="btn-primary-new px-3 py-1.5 text-xs flex items-center gap-1.5"
                                                >
                                                    Publish <ArrowRight className="w-3 h-3" />
                                                </button>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar */}
                <div className="lg:col-span-1">
                    <QuickInsights />
                </div>
            </div>
        </DashboardLayout>
    )
}

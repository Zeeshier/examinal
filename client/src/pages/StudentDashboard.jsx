import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import DashboardLayout from '../components/DashboardLayout'
import { SkeletonCard } from '../components/SkeletonPulse'
import {
    FileText,
    Clock,
    BarChart3,
    ArrowRight,
    Search,
    BookOpen,
    Loader2
} from 'lucide-react'

const API_URL = 'http://localhost:8000'

export default function StudentDashboard() {
    const { token } = useAuth()
    const [exams, setExams] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [search, setSearch] = useState('')

    useEffect(() => {
        fetchExams()
    }, [])

    const fetchExams = async () => {
        try {
            const res = await fetch(`${API_URL}/api/exams/published`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            if (res.ok) {
                setExams(await res.json())
            } else {
                setError('Failed to load exams')
            }
        } catch {
            setError('Unable to connect to server')
        } finally {
            setLoading(false)
        }
    }

    const filtered = exams.filter(e =>
        e.title?.toLowerCase().includes(search.toLowerCase()) ||
        e.description?.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <DashboardLayout>
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
                <div>
                    <motion.h1
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-2xl md:text-3xl font-display font-bold text-white mb-1"
                    >
                        Available Exams
                    </motion.h1>
                    <p className="text-text-muted text-sm">
                        {filtered.length} exam{filtered.length !== 1 ? 's' : ''} available
                    </p>
                </div>

                {/* Search */}
                <div className="relative w-full md:w-72">
                    <input
                        type="text"
                        className="input-premium pl-9 w-full text-sm"
                        placeholder="Search exams..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
            </div>

            {error && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bento-card !p-4 mb-6 bg-error/[0.06] border-error/10 text-error text-sm font-medium"
                >
                    {error}
                </motion.div>
            )}

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {[1, 2, 3, 4, 5, 6].map(i => <SkeletonCard key={i} />)}
                </div>
            ) : filtered.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bento-card !p-16 text-center"
                >
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
                        <BookOpen className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">
                        {search ? 'No matching exams' : 'No exams available'}
                    </h3>
                    <p className="text-text-muted text-sm">
                        {search ? 'Try a different search term' : 'Check back later for new assessments'}
                    </p>
                </motion.div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filtered.map((exam, index) => (
                        <motion.div
                            key={exam.id}
                            className="bento-card group h-full flex flex-col"
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.04 }}
                        >
                            {/* Header */}
                            <div className="flex items-start justify-between mb-4">
                                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-300">
                                    <FileText className="w-4 h-4" />
                                </div>
                                <span className="badge bg-success/10 text-success border border-success/10 text-[10px]">Open</span>
                            </div>

                            {/* Title */}
                            <h3 className="text-base font-semibold text-white mb-2 line-clamp-1 group-hover:text-primary transition-colors">
                                {exam.title}
                            </h3>

                            {/* Description */}
                            {exam.description && (
                                <p className="text-sm text-text-secondary mb-auto line-clamp-2 leading-relaxed flex-1">
                                    {exam.description}
                                </p>
                            )}

                            {/* Metadata & CTA */}
                            <div className="pt-4 mt-4 border-t border-white/[0.04]">
                                <div className="flex items-center justify-between text-xs text-text-muted mb-3">
                                    <span className="flex items-center gap-1.5">
                                        <Clock className="w-3 h-3" />
                                        {exam.duration_minutes} min
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <BarChart3 className="w-3 h-3" />
                                        {exam.total_marks} marks
                                    </span>
                                </div>
                                <Link to={`/student/exam/${exam.id}/start`} className="block">
                                    <button className="btn-primary-new w-full py-2.5 text-xs font-semibold group/btn">
                                        Start Assessment
                                        <ArrowRight className="w-3 h-3 ml-1.5 group-hover/btn:translate-x-0.5 transition-transform" />
                                    </button>
                                </Link>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </DashboardLayout>
    )
}

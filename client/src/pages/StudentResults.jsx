import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import DashboardLayout from '../components/DashboardLayout'
import { Bar, Doughnut } from 'react-chartjs-2'
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
} from 'chart.js'
import {
    Trophy,
    Target,
    TrendingUp,
    BookOpen,
    Loader2
} from 'lucide-react'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement)

const API_URL = 'http://localhost:8000'

export default function StudentResults() {
    const { token } = useAuth()
    const [stats, setStats] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchStats()
    }, [])

    const fetchStats = async () => {
        try {
            const res = await fetch(`${API_URL}/api/exams/results/stats`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            if (res.ok) setStats(await res.json())
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    if (loading) return (
        <DashboardLayout>
            <div className="flex h-96 items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        </DashboardLayout>
    )

    if (!stats) return null

    const performanceData = {
        labels: stats.recent_performance.map(r => r.exam_title || 'Exam'),
        datasets: [{
            label: 'Your Score (%)',
            data: stats.recent_performance.map(r => r.score_percent),
            backgroundColor: 'rgba(99, 102, 241, 0.7)',
            borderRadius: 8,
            borderSkipped: false,
        }, {
            label: 'Class Average',
            data: stats.recent_performance.map(() => 75),
            backgroundColor: 'rgba(255, 255, 255, 0.06)',
            borderRadius: 8,
            borderSkipped: false,
        }]
    }

    const topicData = {
        labels: ['Objective', 'Subjective'],
        datasets: [{
            data: [85, 62],
            backgroundColor: ['rgba(99, 102, 241, 0.8)', 'rgba(168, 85, 247, 0.8)'],
            borderWidth: 0,
            hoverOffset: 4,
        }]
    }

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    color: '#9494A8',
                    font: { family: 'Inter', size: 11 },
                    padding: 16,
                    usePointStyle: true,
                    pointStyleWidth: 8,
                }
            }
        },
        scales: {
            y: {
                grid: { color: 'rgba(255,255,255,0.03)', drawBorder: false },
                ticks: { color: '#5C5C72', font: { size: 11 } },
                border: { display: false },
            },
            x: {
                grid: { display: false },
                ticks: { color: '#5C5C72', font: { size: 11 } },
                border: { display: false },
            }
        }
    }

    const kpis = [
        { label: 'Avg Score', value: `${stats.average_score}%`, icon: Trophy, color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/10', trend: '+12%' },
        { label: 'Exams Taken', value: stats.total_exams_taken, icon: BookOpen, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/10' },
        { label: 'Strongest', value: 'Algorithms', icon: Target, color: 'text-pink-400', bg: 'bg-pink-500/10', border: 'border-pink-500/10' },
        { label: 'Focus Area', value: 'Dynamic Prog.', icon: TrendingUp, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/10' },
    ]

    return (
        <DashboardLayout>
            {/* Header */}
            <div className="mb-8">
                <motion.h1
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-2xl md:text-3xl font-display font-bold text-white mb-1"
                >
                    Performance Analytics
                </motion.h1>
                <p className="text-text-muted text-sm">Track your progress and AI-driven insights</p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {kpis.map((kpi, i) => (
                    <motion.div
                        key={kpi.label}
                        className="bento-card !p-5"
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className={`p-2 rounded-xl ${kpi.bg} ${kpi.color} border ${kpi.border}`}>
                                <kpi.icon className="w-5 h-5" />
                            </div>
                            {kpi.trend && (
                                <span className="badge bg-success/10 text-success border border-success/10 text-[10px]">
                                    {kpi.trend}
                                </span>
                            )}
                        </div>
                        <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">{kpi.label}</p>
                        <h3 className="text-2xl font-display font-bold text-white mt-1 truncate">{kpi.value}</h3>
                    </motion.div>
                ))}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <motion.div
                    className="lg:col-span-2 bento-card !p-6"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    <h3 className="text-base font-semibold text-white mb-6">Score Trajectory</h3>
                    <div className="h-[280px]">
                        <Bar data={performanceData} options={chartOptions} />
                    </div>
                </motion.div>

                <motion.div
                    className="lg:col-span-1 bento-card !p-6"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                >
                    <h3 className="text-base font-semibold text-white mb-6">Topic Breakdown</h3>
                    <div className="h-[280px] flex items-center justify-center">
                        <Doughnut
                            data={topicData}
                            options={{
                                cutout: '72%',
                                maintainAspectRatio: false,
                                plugins: {
                                    legend: {
                                        position: 'bottom',
                                        labels: {
                                            color: '#F0F0F5',
                                            font: { family: 'Inter', size: 11 },
                                            padding: 16,
                                            usePointStyle: true,
                                            pointStyleWidth: 8,
                                        }
                                    }
                                }
                            }}
                        />
                    </div>
                </motion.div>
            </div>

            {/* Feedback Table */}
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
            >
                <h3 className="text-base font-semibold text-white mb-4">Recent Feedback</h3>
                <div className="bento-card !p-0 overflow-hidden">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-white/[0.04]">
                                <th className="p-4 text-[10px] font-semibold text-text-muted uppercase tracking-wider">Exam</th>
                                <th className="p-4 text-[10px] font-semibold text-text-muted uppercase tracking-wider">Date</th>
                                <th className="p-4 text-[10px] font-semibold text-text-muted uppercase tracking-wider">Score</th>
                                <th className="p-4 text-[10px] font-semibold text-text-muted uppercase tracking-wider hidden md:table-cell">AI Insight</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.03]">
                            {stats.recent_performance.length > 0 ? stats.recent_performance.map((res, i) => (
                                <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                                    <td className="p-4 font-medium text-white text-sm">{res.exam_title}</td>
                                    <td className="p-4 text-text-muted text-sm">{res.date}</td>
                                    <td className="p-4">
                                        <span className={`badge border ${res.score_percent >= 80
                                            ? 'bg-success/10 text-success border-success/10'
                                            : res.score_percent >= 60
                                                ? 'bg-warning/10 text-warning border-warning/10'
                                                : 'bg-error/10 text-error border-error/10'
                                            }`}>
                                            {res.score_percent.toFixed(1)}%
                                        </span>
                                    </td>
                                    <td className="p-4 text-sm text-text-muted truncate max-w-xs hidden md:table-cell">
                                        Great improvement in Data Structures...
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={4} className="p-12 text-center text-text-muted text-sm">
                                        No exams taken yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </motion.div>
        </DashboardLayout>
    )
}

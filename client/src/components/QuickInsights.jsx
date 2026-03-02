import { motion } from 'framer-motion'
import {
    TrendingUp,
    Activity,
    AlertTriangle,
    Clock,
    Sparkles
} from 'lucide-react'

export default function QuickInsights({ insights = [], loading = false }) {
    const data = insights

    const getSeverityStyles = (severity) => {
        switch (severity) {
            case 'high': return { text: 'text-error', bg: 'bg-error/10', border: 'border-error/10', bar: 'bg-error' }
            case 'medium': return { text: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/10', bar: 'bg-warning' }
            case 'low': return { text: 'text-success', bg: 'bg-success/10', border: 'border-success/10', bar: 'bg-success' }
            default: return { text: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/10', bar: 'bg-primary' }
        }
    }

    const getIcon = (type) => {
        switch (type) {
            case 'weak_point': return AlertTriangle
            case 'behavior': return Clock
            case 'improvement': return TrendingUp
            default: return Activity
        }
    }

    if (loading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="h-24 rounded-xl skeleton-glow" />
                ))}
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Activity className="w-4 h-4 text-primary" />
                    AI Insights
                </h3>
                <span className="badge bg-primary/10 text-primary border border-primary/10">
                    <Sparkles className="w-3 h-3" />
                    Live
                </span>
            </div>

            {data.map((insight, index) => {
                const Icon = getIcon(insight.type)
                const styles = getSeverityStyles(insight.severity)
                return (
                    <motion.div
                        key={insight.id}
                        className="bento-card !p-4 !rounded-xl"
                        initial={{ opacity: 0, x: -16 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                    >
                        <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-lg ${styles.bg} ${styles.text} border ${styles.border}`}>
                                <Icon className="w-3.5 h-3.5" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                    <h4 className="font-semibold text-white truncate text-sm">{insight.title}</h4>
                                    <span className={`text-xs font-bold ${styles.text}`}>{insight.percentage}%</span>
                                </div>
                                <p className="text-xs text-text-muted line-clamp-1">{insight.description}</p>
                            </div>
                        </div>

                        <div className="mt-3 h-1 rounded-full bg-white/[0.04] overflow-hidden">
                            <motion.div
                                className={`h-full rounded-full ${styles.bar}`}
                                initial={{ width: 0 }}
                                animate={{ width: `${insight.percentage}%` }}
                                transition={{ duration: 0.8, delay: index * 0.1 + 0.2, ease: [0.4, 0, 0.2, 1] }}
                            />
                        </div>
                    </motion.div>
                )
            })}
        </div>
    )
}

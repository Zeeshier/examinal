import { motion } from 'framer-motion'

export function SkeletonBox({ className = '', rows = 1 }) {
    return (
        <div className={`space-y-3 ${className}`}>
            {Array.from({ length: rows }).map((_, i) => (
                <div
                    key={i}
                    className="skeleton-glow h-4 rounded-lg"
                    style={{ width: `${100 - (i * 12) % 35}%` }}
                />
            ))}
        </div>
    )
}

export function SkeletonCard({ className = '' }) {
    return (
        <motion.div
            className={`card-premium ${className}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
        >
            <div className="space-y-4">
                <div className="flex items-center gap-4">
                    <div className="skeleton-glow w-12 h-12 rounded-xl" />
                    <div className="flex-1 space-y-2">
                        <div className="skeleton-glow h-4 w-3/4 rounded-lg" />
                        <div className="skeleton-glow h-3 w-1/2 rounded-lg" />
                    </div>
                </div>
                <SkeletonBox rows={3} />
            </div>
        </motion.div>
    )
}

export function ProgressTrail({ className = '' }) {
    return (
        <motion.div
            className={`h-1 rounded-full bg-gradient-to-r from-primary via-primary-glow to-primary ${className}`}
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ duration: 0.5 }}
            style={{ transformOrigin: 'left' }}
        />
    )
}

export default function SkeletonPulse({
    type = 'box',
    count = 1,
    className = ''
}) {
    if (type === 'card') {
        return (
            <div className={`grid gap-4 ${className}`}>
                {Array.from({ length: count }).map((_, i) => (
                    <SkeletonCard key={i} />
                ))}
            </div>
        )
    }

    return <SkeletonBox className={className} rows={count} />
}

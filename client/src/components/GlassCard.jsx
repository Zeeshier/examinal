import { motion } from 'framer-motion'

export default function GlassCard({
    children,
    className = '',
    variant = 'bento',
    hover = true,
    onClick,
    ...props
}) {
    return (
        <motion.div
            className={`${variant === 'glass' ? 'glass rounded-2xl' : 'bento-card'} ${className}`}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            whileHover={hover ? {
                y: -3,
                transition: { duration: 0.25 }
            } : {}}
            onClick={onClick}
            {...props}
        >
            {children}
        </motion.div>
    )
}

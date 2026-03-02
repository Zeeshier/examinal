import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'

const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2.5 text-sm gap-2',
    lg: 'px-6 py-3.5 text-base gap-2.5',
}

export default function GlowButton({
    children,
    variant = 'primary',
    size = 'md',
    className = '',
    disabled = false,
    loading = false,
    icon,
    onClick,
    type = 'button',
    ...props
}) {
    const variantClass = variant === 'ghost'
        ? 'btn-ghost-new'
        : variant === 'danger'
            ? 'btn-danger-new'
            : 'btn-primary-new'

    return (
        <motion.button
            type={type}
            className={`${variantClass} ${sizeClasses[size]} ${disabled || loading ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''} ${className}`}
            disabled={disabled || loading}
            onClick={onClick}
            whileHover={!disabled && !loading ? { scale: 1.02 } : {}}
            whileTap={!disabled && !loading ? { scale: 0.98 } : {}}
            transition={{ duration: 0.15 }}
            {...props}
        >
            {loading ? (
                <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Loading...</span>
                </>
            ) : (
                <>
                    {icon && <span className="flex items-center">{icon}</span>}
                    {children}
                </>
            )}
        </motion.button>
    )
}

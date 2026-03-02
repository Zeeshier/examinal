import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShieldCheck, ShieldAlert } from 'lucide-react'

export default function IntegrityBar({ violations = 0, onViolation }) {
    const [isSecure, setIsSecure] = useState(true)
    const [violationCount, setViolationCount] = useState(violations)
    const [showWarning, setShowWarning] = useState(false)

    useEffect(() => {
        setViolationCount(violations)
    }, [violations])

    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden) {
                setIsSecure(false)
                setViolationCount(prev => prev + 1)
                setShowWarning(true)
                onViolation?.()
                setTimeout(() => setShowWarning(false), 3000)
            }
        }

        const handleBlur = () => {
            setIsSecure(false)
            setViolationCount(prev => prev + 1)
            setShowWarning(true)
            onViolation?.()
            setTimeout(() => setShowWarning(false), 3000)
        }

        const handleFocus = () => {
            setTimeout(() => setIsSecure(true), 1000)
        }

        document.addEventListener('visibilitychange', handleVisibilityChange)
        window.addEventListener('blur', handleBlur)
        window.addEventListener('focus', handleFocus)

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange)
            window.removeEventListener('blur', handleBlur)
            window.removeEventListener('focus', handleFocus)
        }
    }, [onViolation])

    return (
        <>
            {/* Top Integrity Line */}
            <motion.div
                className={`fixed top-0 left-0 right-0 h-[2px] z-50 ${isSecure
                    ? 'bg-gradient-to-r from-primary via-primary-glow to-primary'
                    : 'bg-gradient-to-r from-error via-red-400 to-error'
                    }`}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.5 }}
                style={{ transformOrigin: 'left' }}
            />

            {/* Status Pill */}
            <motion.div
                className="fixed top-3 right-4 z-50 flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface/90 backdrop-blur-xl border border-white/[0.06] shadow-elevated"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
            >
                {isSecure ? (
                    <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                ) : (
                    <ShieldAlert className="w-3.5 h-3.5 text-error" />
                )}
                <span className={`text-xs font-semibold ${isSecure ? 'text-primary' : 'text-error'}`}>
                    {isSecure ? 'Secure' : 'Alert'}
                </span>
                {violationCount > 0 && (
                    <span className="text-[10px] font-bold text-text-muted bg-white/[0.04] px-1.5 py-0.5 rounded-full">
                        {violationCount}/3
                    </span>
                )}
            </motion.div>

            {/* Warning Overlay */}
            <AnimatePresence>
                {showWarning && (
                    <motion.div
                        className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            className="bg-surface border border-error/20 p-8 rounded-2xl max-w-md text-center shadow-2xl"
                            initial={{ scale: 0.85, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.85, opacity: 0 }}
                        >
                            <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-error/10 flex items-center justify-center border border-error/20">
                                <ShieldAlert className="w-8 h-8 text-error" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">
                                Security Violation
                            </h3>
                            <p className="text-text-secondary text-sm mb-1">
                                Focus lost — this incident has been recorded.
                            </p>
                            <p className="text-error text-xs font-semibold">
                                Strike {violationCount}/3
                            </p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}

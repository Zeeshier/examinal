import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { Mail, Lock, ArrowRight, Sparkles, Eye, EyeOff } from 'lucide-react'

const API_URL = 'http://localhost:8000'

export default function LoginPage() {
    const [formData, setFormData] = useState({ email: '', password: '' })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const { login } = useAuth()
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            const res = await fetch(`${API_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })
            const data = await res.json()

            if (res.ok) {
                login(data)
                navigate(data.user.role === 'student' ? '/student/dashboard' : '/instructor/dashboard')
            } else {
                setError(data.detail || 'Invalid credentials')
            }
        } catch {
            setError('Unable to connect to server')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-background flex relative overflow-hidden">
            {/* Aurora blobs */}
            <div className="aurora-blob w-[500px] h-[500px] bg-primary/20 top-[-15%] right-[-10%]" />
            <div className="aurora-blob w-[400px] h-[400px] bg-purple-600/15 bottom-[-10%] left-[-5%]" style={{ animationDelay: '2s' }} />

            {/* Left Illustration Panel (desktop only) */}
            <div className="hidden lg:flex w-1/2 relative items-center justify-center p-12">
                <div className="relative z-10 max-w-md">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg shadow-primary/25 mb-8">
                            <span className="font-bold text-white text-2xl">E</span>
                        </div>
                        <h1 className="font-display text-4xl font-bold text-white mb-4 leading-tight">
                            Welcome back to<br />
                            <span className="text-gradient-primary">Examinal</span>
                        </h1>
                        <p className="text-text-secondary text-lg leading-relaxed mb-10">
                            AI-powered assessment platform that transforms how exams are created, taken, and graded.
                        </p>
                        <div className="flex items-center gap-3 text-sm text-text-muted">
                            <Sparkles className="w-4 h-4 text-primary" />
                            <span>Trusted by 10,000+ educators worldwide</span>
                        </div>
                    </motion.div>
                </div>
                <div className="absolute inset-0 grid-pattern opacity-40" />
            </div>

            {/* Right Form Panel */}
            <div className="flex-1 flex items-center justify-center p-6 lg:p-12 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-md"
                >
                    {/* Mobile brand */}
                    <div className="lg:hidden mb-8 text-center">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg shadow-primary/25 mx-auto mb-4">
                            <span className="font-bold text-white text-xl">E</span>
                        </div>
                    </div>

                    <div className="glass rounded-2xl p-8 border border-white/[0.06]">
                        <div className="mb-6">
                            <h2 className="text-2xl font-display font-bold text-white mb-1">Sign In</h2>
                            <p className="text-sm text-text-muted">Enter your credentials to continue</p>
                        </div>

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -8 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mb-4 p-3 rounded-xl bg-error/10 border border-error/15 text-error text-sm font-medium"
                            >
                                {error}
                            </motion.div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-text-secondary mb-2 uppercase tracking-wider">Email</label>
                                <div className="relative">
                                    <input
                                        type="email"
                                        className="input-premium pl-10 w-full"
                                        placeholder="you@example.com"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        required
                                    />
                                    <Mail className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-text-secondary mb-2 uppercase tracking-wider">Password</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        className="input-premium pl-10 pr-10 w-full"
                                        placeholder="••••••••"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        required
                                    />
                                    <Lock className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="btn-primary-new w-full py-3 text-sm font-semibold group"
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        Signing In...
                                    </span>
                                ) : (
                                    <span className="flex items-center justify-center gap-2">
                                        Sign In
                                        <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                                    </span>
                                )}
                            </button>
                        </form>

                        <div className="divider my-6" />

                        <p className="text-center text-sm text-text-muted">
                            Don't have an account?{' '}
                            <Link to="/register" className="text-primary hover:text-primary-glow transition-colors font-semibold">
                                Create one
                            </Link>
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    )
}

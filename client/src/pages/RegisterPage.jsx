import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import {
    User,
    Mail,
    Lock,
    CheckCircle2,
    ArrowRight,
    GraduationCap,
    Presentation,
    Eye,
    EyeOff,
    Sparkles
} from 'lucide-react'

const API_URL = 'http://localhost:8000'

export default function RegisterPage() {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        full_name: '',
        role: 'student'
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const { login } = useAuth()
    const navigate = useNavigate()

    const passwordStrength = () => {
        const p = formData.password
        if (!p) return { level: 0, label: '', color: '' }
        let score = 0
        if (p.length >= 6) score++
        if (p.length >= 10) score++
        if (/[A-Z]/.test(p)) score++
        if (/[0-9]/.test(p)) score++
        if (/[^A-Za-z0-9]/.test(p)) score++

        if (score <= 1) return { level: 1, label: 'Weak', color: 'bg-error' }
        if (score <= 3) return { level: 2, label: 'Fair', color: 'bg-warning' }
        return { level: 3, label: 'Strong', color: 'bg-success' }
    }

    const strength = passwordStrength()

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match')
            return
        }
        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters')
            return
        }

        setLoading(true)
        setError('')

        try {
            const res = await fetch(`${API_URL}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: formData.username,
                    email: formData.email,
                    password: formData.password,
                    full_name: formData.full_name,
                    role: formData.role
                })
            })
            const data = await res.json()

            if (res.ok) {
                login(data)
                navigate(data.user.role === 'student' ? '/student/dashboard' : '/instructor/dashboard')
            } else {
                setError(data.detail || 'Registration failed')
            }
        } catch {
            setError('Unable to connect to server')
        } finally {
            setLoading(false)
        }
    }

    const update = (field, value) => setFormData(prev => ({ ...prev, [field]: value }))

    return (
        <div className="min-h-screen bg-background flex relative overflow-hidden">
            {/* Aurora blobs */}
            <div className="aurora-blob w-[500px] h-[500px] bg-primary/20 top-[-15%] left-[-10%]" />
            <div className="aurora-blob w-[400px] h-[400px] bg-purple-600/15 bottom-[-10%] right-[-5%]" style={{ animationDelay: '2s' }} />

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
                            Join the future of<br />
                            <span className="text-gradient-primary">smart assessment</span>
                        </h1>
                        <p className="text-text-secondary text-lg leading-relaxed mb-10">
                            Create an account and experience AI-powered examination in minutes.
                        </p>

                        <div className="space-y-3">
                            {[
                                'AI-generated questions from your materials',
                                'Real-time integrity monitoring',
                                'Instant AI grading with feedback',
                            ].map((item, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: -16 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.4 + i * 0.1 }}
                                    className="flex items-center gap-3 text-sm text-text-secondary"
                                >
                                    <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                                    <span>{item}</span>
                                </motion.div>
                            ))}
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
                    <div className="lg:hidden mb-6 text-center">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg shadow-primary/25 mx-auto mb-4">
                            <span className="font-bold text-white text-xl">E</span>
                        </div>
                    </div>

                    <div className="glass rounded-2xl p-8 border border-white/[0.06]">
                        <div className="mb-6">
                            <h2 className="text-2xl font-display font-bold text-white mb-1">Create Account</h2>
                            <p className="text-sm text-text-muted">Fill in your details to get started</p>
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
                            {/* Role Selection */}
                            <div>
                                <label className="block text-xs font-semibold text-text-secondary mb-2 uppercase tracking-wider">I am a</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        { role: 'student', icon: GraduationCap, label: 'Student' },
                                        { role: 'instructor', icon: Presentation, label: 'Instructor' },
                                    ].map(({ role, icon: Icon, label }) => (
                                        <button
                                            key={role}
                                            type="button"
                                            onClick={() => update('role', role)}
                                            className={`relative p-3 rounded-xl border transition-all duration-200 flex items-center justify-center gap-2 text-sm font-medium ${formData.role === role
                                                ? 'border-primary/30 bg-primary/[0.08] text-white ring-1 ring-primary/20'
                                                : 'border-white/[0.06] bg-white/[0.02] text-text-secondary hover:bg-white/[0.04]'
                                                }`}
                                        >
                                            <Icon className="w-4 h-4" />
                                            {label}
                                            {formData.role === role && (
                                                <motion.div
                                                    layoutId="role-check"
                                                    className="absolute top-1.5 right-1.5"
                                                >
                                                    <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                                                </motion.div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Username & Full Name */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-text-secondary mb-2 uppercase tracking-wider">Username</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            className="input-premium pl-9 w-full"
                                            placeholder="johndoe"
                                            value={formData.username}
                                            onChange={(e) => update('username', e.target.value)}
                                            required
                                        />
                                        <User className="w-3.5 h-3.5 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-text-secondary mb-2 uppercase tracking-wider">Full Name</label>
                                    <input
                                        type="text"
                                        className="input-premium w-full"
                                        placeholder="John Doe"
                                        value={formData.full_name}
                                        onChange={(e) => update('full_name', e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-xs font-semibold text-text-secondary mb-2 uppercase tracking-wider">Email</label>
                                <div className="relative">
                                    <input
                                        type="email"
                                        className="input-premium pl-9 w-full"
                                        placeholder="you@example.com"
                                        value={formData.email}
                                        onChange={(e) => update('email', e.target.value)}
                                        required
                                    />
                                    <Mail className="w-3.5 h-3.5 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                                </div>
                            </div>

                            {/* Password + Confirm */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-text-secondary mb-2 uppercase tracking-wider">Password</label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            className="input-premium pl-9 pr-9 w-full"
                                            placeholder="••••••••"
                                            value={formData.password}
                                            onChange={(e) => update('password', e.target.value)}
                                            required
                                        />
                                        <Lock className="w-3.5 h-3.5 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
                                        >
                                            {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-text-secondary mb-2 uppercase tracking-wider">Confirm</label>
                                    <div className="relative">
                                        <input
                                            type="password"
                                            className="input-premium pl-9 w-full"
                                            placeholder="••••••••"
                                            value={formData.confirmPassword}
                                            onChange={(e) => update('confirmPassword', e.target.value)}
                                            required
                                        />
                                        <CheckCircle2 className={`w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 ${formData.confirmPassword && formData.password === formData.confirmPassword ? 'text-success' : 'text-text-muted'}`} />
                                    </div>
                                </div>
                            </div>

                            {/* Password Strength */}
                            {formData.password && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="flex items-center gap-2"
                                >
                                    <div className="flex-1 h-1 rounded-full bg-white/[0.06] overflow-hidden flex gap-1">
                                        {[1, 2, 3].map((i) => (
                                            <div
                                                key={i}
                                                className={`flex-1 rounded-full transition-all duration-300 ${i <= strength.level ? strength.color : 'bg-transparent'}`}
                                            />
                                        ))}
                                    </div>
                                    <span className={`text-[10px] font-bold ${strength.level === 1 ? 'text-error' : strength.level === 2 ? 'text-warning' : 'text-success'}`}>
                                        {strength.label}
                                    </span>
                                </motion.div>
                            )}

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
                                        Creating Account...
                                    </span>
                                ) : (
                                    <span className="flex items-center justify-center gap-2">
                                        Create Account
                                        <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                                    </span>
                                )}
                            </button>
                        </form>

                        <div className="divider my-6" />

                        <p className="text-center text-sm text-text-muted">
                            Already have an account?{' '}
                            <Link to="/login" className="text-primary hover:text-primary-glow transition-colors font-semibold">
                                Sign In
                            </Link>
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    )
}

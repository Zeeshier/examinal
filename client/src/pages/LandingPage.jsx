import { Link } from 'react-router-dom'
import { motion, useScroll, useTransform } from 'framer-motion'
import { useRef, useState, useEffect } from 'react'
import {
    Sparkles,
    ShieldCheck,
    Brain,
    Zap,
    BarChart3,
    FileText,
    ArrowRight,
    CheckCircle2,
    Menu,
    X
} from 'lucide-react'

/* ============================================
   AURORA BACKGROUND
   ============================================ */
function AuroraBackground() {
    return (
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
            <div className="aurora-blob w-[700px] h-[700px] bg-primary/30 top-[-25%] left-[-10%]" />
            <div className="aurora-blob w-[500px] h-[500px] bg-purple-600/20 top-[10%] right-[-10%]" style={{ animationDelay: '2s' }} />
            <div className="aurora-blob w-[400px] h-[400px] bg-accent/15 bottom-[-10%] left-[30%]" style={{ animationDelay: '4s' }} />
            <div className="noise-overlay" />
        </div>
    )
}

/* ============================================
   ANIMATED COUNTER
   ============================================ */
function AnimatedCounter({ end, suffix = '', label }) {
    const [count, setCount] = useState(0)
    const ref = useRef(null)
    const [hasAnimated, setHasAnimated] = useState(false)

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !hasAnimated) {
                    setHasAnimated(true)
                    let start = 0
                    const duration = 2000
                    const step = (timestamp) => {
                        if (!start) start = timestamp
                        const progress = Math.min((timestamp - start) / duration, 1)
                        setCount(Math.floor(progress * end))
                        if (progress < 1) requestAnimationFrame(step)
                    }
                    requestAnimationFrame(step)
                }
            },
            { threshold: 0.5 }
        )
        if (ref.current) observer.observe(ref.current)
        return () => observer.disconnect()
    }, [end, hasAnimated])

    return (
        <div ref={ref} className="text-center">
            <div className="text-3xl md:text-4xl font-display font-bold text-white">
                {count}{suffix}
            </div>
            <div className="text-sm text-text-muted mt-1 font-medium">{label}</div>
        </div>
    )
}

/* ============================================
   FEATURE CARD
   ============================================ */
function FeatureCard({ icon: Icon, title, description, className = '', color = 'text-primary' }) {
    return (
        <motion.div
            className={`bento-card group flex flex-col ${className}`}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        >
            <div className={`w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mb-4 ${color} group-hover:scale-110 transition-transform duration-300`}>
                <Icon className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
            <p className="text-sm text-text-secondary leading-relaxed flex-1">{description}</p>
        </motion.div>
    )
}

/* ============================================
   NAVBAR
   ============================================ */
function Navbar() {
    const [scrolled, setScrolled] = useState(false)
    const [mobileOpen, setMobileOpen] = useState(false)

    useEffect(() => {
        const handler = () => setScrolled(window.scrollY > 20)
        window.addEventListener('scroll', handler)
        return () => window.removeEventListener('scroll', handler)
    }, [])

    return (
        <motion.nav
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-background/80 backdrop-blur-2xl border-b border-white/[0.04]' : ''
                }`}
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
        >
            <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-16">
                <Link to="/" className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg shadow-primary/20">
                        <span className="font-bold text-white text-sm">E</span>
                    </div>
                    <span className="font-display font-bold text-white">Examinal</span>
                </Link>

                <div className="hidden md:flex items-center gap-2">
                    <Link to="/login" className="btn-ghost-new px-5 py-2 text-sm">Sign In</Link>
                    <Link to="/register" className="btn-primary-new px-5 py-2 text-sm">
                        Get Started <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </Link>
                </div>

                <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden text-text-secondary hover:text-white">
                    {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
            </div>

            {/* Mobile menu */}
            {mobileOpen && (
                <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="md:hidden bg-surface/95 backdrop-blur-xl border-b border-white/[0.06] p-4 space-y-2"
                >
                    <Link to="/login" className="block w-full text-center btn-ghost-new py-2.5 text-sm" onClick={() => setMobileOpen(false)}>Sign In</Link>
                    <Link to="/register" className="block w-full text-center btn-primary-new py-2.5 text-sm" onClick={() => setMobileOpen(false)}>Get Started</Link>
                </motion.div>
            )}
        </motion.nav>
    )
}

/* ============================================
   LANDING PAGE
   ============================================ */
export default function LandingPage() {
    const targetRef = useRef(null)
    const { scrollYProgress } = useScroll({ target: targetRef })
    const opacity = useTransform(scrollYProgress, [0, 0.3], [1, 0])

    return (
        <div ref={targetRef} className="min-h-screen bg-background relative overflow-hidden">
            <AuroraBackground />
            <Navbar />

            {/* ===== HERO ===== */}
            <section className="relative z-10 pt-32 pb-20 px-6">
                <div className="max-w-5xl mx-auto text-center">

                    {/* Badge */}
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="inline-flex items-center gap-2 badge bg-primary/10 text-primary border border-primary/15 mb-8"
                    >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Powered by Advanced RAG</span>
                    </motion.div>

                    {/* Headline */}
                    <motion.h1
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="font-display text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-[1.08] tracking-tight mb-6"
                    >
                        The Future of{' '}
                        <br className="hidden sm:block" />
                        <span className="text-gradient-primary">Intelligent Assessment</span>
                    </motion.h1>

                    {/* Subtitle */}
                    <motion.p
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="text-lg md:text-xl text-text-secondary max-w-2xl mx-auto leading-relaxed mb-10"
                    >
                        Examinal uses advanced RAG technology to generate contextual exam questions,
                        maintain academic integrity, and provide AI-powered grading — all in one platform.
                    </motion.p>

                    {/* CTA Buttons */}
                    <motion.div
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        className="flex flex-col sm:flex-row gap-4 justify-center"
                    >
                        <Link
                            to="/register"
                            className="btn-primary-new px-8 py-3.5 text-base font-semibold group"
                        >
                            Start Free Trial
                            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </Link>
                        <a
                            href="#features"
                            className="btn-ghost-new px-8 py-3.5 text-base"
                        >
                            See Features
                        </a>
                    </motion.div>
                </div>
            </section>



            {/* ===== FEATURES ===== */}
            <section id="features" className="relative z-10 py-20 px-6">
                <div className="max-w-6xl mx-auto">
                    <motion.div
                        className="text-center mb-14"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-4">
                            Everything You Need
                        </h2>
                        <p className="text-text-secondary text-lg max-w-xl mx-auto">
                            A complete suite of tools for modern assessment
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <FeatureCard
                            icon={Brain}
                            title="RAG-Powered Generation"
                            description="Upload your course material and let AI generate contextually relevant questions using retrieval-augmented generation."
                            className="md:col-span-2"
                            color="text-primary"
                        />
                        <FeatureCard
                            icon={ShieldCheck}
                            title="Integrity Shield"
                            description="Real-time monitoring with tab-switch detection and fullscreen enforcement."
                            color="text-emerald-400"
                        />
                        <FeatureCard
                            icon={BarChart3}
                            title="Smart Analytics"
                            description="AI-driven performance insights and personalized learning recommendations."
                            color="text-amber-400"
                        />
                        <FeatureCard
                            icon={Zap}
                            title="Instant Grading"
                            description="AI evaluates subjective answers with detailed feedback and scoring."
                            className="md:col-span-2"
                            color="text-violet-400"
                        />
                    </div>
                </div>
            </section>

            {/* ===== HOW IT WORKS ===== */}
            <section className="relative z-10 py-20 px-6">
                <div className="max-w-4xl mx-auto">
                    <motion.div
                        className="text-center mb-14"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-4">
                            How It Works
                        </h2>
                        <p className="text-text-secondary text-lg">Three simple steps to smarter exams</p>
                    </motion.div>

                    <div className="space-y-6">
                        {[
                            { step: '01', title: 'Upload Materials', desc: 'Upload PDF or DOCX files — course notes, textbooks, or research papers.', icon: FileText },
                            { step: '02', title: 'AI Generates Questions', desc: 'Our RAG engine processes content and creates contextual questions.', icon: Brain },
                            { step: '03', title: 'Publish & Grade', desc: 'Students take the exam, AI grades responses with detailed feedback.', icon: CheckCircle2 },
                        ].map((item, i) => (
                            <motion.div
                                key={item.step}
                                className="bento-card !p-6 flex items-start gap-5 group"
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                            >
                                <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/10 flex items-center justify-center text-primary font-display font-bold text-sm shrink-0">
                                    {item.step}
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-primary transition-colors">{item.title}</h3>
                                    <p className="text-sm text-text-secondary leading-relaxed">{item.desc}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===== CTA ===== */}
            <section className="relative z-10 py-20 px-6">
                <div className="max-w-3xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="bento-card !p-12 relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.08] to-transparent pointer-events-none" />
                        <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-4 relative z-10">
                            Ready to Get Started?
                        </h2>
                        <p className="text-text-secondary text-lg mb-8 relative z-10">
                            Join thousands of educators using AI-powered assessment.
                        </p>
                        <Link
                            to="/register"
                            className="btn-primary-new px-8 py-3.5 text-base font-semibold relative z-10 group"
                        >
                            Create Free Account
                            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </motion.div>
                </div>
            </section>

            {/* ===== FOOTER ===== */}
            <footer className="relative z-10 border-t border-white/[0.04] py-10 px-6">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
                            <span className="font-bold text-white text-xs">E</span>
                        </div>
                        <span className="text-sm font-semibold text-text-secondary">Examinal</span>
                    </div>
                    <p className="text-xs text-text-muted">© 2026 Examinal. Built with AI.</p>
                </div>
            </footer>
        </div>
    )
}

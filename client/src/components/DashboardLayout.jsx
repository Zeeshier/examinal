import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import {
    LayoutDashboard,
    FilePlus,
    Sparkles,
    FileText,
    PieChart,
    LogOut,
    Menu,
    X,
    ChevronRight
} from 'lucide-react'

function SidebarItem({ icon: Icon, label, path, isActive, onClick }) {
    return (
        <Link to={path} onClick={onClick}>
            <div className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${isActive
                    ? 'text-white'
                    : 'text-text-secondary hover:text-white hover:bg-white/[0.04]'
                }`}>
                {/* Active Indicator Line */}
                {isActive && (
                    <motion.div
                        layoutId="sidebar-active-line"
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-full bg-gradient-to-b from-primary to-accent"
                        transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                    />
                )}

                {/* Active Background */}
                {isActive && (
                    <motion.div
                        layoutId="sidebar-active-bg"
                        className="absolute inset-0 rounded-xl bg-primary/[0.08] border border-primary/10"
                        transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                    />
                )}

                <div className={`relative z-10 transition-colors ${isActive ? 'text-primary' : 'text-current'}`}>
                    <Icon className="w-[18px] h-[18px]" strokeWidth={2} />
                </div>
                <span className="relative z-10 font-medium text-sm">{label}</span>

                {isActive && (
                    <ChevronRight className="w-3.5 h-3.5 ml-auto relative z-10 text-text-muted" />
                )}
            </div>
        </Link>
    )
}

export default function DashboardLayout({ children }) {
    const { user, logout } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()
    const [mobileOpen, setMobileOpen] = useState(false)

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    const isInstructor = user?.role === 'instructor' || user?.role === 'admin'

    const links = isInstructor ? [
        { label: 'Dashboard', path: '/instructor/dashboard', icon: LayoutDashboard },
        { label: 'Create Exam', path: '/instructor/create-exam', icon: FilePlus },
        { label: 'AI Generate', path: '/instructor/ai-generate', icon: Sparkles },
    ] : [
        { label: 'Available Exams', path: '/student/dashboard', icon: FileText },
        { label: 'My Results', path: '/student/results', icon: PieChart },
    ]

    const SidebarContent = ({ onLinkClick }) => (
        <>
            {/* Brand */}
            <div className="p-6 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary via-primary to-purple-600 flex items-center justify-center shadow-lg shadow-primary/25 ring-1 ring-white/10">
                    <span className="font-bold text-white text-lg">E</span>
                </div>
                <span className="font-display font-bold tracking-tight text-white text-lg">Examinal</span>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
                <div className="mb-3 px-3 text-[10px] font-semibold text-text-muted uppercase tracking-[0.15em]">
                    Navigation
                </div>
                {links.map(link => (
                    <SidebarItem
                        key={link.path}
                        {...link}
                        isActive={location.pathname === link.path}
                        onClick={onLinkClick}
                    />
                ))}
            </nav>

            {/* User Profile */}
            <div className="p-4 border-t border-white/[0.04]">
                <div className="bg-surface-highlight/50 rounded-xl p-3 flex items-center gap-3 border border-white/[0.04] mb-3">
                    <div className="relative">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/80 to-purple-600/80 flex items-center justify-center ring-2 ring-primary/20">
                            <span className="text-xs font-bold text-white">{user?.username?.[0]?.toUpperCase()}</span>
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-success border-2 border-surface" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate text-white">{user?.username}</p>
                        <p className="text-[11px] text-text-muted truncate capitalize">{user?.role}</p>
                    </div>
                </div>

                <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium text-text-muted hover:text-error hover:bg-error/[0.06] transition-all duration-200 group border border-transparent hover:border-error/10"
                >
                    <LogOut className="w-3.5 h-3.5 transition-colors" />
                    Sign Out
                </button>
            </div>
        </>
    )

    return (
        <div className="flex min-h-screen bg-background text-text-primary">
            {/* Desktop Sidebar */}
            <aside className="fixed left-3 top-3 bottom-3 w-[260px] flex-col glass rounded-2xl border border-white/[0.04] z-40 hidden md:flex shadow-elevated">
                <SidebarContent />
            </aside>

            {/* Mobile Header */}
            <div className="fixed top-0 left-0 right-0 h-16 bg-background/80 backdrop-blur-xl border-b border-white/[0.04] z-40 flex md:hidden items-center px-4 justify-between">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg shadow-primary/20">
                        <span className="font-bold text-white text-sm">E</span>
                    </div>
                    <span className="font-display font-bold text-white">Examinal</span>
                </div>
                <button
                    onClick={() => setMobileOpen(true)}
                    className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-text-secondary hover:text-white transition-colors"
                >
                    <Menu className="w-5 h-5" />
                </button>
            </div>

            {/* Mobile Sidebar Overlay */}
            <AnimatePresence>
                {mobileOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 md:hidden"
                            onClick={() => setMobileOpen(false)}
                        />
                        <motion.aside
                            initial={{ x: -280 }}
                            animate={{ x: 0 }}
                            exit={{ x: -280 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                            className="fixed left-0 top-0 bottom-0 w-[270px] flex flex-col bg-surface border-r border-white/[0.06] z-50 md:hidden"
                        >
                            <button
                                onClick={() => setMobileOpen(false)}
                                className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center text-text-secondary hover:text-white transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                            <SidebarContent onLinkClick={() => setMobileOpen(false)} />
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            {/* Main Content Area */}
            <main className="flex-1 md:ml-[17.5rem] p-4 pt-20 md:pt-4 lg:p-8 relative">
                <div className="max-w-7xl mx-auto">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={location.pathname}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                        >
                            {children}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </main>

            {/* Background Ambience */}
            <div className="fixed top-0 right-0 w-[600px] h-[600px] rounded-full bg-primary/[0.03] blur-[150px] pointer-events-none" />
            <div className="fixed bottom-0 left-[15%] w-[500px] h-[500px] rounded-full bg-accent/[0.02] blur-[150px] pointer-events-none" />
        </div>
    )
}

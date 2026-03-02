import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Loader2 } from 'lucide-react'

export default function RequireAuth({ children, allowedRoles = [] }) {
    const { user, loading, isAuthenticated } = useAuth()
    const location = useLocation()

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg shadow-primary/25 animate-pulse-ring">
                        <span className="font-bold text-white text-xl">E</span>
                    </div>
                    <div className="flex items-center gap-2 text-text-secondary">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm font-medium">Loading...</span>
                    </div>
                </div>
            </div>
        )
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
        if (user?.role === 'student') {
            return <Navigate to="/student/dashboard" replace />
        } else {
            return <Navigate to="/instructor/dashboard" replace />
        }
    }

    return children
}

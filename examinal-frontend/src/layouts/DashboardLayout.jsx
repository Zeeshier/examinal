import { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "../components/Sidebar";
import { Menu, X, ChevronRight } from "lucide-react";

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Derived page name for breadcrumb
  const pathParts = location.pathname.split("/").filter(Boolean);
  const pageName = pathParts[0]?.charAt(0).toUpperCase() + pathParts[0]?.slice(1) || "Dashboard";

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* ── Mobile Overlay (Animated) ── */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-30 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* ── Sidebar Container ── */}
      <div
        className={`fixed left-0 top-0 bottom-0 w-[280px] z-40 transition-transform duration-500 cubic-bezier(0.16, 1, 0.3, 1)
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 shadow-2xl lg:shadow-none`}
      >
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* ── Mobile Header (Glassmorphism) ── */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-white/70 backdrop-blur-xl border-b border-slate-200/50 flex items-center justify-between px-4 z-20 lg:hidden">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="w-10 h-10 flex items-center justify-center text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
            aria-label="Open sidebar"
          >
            <Menu size={20} />
          </button>
          
          <div className="flex items-center gap-2 overflow-hidden">
             <span className="text-xs font-black text-blue-600 uppercase tracking-tighter">Examinal</span>
             <ChevronRight size={12} className="text-slate-300" />
             <span className="text-sm font-semibold text-slate-800 truncate">{pageName}</span>
          </div>
        </div>

        {/* Action icons could go here */}
        <div className="w-10 h-10 rounded-full bg-blue-100/50 border border-blue-200/50 flex items-center justify-center text-blue-600 text-[10px] font-black">
          {pageName.charAt(0)}
        </div>
      </header>

      {/* ── Main Content Area ── */}
      <main className="lg:ml-[280px] pt-16 lg:pt-0 min-h-screen">
        <div className="p-4 md:p-8 lg:p-10 max-w-[1600px] mx-auto">
          {/* Transition wrapper for nested routes */}
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <Outlet />
          </motion.div>
        </div>
      </main>
    </div>
  );
}

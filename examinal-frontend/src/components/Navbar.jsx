import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Menu, X, Brain } from "lucide-react";
import { motion } from "framer-motion";

const links = [
  { to: "/home", label: "Home" },
  { to: "/features", label: "Features" },
  { to: "/about", label: "About" },
  { to: "/team", label: "Team" },
  { to: "/contact", label: "Contact" },
];

export default function Navbar() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <motion.nav 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-4 left-0 right-0 mx-auto w-[95%] max-w-7xl z-50 bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-2xl shadow-xl shadow-blue-900/5 overflow-hidden"
    >
      <div className="px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/home" className="flex items-center gap-3 relative z-10 group">
          <img src="/logo-transparent.png" alt="Examinal Logo" className="h-8 md:h-10 transition-transform duration-300 group-hover:scale-105" />
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-1">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={`relative px-4 py-2 text-[10px] uppercase tracking-[0.2em] font-black transition-all duration-300 ${
                pathname === l.to
                  ? "text-blue-600"
                  : "text-slate-500 hover:text-blue-600"
              }`}
            >
              {l.label}
              {pathname === l.to && (
                <motion.div 
                  layoutId="nav-border"
                  className="absolute bottom-0 left-4 right-4 h-0.5 bg-blue-500 shadow-lg shadow-blue-500/50"
                />
              )}
            </Link>
          ))}
        </div>

        {/* Auth buttons */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <Link to="/dashboard" className="px-6 py-2 bg-blue-600 text-white rounded-xl text-[10px] uppercase tracking-widest font-black hover:bg-blue-500 transition-colors shadow-lg shadow-blue-600/20">
              Dashboard
            </Link>
          ) : (
            <>
              <Link to="/login" className="px-4 py-2 text-[10px] uppercase tracking-widest font-black text-slate-500 hover:text-blue-600 transition-colors">
                Sign In
              </Link>
              <Link to="/register" className="px-6 py-2 bg-blue-600 text-white rounded-xl text-[10px] uppercase tracking-widest font-black hover:scale-105 transition-all shadow-md shadow-blue-600/20 hover:bg-blue-700">
                Join Protocol
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 text-navy-950">
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="md:hidden border-t border-slate-200 px-6 py-4 space-y-2 bg-white/95 backdrop-blur-xl"
        >
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setMobileOpen(false)}
              className="block px-4 py-2.5 text-[10px] uppercase tracking-widest font-black text-slate-500 hover:text-blue-600 hover:bg-blue-50/50 rounded-lg"
            >
              {l.label}
            </Link>
          ))}
          <div className="pt-3 border-t border-slate-200 space-y-3">
            <Link to="/login" onClick={() => setMobileOpen(false)} className="block px-4 py-1 text-[10px] uppercase tracking-widest font-black text-slate-500">
              Sign In
            </Link>
            <Link to="/register" onClick={() => setMobileOpen(false)} className="block w-full text-center py-3 bg-blue-600 text-white rounded-xl text-[10px] uppercase tracking-widest font-black">
              Join Protocol
            </Link>
          </div>
        </motion.div>
      )}
    </motion.nav>
  );
}


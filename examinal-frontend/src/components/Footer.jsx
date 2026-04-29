import { Link } from "react-router-dom";
import { Brain, Globe, Shield, Activity, Zap } from "lucide-react";

export default function Footer() {
  return (
    <footer className="py-20 border-t border-slate-100 relative z-10 bg-slate-50 overflow-hidden">
      {/* ── ADVANCED AMBIENT BACKDROP ── */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[400px] bg-blue-400/10 rounded-full blur-[150px] -z-10" />
      <div className="absolute bottom-[-100px] right-0 w-[400px] h-[400px] bg-cyan-400/10 rounded-full blur-[120px] -z-10" />

      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-12 mb-20 relative">
          
          {/* Brand & Mission - The Core */}
          <div className="md:col-span-2 lg:col-span-2 pr-0 lg:pr-12">
            <Link to="/home" className="flex flex-col gap-2 mb-6 group items-start">
              <img src="/logo-transparent.png" alt="Examinal Logo" className="h-10 group-hover:scale-105 transition-transform duration-500" />
              <div className="flex flex-col mt-2">
                <span className="text-[7px] font-black text-blue-600 uppercase tracking-[0.5em]">Institutional Core</span>
              </div>
            </Link>
            <p className="text-sm text-slate-600 leading-relaxed font-light mb-8 max-w-sm">
              An AI-Powered Assessment Platform using RAG for automated test generation and evaluation. Developed by students at the University of Lahore.
            </p>
            
            {/* Live Infrastructure Badges */}
            {/* <div className="flex flex-wrap gap-3">
               <div className="flex items-center gap-2 px-3 py-1 bg-white/[0.03] border border-white/10 rounded-full">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Sargodha Campus</span>
               </div>
               <div className="flex items-center gap-2 px-3 py-1 bg-white/[0.03] border border-white/10 rounded-full">
                  <Activity size={10} className="text-blue-400" />
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">FYP 2026</span>
               </div>
            </div> */}
          </div>

          {/* Product Nav */}
          <div className="md:col-span-1">
            <h4 className="text-[10px] font-black text-navy-950 mb-8 uppercase tracking-[0.4em] border-l-2 border-blue-500 pl-4">Product</h4>
            <div className="space-y-4">
              <FooterLink to="/features" label="AI Features" />
              <FooterLink to="/about" label="About Us" />
              <FooterLink to="/contact" label="Support" />
            </div>
          </div>

          {/* Platform Nav */}
          <div className="md:col-span-1">
            <h4 className="text-[10px] font-black text-navy-950 mb-8 uppercase tracking-[0.4em] border-l-2 border-blue-500 pl-4">Access</h4>
            <div className="space-y-4">
              <FooterLink to="/login" label="Sign In" />
              <FooterLink to="/register" label="Sign Up" />
            </div>
          </div>

          {/* Infrastructure Mesh */}
          <div className="md:col-span-1">
            <h4 className="text-[10px] font-black text-navy-950 mb-8 uppercase tracking-[0.4em] border-l-2 border-blue-500 pl-4">Trust</h4>
            <div className="space-y-5">
              <TechBadge icon={Globe} label="High-Speed AI" />
              <TechBadge icon={Shield} label="Secure Data" />
              <TechBadge icon={Zap} label="Fast Results" />
            </div>
          </div>
        </div>

        {/* ── FINAL BAR ── */}
        <div className="pt-10 border-t border-slate-200 flex flex-col lg:flex-row justify-between items-center gap-8">
          <div className="flex flex-col md:flex-row items-center gap-6">
             <p className="text-[14px] font-medium text-slate-600 tracking-wider">
               © {new Date().getFullYear()} EXAMINAL NEURAL INC.
             </p>
             <div className="hidden md:block w-[1px] h-4 bg-slate-300" />
            
          </div>
          
          <div className="flex gap-4">
             <div className="px-4 py-1.5 bg-blue-50 border border-blue-100 rounded-xl text-[9px] font-black text-blue-600 tracking-[0.2em] uppercase shadow-sm shadow-blue-900/5">
                Enterprise Grade
             </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

/**
 * Helper Sub-Components
 */
function FooterLink({ to, label }) {
  return (
    <Link to={to} className="group relative block text-[10px] font-bold text-slate-500 uppercase tracking-widest transition-colors hover:text-blue-600">
      {label}
      <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-blue-500 transition-all duration-300 group-hover:w-full" />
    </Link>
  );
}

function TechBadge({ icon: Icon, label }) {
  return (
    <div className="flex items-center gap-3 group cursor-default">
      <div className="w-6 h-6 bg-white border border-slate-200 rounded-md flex items-center justify-center text-slate-500 group-hover:text-blue-600 group-hover:border-blue-300 transition-all shadow-sm shadow-blue-900/5">
        <Icon size={12} />
      </div>
      <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest group-hover:text-slate-500 transition-colors">{label}</span>
    </div>
  );
}


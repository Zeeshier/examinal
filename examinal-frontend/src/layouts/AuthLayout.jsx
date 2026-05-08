import { Outlet, Link } from "react-router-dom";
import { Brain, Sparkles, ArrowLeft } from "lucide-react";
import ParticleBackground from "../components/ParticleBackground";

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-white flex font-sans selection:bg-blue-500/30 relative overflow-hidden">
      {/* Left panel - The Oracle Mesh */}
      <div 
        className="hidden lg:flex lg:w-[45%] flex-col justify-between p-16 relative overflow-hidden border-r border-slate-800"
        onMouseMove={(e) => {
          const { clientX, clientY, currentTarget } = e;
          const { left, top, width, height } = currentTarget.getBoundingClientRect();
          const x = (clientX - left) / width - 0.5;
          const y = (clientY - top) / height - 0.5;
          currentTarget.style.setProperty('--x', x);
          currentTarget.style.setProperty('--y', y);
        }}
        style={{
          '--x': 0,
          '--y': 0
        }}
      >
        <div className="absolute inset-0 bg-slate-950">
          <div 
            className="absolute inset-0 transition-transform duration-500 ease-out scale-110"
            style={{
              transform: `translate(calc(var(--x) * -20px), calc(var(--y) * -20px))`
            }}
          >
            <img src="/hero-bg.png" alt="Background" className="w-full h-full object-cover opacity-50" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-950/30 to-slate-950/80" />
        </div>
        <ParticleBackground />
        
        {/* Animated Mesh Backdrops */}
        <div 
          className="absolute top-[-20%] right-[-20%] w-[80%] h-[80%] bg-blue-500/20 rounded-full blur-[120px] animate-pulse pointer-events-none transition-transform duration-700 ease-out"
          style={{ transform: `translate(calc(var(--x) * 40px), calc(var(--y) * 40px))` }}
        />
        <div 
          className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none transition-transform duration-1000 ease-out"
          style={{ transform: `translate(calc(var(--x) * -30px), calc(var(--y) * -30px))` }}
        />

        <Link to="/home" className="inline-block relative z-10 group">
          <img src="/logo-transparent.png" alt="Examinal Logo" className="h-12 group-hover:scale-105 transition-transform duration-500 bg-white/90 rounded-2xl px-4 py-2 backdrop-blur-md shadow-xl border border-white" />
        </Link>

        <div className="relative z-10 mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-500/20 border border-blue-400/30 rounded-full mb-8 backdrop-blur-md shadow-sm shadow-black/10">
            <Sparkles size={11} className="text-blue-300" />
            <span className="text-[9px] font-black uppercase tracking-[0.4em] text-blue-200">Neural System v4.0</span>
          </div>

          <h2 className="text-4xl  text-white leading-[1.1] tracking-tight mb-8">
            Access the <br />
            <span className="bg-clip-text font-bold text-transparent bg-gradient-to-r from-blue-400 via-cyan-300 to-white italic pr-2">
              AI Assessment Node.
            </span>
          </h2>
          
          <div className="w-20 h-1.5 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full mb-8" />
          
          <p className="text-blue-100/80 text-lg leading-relaxed max-w-sm font-light">
            Empowering institutions with enterprise-grade AI examination layers and automated precision grading.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-8 text-[10px] font-black uppercase tracking-[0.3em] text-blue-300/50">
          <span>© 2026 EXAMINAL</span>
          <div className="w-1.5 h-1.5 rounded-full bg-blue-400/30" />
          <span className="text-blue-300/50">STABILITY PROTOCOL ACTIVE</span>
        </div>
      </div>

      {/* Right panel - The Interface */}
      <div className="w-full lg:w-[55%] flex items-center justify-center p-8 md:p-16 relative overflow-hidden bg-blue-50/30">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none" />
        
        {/* Back to Home Button */}
        <Link 
          to="/home" 
          className="absolute top-8 right-8 lg:top-12 lg:right-12 z-20 flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-all shadow-sm shadow-slate-200/50"
        >
          <ArrowLeft size={14} /> Back
        </Link>
        
        <div className="w-full max-w-[440px] relative z-10">
          <div className="lg:hidden flex justify-center mb-12">
            <Link to="/home" className="w-14 h-14 bg-blue-50 border border-blue-100 text-blue-600 rounded-2xl flex items-center justify-center shadow-md shadow-blue-900/5">
              <Brain size={24} />
            </Link>
          </div>
          <Outlet />
        </div>
      </div>
    </div>
  );
}

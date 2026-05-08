import { Link } from "react-router-dom";
import { Home, ArrowLeft } from "lucide-react";
import HeroSection from "../components/HeroSection";

export default function NotFound() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-white -mt-16">
      {/* ── PREMIUM TEXTURE OVERLAY ── */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none z-50 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

      <HeroSection 
        height="min-h-screen"
        tag="Neural Mesh System Layer 404"
        title="Page Not"
        highlight="Found."
        subtitle="The assessment node you are looking for does not exist or has been moved to another sector."
      >
        <div className="flex flex-col sm:flex-row gap-6 justify-center mt-8">
          <button 
            onClick={() => window.history.back()}
            className="px-8 py-3 border border-white/20 text-white rounded-xl font-bold uppercase tracking-widest text-[10px] hover:bg-white/10 transition-all flex items-center justify-center gap-3"
          >
            <ArrowLeft size={18} /> GO BACK
          </button>
          <Link 
            to="/"
            className="px-10 py-3 bg-blue-500 text-white rounded-xl font-black text-sm hover:scale-105 transition-all duration-300 shadow-xl shadow-blue-500/20 hover:shadow-blue-500/40 flex items-center justify-center gap-3 uppercase"
          >
            <Home size={18} /> HOME
          </Link>
        </div>
      </HeroSection>
    </div>
  );
}


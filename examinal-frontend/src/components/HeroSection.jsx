import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import ParticleBackground from "./ParticleBackground";

export default function HeroSection({ 
  tag = "NVIDIA Neural Infrastructure v4.0", 
  title = "", 
  highlight = "", 
  subtitle = "",
  height = "min-h-[60vh]",
  className = "",
  children
}) {
  return (
    <section className={`relative z-10 ${height} flex items-center justify-center pt-24 pb-12 ${className}`}>
      {/* ── BACKGROUND LAYER ── */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden bg-slate-950">
        <img 
          src="/hero-bg.png" 
          alt="Neural Background" 
          className="absolute inset-0 w-full h-full object-cover opacity-60" 
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-950/40 to-slate-950/80" />
        <ParticleBackground />
      </div>

      <div className="max-w-5xl mx-auto px-6 text-center relative z-10">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            {/* Tag */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-500/20 border border-blue-400/30 rounded-full mb-6 backdrop-blur-md shadow-sm shadow-black/10">
              <Sparkles size={11} className="text-blue-400" />
              <span className="text-[9px] font-normal uppercase tracking-[0.4em] text-blue-200">{tag}</span>
            </div>

            {/* Title */}
            <div className="py-2">
              <h1 className="text-4xl md:text-6xl font-light text-white leading-[1.15] tracking-tighter mb-6">
                {title} {title && <br />}
                <span className="inline-block px-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-blue-300 to-cyan-300 italic font-black pb-1">
                  {highlight}
                </span>
              </h1>

              {/* Subtitle */}
              <p className="text-sm md:text-base text-blue-100/80 max-w-2xl mx-auto mb-6 leading-relaxed font-light">
                {subtitle}
              </p>
            </div>

            {children}
            
            {/* Decorative Divider */}
            <div className="w-16 h-1 bg-gradient-to-r from-blue-500 to-cyan-400 mx-auto rounded-full mt-2" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

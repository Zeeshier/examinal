import { motion } from "framer-motion";
import { 
  Target, Shield, Zap, Sparkles, Brain, Cpu, 
  Layers, Lock, CheckCircle 
} from "lucide-react";
import ParticleBackground from "../components/ParticleBackground";

/**
 * ── ABOUT INFO CARD ──
 */
function InfoCard({ icon: Icon, title, desc, delay, className = "" }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay }}
      className={`group relative ${className}`}
    >
      {/* ── BORDER GLOW ── */}
      <div className="absolute -inset-[1px] bg-gradient-to-br from-blue-200/0 via-blue-300/0 to-cyan-200/0 group-hover:from-blue-300 group-hover:via-blue-200 group-hover:to-cyan-300 rounded-3xl transition-all duration-500 -z-10" />

      <div className="h-full p-8 rounded-3xl bg-blue-50/80 border-2 border-blue-100/50 shadow-lg shadow-blue-900/5 backdrop-blur-xl group-hover:bg-gradient-to-br group-hover:from-blue-50 group-hover:via-white/60 group-hover:to-blue-50 group-hover:border-blue-200 group-hover:shadow-xl group-hover:shadow-blue-900/10 group-hover:-translate-y-2 transition-all duration-300">
        <div className="w-12 h-12 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center mb-6 text-blue-600 shadow-sm shadow-blue-900/5 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
          <Icon size={24} />
        </div>
        <h3 className="text-xl font-black text-navy-950 mb-3 tracking-tight">{title}</h3>
        <p className="text-sm text-slate-600 leading-relaxed font-light group-hover:text-slate-700 transition-colors">{desc}</p>
      </div>
    </motion.div>
  );
}

import HeroSection from "../components/HeroSection";

export default function About() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-blue-50/10 -mt-16">
      {/* ── PREMIUM TEXTURE OVERLAY ── */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none z-50 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

      <HeroSection 
        height="min-h-[50vh]"
        tag="The Platform"
        title="Better Exams"
        highlight="Simple & Secure."
        subtitle="Developed by students at the University of Lahore, Sargodha Campus, Examinal is a state-of-the-art assessment platform utilizing RAG (Retrieval-Augmented Generation) to empower educators with automated grading and secure exam protocols."
      />

      <div className="max-w-7xl mx-auto px-6 relative z-10 py-16">


        {/* ── MISSION & VALUES (BENTO) ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-24">
          <InfoCard 
            icon={Target} 
            title="Our Mission" 
            desc="Make high-quality AI testing easy, fair, and fast for every teacher and school."
            delay={0.1}
          />
          <InfoCard 
            icon={Layers} 
            title="Our Values" 
            desc="Fairness, clear grading decisions, and keeping teachers in control of the final results."
            delay={0.2}
          />
          <InfoCard 
            icon={Cpu} 
            title="Our Infrastructure" 
            desc="Powered by world-leading AI technology to deliver fast, accurate results for every student."
            delay={0.3}
          />
        </div>

        {/* ── DEEP WORKFLOW ── */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="p-10 md:p-16 rounded-[3rem] bg-blue-600 border border-blue-500 shadow-2xl shadow-blue-900/20 backdrop-blur-3xl relative overflow-hidden transition-all duration-500 hover:bg-gradient-to-br hover:from-blue-600 hover:via-blue-500 hover:to-blue-700 hover:-translate-y-1 group"
        >
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/50 to-transparent" />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            <div>
              <h2 className="text-4xl font-black text-white mb-8 tracking-tight">How It Works.</h2>
              <p className="text-blue-100 mb-8 font-light leading-relaxed">
                Examinal handle the complex work of exam preparation and grading, so you can focus on teaching.
              </p>
              
              <div className="space-y-4">
                 {[
                   { icon: CheckCircle, label: "Data Privacy" },
                   { icon: CheckCircle, label: "Accurate Grading" },
                   { icon: CheckCircle, label: "Total Precision" }
                 ].map((check, i) => (
                   <div key={i} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-white border border-blue-400 shadow-sm shadow-black/10">
                         <check.icon size={12} />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-blue-200">{check.label}</span>
                   </div>
                 ))}
              </div>
            </div>

            <div className="space-y-10">
              <WorkflowStep 
                num="01" 
                title="Smart Upload" 
                desc="Upload PDFs and documents. Our AI reads and organizes your content instantly." 
              />
              <WorkflowStep 
                num="02" 
                title="AI Creation" 
                desc="The AI creates precise multiple-choice and essay questions from your materials." 
              />
              <WorkflowStep 
                num="03" 
                title="Secure Send" 
                desc="Send out exams in a secure environment that prevents cheating." 
              />
              <WorkflowStep 
                num="04" 
                title="AI Grading" 
                desc="AI grades answers automatically based on your rubrics with 99% accuracy." 
              />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function WorkflowStep({ num, title, desc }) {
  return (
    <div className="flex gap-6 group">
      <span className="text-2xl font-black text-blue-300 group-hover:text-white transition-colors underline decoration-blue-400 underline-offset-8 decoration-4">{num}</span>
      <div>
        <h4 className="text-lg font-black text-white mb-2 tracking-tight">{title}</h4>
        <p className="text-sm text-blue-100 leading-relaxed font-light">{desc}</p>
      </div>
    </div>
  );
}


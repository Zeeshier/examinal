import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import ParticleBackground from "../components/ParticleBackground";
import {
  Sparkles, FileText, Shield, BarChart3, Brain,
  Upload, CheckCircle, ArrowRight, Zap, Users,
  BookOpen, Award, ChevronRight, UploadCloud, ShieldCheck,
} from "lucide-react";


const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6 },
};


/**
 * ── STEP CARD ──
 */
function StepCard({ number, title, desc, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay }}
      className="relative group text-center px-6"
    >
      <div className="w-16 h-16 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6 text-blue-600 font-black text-xl backdrop-blur-md group-hover:bg-blue-600 group-hover:text-white transition-all duration-500 relative z-10 shadow-sm shadow-blue-900/5">
        {number}
        <div className="absolute inset-0 bg-blue-400/20 blur-xl rounded-full -z-10 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      <h3 className="text-xl font-black text-navy-950 mb-3 tracking-tight">{title}</h3>
      <p className="text-sm text-slate-600 leading-relaxed font-light">{desc}</p>
    </motion.div>
  );
}

/**
 * ── FEATURE CARD ──
 * A premium glassmorphic card with hover-parallax and border glow.
 */
function FeatureCard({ icon: Icon, title, desc, delay }) {
  return (
    <motion.div

      className="group relative"
    >
      {/* ── BORDER GLOW ── */}
      <div className="absolute -inset-[1px] bg-gradient-to-br from-blue-200/0 via-blue-300/0 to-cyan-200/0 group-hover:from-blue-300 group-hover:via-blue-200 group-hover:to-cyan-300 rounded-3xl transition-all duration-500 -z-10" />

      <div className="h-full p-8 bg-blue-50/80 border-2 border-blue-100/50 backdrop-blur-xl rounded-3xl transition-all duration-300 group-hover:bg-gradient-to-br group-hover:from-blue-50 group-hover:via-white/60 group-hover:to-blue-50 group-hover:border-blue-200 shadow-lg shadow-blue-900/5 group-hover:shadow-xl group-hover:shadow-blue-900/10 group-hover:-translate-y-2">
        <div className="relative mb-8 inline-block">
          {/* Icon Glow */}
          <div className="absolute inset-0 bg-blue-400/20 blur-xl rounded-full -z-10 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="w-14 h-14 flex items-center justify-center bg-blue-50 border border-blue-100 rounded-2xl text-blue-600 group-hover:text-white group-hover:bg-blue-600 transition-all duration-300 shadow-sm shadow-blue-900/5">
            <Icon size={28} />
          </div>
        </div>

        <h3 className="text-xl font-black text-navy-950 mb-4 tracking-tight">{title}</h3>
        <p className="text-slate-600 leading-relaxed font-light text-sm group-hover:text-slate-700 transition-colors">
          {desc}
        </p>
      </div>
    </motion.div>
  );
}


import HeroSection from "../components/HeroSection";

export default function Landing() {
  const features = [
    {
      icon: UploadCloud,
      title: "Smart Content Upload",
      desc: "Quickly upload PDFs and documents to create a searchable study library.",
      delay: 0.1
    },
    {
      icon: Brain,
      title: "AI Question Creation",
      desc: "Our AI creates precise multiple-choice and essay questions from your material.",
      delay: 0.2
    },
    {
      icon: ShieldCheck,
      title: "Safe Exam System",
      desc: "Advanced browser-locking and monitoring to ensure total exam security.",
      delay: 0.3
    },
    {
      icon: Zap,
      title: "Fast AI Grading",
      desc: "Instant, accurate grading for any exam with human-level reasoning.",
      delay: 0.4
    },
    {
      icon: BarChart3,
      title: "Performance Reports",
      desc: "Visual maps and data to track how students and classes are performing.",
      delay: 0.5
    },
    {
      icon: Users,
      title: "Team Management",
      desc: "Easy controls for teachers, admins, and department heads.",
      delay: 0.6
    }
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-blue-50/10 -mt-16">
      {/* ── PREMIUM TEXTURE OVERLAY ── */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none z-50 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

      <HeroSection 
        height="min-h-[75vh]"
        title="Assessments made"
        highlight="intelligent."
        subtitle="Empowering institutions with enterprise-grade AI examination layers, delivering secure exam protocols and automated multi-pass grading."
      >
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-16 pt-3">
          <Link to="/register" className="group px-10 py-3 bg-blue-500 text-white rounded-xl font-black text-sm hover:scale-105 transition-all duration-300 shadow-xl shadow-blue-500/20 hover:shadow-blue-500/40 flex items-center gap-3">
            GET STARTED <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link to="/features" className="px-8 py-3 border-b border-blue-400/30 text-blue-200 hover:text-white hover:border-white transition-all font-bold uppercase tracking-widest text-[10px]">
            VIEW ALL FEATURES
          </Link>
        </div>

        {/* Subtle Metrics Bar */}
        <div className="flex justify-center gap-10 md:gap-16 opacity-90">
          <div className="text-center">
            <p className="text-2xl font-black text-white">10x</p>
            <p className="text-[8px] font-bold text-blue-400 uppercase tracking-widest">Efficiency</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-black text-white">99.8%</p>
            <p className="text-[8px] font-bold text-blue-400 uppercase tracking-widest">Accurate</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-black text-white">SOTA</p>
            <p className="text-[8px] font-bold text-blue-400 uppercase tracking-widest">Models</p>
          </div>
        </div>
      </HeroSection>

      {/* ── FEATURES ── */}
      <section className="py-20 border-t border-slate-100 relative z-10 bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] mb-3">Core Capabilities</p>
            <h2 className="text-4xl md:text-5xl font-black text-navy-950 mb-4 tracking-tight">The Neural Mesh Protocol.</h2>
            <div className="w-16 h-1 bg-gradient-to-r from-blue-600 to-cyan-400 mx-auto rounded-full mb-6" />
            <p className="text-slate-600 max-w-xl mx-auto text-base font-light italic font-serif">"A singular ecosystem for the entire assessment lifecycle."</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <FeatureCard key={i} {...f} />
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-20 border-t border-slate-100 relative z-10">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] mb-3">Deployment</p>
            <h2 className="text-4xl font-black text-navy-950 mb-4 tracking-tight">System on-boarding.</h2>
            <p className="text-slate-600 max-w-lg mx-auto text-sm font-light">Integrating AI-first assessment layers into your institution's infrastructure takes minutes, not months.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
            <div className="hidden md:block absolute top-8 left-[10%] right-[10%] h-[1px] bg-gradient-to-r from-blue-500/0 via-blue-200 to-blue-500/0 -z-10" />
            <StepCard number="1" title="Upload Content" desc="Securely upload your course material and documents." delay={0.1} />
            <StepCard number="2" title="AI Learns" desc="The system learns your content to generate perfect questions." delay={0.2} />
            <StepCard number="3" title="Secure Send" desc="Send out safe, monitored exams to your students." delay={0.3} />
            <StepCard number="4" title="Smart Grading" desc="AI grades every answer automatically with clear feedback." delay={0.4} />
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-32 relative z-10 overflow-hidden">
        {/* CTA Backdrop Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-blue-400/20 rounded-full blur-[150px] -z-10" />

        <div className="max-w-4xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="text-center p-16 rounded-[3rem] bg-blue-600 border border-blue-500 backdrop-blur-3xl shadow-2xl shadow-blue-900/20 relative overflow-hidden transition-all duration-500 hover:bg-gradient-to-br hover:from-blue-600 hover:via-blue-500 hover:to-blue-700 group"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-50" />

            <h2 className="text-4xl md:text-5xl font-black text-white mb-6 tracking-tight">Upgrade your exams today.</h2>
            <p className="text-blue-100 mb-12 text-lg max-w-xl mx-auto font-light leading-relaxed">Join thousands of teachers using our easy-to-use AI exam platform.</p>

            <Link to="/register" className="group h-16 px-12 bg-white text-blue-600 rounded-2xl font-black text-lg hover:scale-105 transition-all duration-300 shadow-xl shadow-black/10 hover:shadow-black/20 inline-flex items-center gap-4 uppercase">
              START NOW <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}


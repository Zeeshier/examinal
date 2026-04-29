import { motion } from "framer-motion";
import {
  Upload, Brain, Shield, Zap, BarChart3, Users,
  FileText, Database, Lock, Eye, CheckCircle, Cpu,
  Sparkles, ArrowRight, ShieldCheck, UploadCloud
} from "lucide-react";
import ParticleBackground from "../components/ParticleBackground";

/**
 * ── FEATURE CARD (ADVANCED BENTO) ──
 */
function FeatureBentoCard({ icon: Icon, title, desc, tags, delay, className = "", isBlue }) {
  const bgClass = isBlue 
    ? "bg-blue-600 border-blue-500/50 group-hover:bg-blue-700 group-hover:border-blue-400 shadow-blue-900/10 group-hover:shadow-blue-900/20"
    : "bg-white/90 border-slate-200/70 group-hover:bg-white group-hover:border-blue-200 shadow-blue-900/5 group-hover:shadow-blue-900/10";
    
  const textTitleClass = isBlue ? "text-white" : "text-navy-950";
  const textDescClass = isBlue ? "text-blue-100 group-hover:text-white" : "text-slate-600 group-hover:text-slate-700";
  const iconWrapperClass = isBlue 
    ? "bg-blue-500 border-blue-400 text-white group-hover:text-blue-600 group-hover:bg-white shadow-black/10"
    : "bg-blue-50 border-blue-100 text-blue-600 group-hover:text-white group-hover:bg-blue-600 shadow-blue-900/5";
  const tagClass = isBlue
    ? "bg-blue-500/50 border-blue-400 text-blue-100 group-hover:border-white group-hover:text-white"
    : "bg-white border-slate-200 text-slate-500 group-hover:border-blue-300 group-hover:text-blue-600";

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay }}
      className={`group relative flex flex-col ${className}`}
    >
      {/* Liquid Border Layer */}
      <div className="absolute -inset-[1px] bg-gradient-to-br from-blue-200/0 via-blue-300/0 to-cyan-200/0 group-hover:from-blue-300 group-hover:via-blue-200 group-hover:to-cyan-300 rounded-3xl transition-all duration-500 -z-10" />
      
      <div className={`h-full p-8 md:p-10 backdrop-blur-xl rounded-3xl transition-all duration-300 shadow-lg overflow-hidden relative border ${bgClass}`}>
        {/* Subtle Background Glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-400/10 blur-[80px] group-hover:bg-blue-400/20 transition-all" />
        
        <div className="relative mb-8 inline-block">
          <div className="absolute inset-0 bg-blue-400/20 blur-xl rounded-full -z-10 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className={`w-16 h-16 flex items-center justify-center rounded-2xl transition-all duration-300 shadow-sm ${iconWrapperClass}`}>
            <Icon size={32} />
          </div>
        </div>
        
        <h3 className={`text-2xl font-black mb-4 tracking-tight ${textTitleClass}`}>{title}</h3>
        <p className={`leading-relaxed font-light text-base mb-8 max-w-xl transition-colors ${textDescClass}`}>
          {desc}
        </p>

        <div className="flex flex-wrap gap-2 mt-auto">
          {tags.map((t) => (
            <span key={t} className={`px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-full transition-all border ${tagClass}`}>
              {t}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export default function Features() {
  const features = [
    {
      icon: UploadCloud,
      title: "Smart Content Upload",
      desc: "Quickly upload materials like PDFs and documents. Our AI reads and organizes your content with 99.8% precision.",
      tags: ["Smart Parsing", "Auto Organize", "Cloud Sync"],
      className: "md:col-span-2",
      delay: 0.1
    },
    {
      icon: Brain,
      title: "AI Question Creation",
      desc: "Our AI creates precise multiple-choice and essay questions based on your material and school standards.",
      tags: ["AI Powered", "Context Aware", "Easy Creation"],
      className: "md:col-span-3",
      delay: 0.2,
      isBlue: true
    },
    {
      icon: ShieldCheck,
      title: "Safe Exam System",
      desc: "Block browser tabs, copy/paste, and more to ensure your exams are fair and secure.",
      tags: ["Browser Lockdown", "Tab Detection", "Activity Log", "Anti Cheat"],
      className: "md:col-span-3",
      delay: 0.3,
      isBlue: true
    },
    {
      icon: Zap,
      title: "Fast AI Grading",
      desc: "Get instant, accurate grading for any answer. The system automatically flags any unsure cases for you to check.",
      tags: ["Instant Results", "Auto Check", "Scalable"],
      className: "md:col-span-2",
      delay: 0.4
    },
    {
      icon: BarChart3,
      title: "Detailed Reports",
      desc: "See exactly how students are performing. Identify where they need help most with easy-to-read charts.",
      tags: ["Progress Map", "Identify Gaps", "Export Data"],
      className: "md:col-span-2",
      delay: 0.5
    },
    {
      icon: Cpu,
      title: "High-Performance AI",
      desc: "Built on world-class AI infrastructure for fast, reliable performance even during the biggest exams.",
      tags: ["Fast Access", "Reliable", "Scalable"],
      className: "md:col-span-3",
      delay: 0.6,
      isBlue: true
    }
  ];

  return (
    <div className="relative min-h-screen overflow-hidden pt-16 pb-16 bg-white">
      {/* ── BACKDROP AMBIENCE ── */}
      <div className="absolute top-0 left-0 w-full h-[500px] overflow-hidden z-0 pointer-events-none opacity-60">
        <ParticleBackground />
        <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-white to-transparent" />
      </div>
      <div className="absolute top-0 right-0 w-[800px] h-[600px] bg-blue-400/10 rounded-full blur-[150px] -z-10" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-cyan-400/10 rounded-full blur-[120px] -z-10" />
      
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* ── HEADER ── */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12 relative"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 border border-blue-100 rounded-full mb-8 backdrop-blur-md shadow-sm shadow-blue-900/5">
            <Sparkles size={11} className="text-blue-600" />
            <span className="text-[9px] font-black uppercase tracking-[0.4em] text-blue-600">Platform Features v4.0</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black text-navy-950 mb-8 tracking-tighter">
            Engineered for <br/>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 italic">
              Modern Education.
            </span>
          </h1>
          <div className="w-24 h-1.5 bg-gradient-to-r from-blue-600 to-cyan-400 mx-auto rounded-full mb-8" />
          <p className="text-slate-600 max-w-2xl mx-auto text-xl font-light leading-relaxed">
            Every layer of the Examinal system is designed for total exam security, 
            instant grading, and world-class reliability.
          </p>
        </motion.div>

        {/* ── BENTO GRID ── */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {features.map((f, i) => (
            <FeatureBentoCard key={i} {...f} />
          ))}
        </div>
      </div>
    </div>
  );
}


import { motion } from "framer-motion";
import { 
  Linkedin, Twitter, Mail, 
  Brain, Code, Rocket, 
  Sparkles, Shield, Zap 
} from "lucide-react";
import ParticleBackground from "../components/ParticleBackground";

/**
 * ── TEAM MEMBER CARD ──
 */
function MemberCard({ name, role, desc, image, delay, social = {} }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
      className="group relative"
    >
      <div className="relative overflow-hidden rounded-[2.5rem] bg-white/90 border border-slate-200/70 shadow-lg shadow-blue-900/5 backdrop-blur-3xl transition-all duration-500 group-hover:border-blue-200 group-hover:bg-white group-hover:shadow-xl group-hover:shadow-blue-900/10">
        {/* Image Container */}
        <div className="aspect-[4/5] relative overflow-hidden">
          <img 
            src={image} 
            alt={name} 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-80 group-hover:opacity-60 transition-opacity" />
          
          {/* Social Links on Hover */}
          <div className="absolute bottom-6 left-6 right-6 flex gap-3 translate-y-12 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
            {social.linkedin && (
              <a href={social.linkedin} className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-blue-600 hover:border-blue-500 transition-all">
                <Linkedin size={18} />
              </a>
            )}
            {social.twitter && (
              <a href={social.twitter} className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-blue-400 hover:border-blue-300 transition-all">
                <Twitter size={18} />
              </a>
            )}
            {social.email && (
              <a href={`mailto:${social.email}`} className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-red-600 hover:border-red-500 transition-all">
                <Mail size={18} />
              </a>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="p-8">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400">{role}</span>
          </div>
          <h3 className="text-2xl font-black text-navy-950 mb-4 tracking-tight">{name}</h3>
          <p className="text-sm text-slate-600 leading-relaxed font-light group-hover:text-slate-700 transition-colors">
            {desc}
          </p>
        </div>
      </div>
      
      {/* Glow Effect */}
      <div className="absolute -inset-2 bg-blue-500/10 rounded-[3rem] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity -z-10" />
    </motion.div>
  );
}

export default function Team() {
  const team = [
    {
      name: "Aryan Ijaz",
      role: "Backend Development",
      desc: "Designing the robust FastAPI architecture and secure database schemas for mission-critical reliability. (Reg #: 70157692)",
      image: "/team/vector1.png",
      delay: 0.1,
      social: { linkedin: "#", email: "aryan@uol.edu.pk" }
    },
    {
      name: "Zeeshan Ahmad",
      role: "AI Development",
      desc: "Specializing in RAG (Retrieval-Augmented Generation) and NLP to drive the automated question generation engine. (Reg #: 70169515)",
      image: "/team/vector1.png",
      delay: 0.2,
      social: { linkedin: "#", email: "zeeshan@uol.edu.pk" }
    },
    {
      name: "M Ali Irtiza",
      role: "UI/UX & Documentation",
      desc: "Crafting the premium user experience and maintaining comprehensive technical documentations. (Reg #: 70159406)",
      image: "/team/vector1.png",
      delay: 0.3,
      social: { linkedin: "#", email: "ali@uol.edu.pk" }
    }
  ];

  return (
    <div className="pt-24 pb-32 relative overflow-hidden min-h-screen bg-white">
      {/* ── AMBIENT BACKDROP ── */}
      <div className="absolute top-0 left-0 w-full h-[500px] overflow-hidden z-0 pointer-events-none opacity-60">
        <ParticleBackground />
        <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-white to-transparent" />
      </div>
      <div className="absolute top-0 left-1/4 w-[800px] h-[800px] bg-blue-400/10 rounded-full blur-[150px] -z-10" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-blue-400/10 rounded-full blur-[120px] -z-10" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* ── HEADER ── */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 border border-blue-100 rounded-full mb-8 backdrop-blur-md shadow-sm shadow-blue-900/5">
            <Sparkles size={11} className="text-blue-600" />
            <span className="text-[9px] font-black uppercase tracking-[0.4em] text-blue-600">University of Lahore</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black text-navy-950 mb-8 tracking-tighter">
            The FYP Team <br/>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 italic">
              Academic Excellence.
            </span>
          </h1>
          <p className="text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto font-light">
            Working under the Department of Computer Science, Sargodha Campus, to redefine automated academic assessments.
          </p>
        </motion.div>

        {/* ── TEAM GRID ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {team.map((member, i) => (
            <MemberCard key={i} {...member} />
          ))}
        </div>

        {/* ── SUPERVISOR SECTION ── */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-32 max-w-4xl mx-auto p-12 rounded-[3.5rem] bg-white border border-slate-200 shadow-2xl shadow-blue-900/5 backdrop-blur-3xl relative overflow-hidden"
        >
           <div className="flex flex-col md:flex-row items-center gap-12">
              <div className="w-40 h-40 rounded-full overflow-hidden bg-white flex items-center justify-center border border-slate-200 shrink-0">
                  <img src="/team/supervisor.png" alt="Supervisor" className="w-full h-full object-cover" />
              </div>
              <div>
                 <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-100 rounded-full mb-4 shadow-sm shadow-blue-900/5">
                    <Shield size={10} className="text-blue-600" />
                    <span className="text-[8px] font-black uppercase tracking-widest text-blue-600">Supervisor</span>
                 </div>
                 <h3 className="text-3xl font-black text-navy-950 mb-2">Ms. Saira Moin</h3>
                 <p className="text-slate-600 font-light leading-relaxed">
                   Providing critical guidance and academic oversight for the Examinal project, ensuring the platform meets the highest pedagogical and technical standards.
                 </p>
              </div>
           </div>
        </motion.div>

        {/* ── MISSION SECTION ── */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="mt-32 p-12 md:p-24 rounded-[4rem] bg-blue-600 border border-blue-500 shadow-2xl shadow-blue-900/20 backdrop-blur-3xl relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/50 to-transparent" />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500 border border-blue-400 rounded-full mb-6 shadow-sm shadow-black/10">
                <Rocket size={10} className="text-white" />
                <span className="text-[8px] font-black uppercase tracking-widest text-white">Our North Star</span>
              </div>
              <h2 className="text-4xl font-black text-white mb-6 tracking-tight">Driven by a Shared Mission.</h2>
              <p className="text-blue-100 font-light leading-relaxed mb-8">
                At Examinal, our goal isn't just to build tools, but to redefine the standard of academic integrity and efficiency. We believe that every student deserves a fair chance, and every educator deserves more time to inspire.
              </p>
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-500 flex items-center justify-center text-white border border-blue-400 shadow-sm shadow-black/10">
                    <Shield size={14} />
                  </div>
                  <span className="text-xs font-bold text-white tracking-tight">Integrity by Design</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-500 flex items-center justify-center text-white border border-blue-400 shadow-sm shadow-black/10">
                    <Zap size={14} />
                  </div>
                  <span className="text-xs font-bold text-white tracking-tight">Speed with Accuracy</span>
                </div>
              </div>
            </div>
            
            <div className="relative group perspective-[1000px]">
              <motion.div 
                whileHover={{ 
                  rotateY: -8, 
                  rotateX: 5,
                  scale: 1.02,
                  translateZ: 20
                }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="aspect-video rounded-[3rem] bg-blue-700/50 border border-blue-500 overflow-hidden relative flex items-center justify-center shadow-xl shadow-black/10 backdrop-blur-3xl transform-gpu"
              >
                 {/* Neural Grid/Mesh Backdrop */}
                 <div className="absolute inset-0 opacity-40 bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:40px_40px]" />
                 
                 {/* Moving Neural Hub */}
                 <motion.div 
                    animate={{ 
                       background: [
                          "radial-gradient(circle at 50% 50%, rgba(37, 99, 235, 0.15) 0%, transparent 70%)",
                          "radial-gradient(circle at 80% 20%, rgba(37, 99, 235, 0.25) 0%, transparent 70%)",
                          "radial-gradient(circle at 20% 80%, rgba(37, 99, 235, 0.15) 0%, transparent 70%)",
                          "radial-gradient(circle at 50% 50%, rgba(37, 99, 235, 0.15) 0%, transparent 70%)"
                       ]
                    }}
                    transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0"
                 />
                 
                 {/* Pulsing Core */}
                 <div className="relative z-10 flex items-center justify-center">
                    {/* Ripple Rings */}
                    {[...Array(3)].map((_, i) => (
                       <motion.div
                          key={i}
                          animate={{ 
                             scale: [1, 2.5],
                             opacity: [0.4, 0]
                          }}
                          transition={{ 
                             duration: 4, 
                             repeat: Infinity, 
                             delay: i * 1.3,
                             ease: "easeOut"
                          }}
                          className="absolute w-20 h-20 border border-blue-500/30 rounded-full"
                       />
                    ))}
                    
                    <motion.div
                       animate={{ 
                          scale: [1, 1.05, 1],
                          filter: ["drop-shadow(0 0 20px rgba(37,99,235,0.2))", "drop-shadow(0 0 40px rgba(37,99,235,0.6))", "drop-shadow(0 0 20px rgba(37,99,235,0.2))"]
                       }}
                       transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    >
                       <Brain className="text-blue-300 w-24 h-24 relative z-20 opacity-40 group-hover:opacity-100 transition-opacity duration-700" />
                    </motion.div>
                 </div>

                 <div className="absolute inset-0 bg-blue-600/5 mix-blend-overlay group-hover:bg-blue-600/0 transition-all opacity-30" />
              </motion.div>
              
              {/* Outer Glows */}
              <div className="absolute -top-12 -right-12 w-64 h-64 bg-blue-500/10 rounded-full blur-[100px] -z-10 group-hover:bg-blue-500/20 transition-all duration-700" />
              <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-cyan-500/10 rounded-full blur-[100px] -z-10 group-hover:bg-cyan-500/20 transition-all duration-700" />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}


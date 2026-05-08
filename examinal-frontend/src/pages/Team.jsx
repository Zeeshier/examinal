import { motion } from "framer-motion";
import {
  Linkedin, Twitter, Mail,
  Brain, Rocket,
  Sparkles, Shield, Zap,
} from "lucide-react";
import HeroSection from "../components/HeroSection";

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
      {/* Border glow */}
      <div className="absolute -inset-[1px] bg-gradient-to-br from-blue-200/0 via-blue-300/0 to-cyan-200/0 group-hover:from-blue-300 group-hover:via-blue-200 group-hover:to-cyan-300 rounded-[2.5rem] transition-all duration-500 -z-10" />

      <div className="relative overflow-hidden rounded-[2.5rem] bg-blue-50/80 border-2 border-blue-100/50 shadow-lg shadow-blue-900/5 backdrop-blur-xl group-hover:bg-gradient-to-br group-hover:from-blue-50 group-hover:via-white/60 group-hover:to-blue-50 group-hover:border-blue-200 group-hover:shadow-xl group-hover:shadow-blue-900/10 group-hover:-translate-y-2 transition-all duration-300">

        {/* Image Container */}
        <div className="aspect-[4/5] relative overflow-hidden">
          <img
            src={image}
            alt={name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-blue-950 via-blue-900/30 to-transparent opacity-70 group-hover:opacity-50 transition-opacity" />

          {/* Social Links on Hover */}
          <div className="absolute bottom-6 left-6 right-6 flex gap-3 translate-y-12 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
            {social.linkedin && (
              <a
                href={social.linkedin}
                className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-blue-600 hover:border-blue-500 transition-all"
              >
                <Linkedin size={18} />
              </a>
            )}
            {social.twitter && (
              <a
                href={social.twitter}
                className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-blue-400 hover:border-blue-300 transition-all"
              >
                <Twitter size={18} />
              </a>
            )}
            {social.email && (
              <a
                href={`mailto:${social.email}`}
                className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-blue-700 hover:border-blue-600 transition-all"
              >
                <Mail size={18} />
              </a>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="p-8">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-500">{role}</span>
          </div>
          <h3 className="text-2xl font-black text-slate-800 mb-4 tracking-tight">{name}</h3>
          <p className="text-sm text-slate-500 leading-relaxed font-light group-hover:text-slate-700 transition-colors">
            {desc}
          </p>
        </div>
      </div>

      {/* Blue glow */}
      <div className="absolute -inset-2 bg-blue-400/10 rounded-[3rem] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity -z-10" />
    </motion.div>
  );
}

export default function Team() {
  const team = [
    {
      name: "Aryan Ijaz",
      role: "Backend Development",
      desc: "Designing the robust FastAPI architecture and secure database schemas for mission-critical reliability. (Reg #: 70157692)",
      image: "/team/aryan.png",
      delay: 0.1,
      social: { linkedin: "#", email: "aryan@uol.edu.pk" },
    },
    {
      name: "Zeeshan Ahmad",
      role: "AI Development",
      desc: "Specializing in RAG (Retrieval-Augmented Generation) and NLP to drive the automated question generation engine. (Reg #: 70169515)",
      image: "/team/zeeshan.png",
      delay: 0.2,
      social: { linkedin: "#", email: "zeeshan@uol.edu.pk" },
    },
    {
      name: "M Ali Irtiza",
      role: "UI/UX & Documentation",
      desc: "Crafting the premium user experience and maintaining comprehensive technical documentations. (Reg #: 70159406)",
      image: "/team/ali.png",
      delay: 0.3,
      social: { linkedin: "#", email: "ali@uol.edu.pk" },
    },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-blue-50/10 -mt-16">
      {/* Texture overlay */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none z-50 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

      {/* Ambient backdrop */}
      <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-blue-400/10 rounded-full blur-[120px] -z-10" />

      <HeroSection
        height="min-h-[50vh]"
        tag="University of Lahore · Sargodha Campus"
        title="The FYP Team"
        highlight="Academic Excellence."
        subtitle="Working under the Department of Computer Science to redefine automated academic assessments through intelligent AI."
      />

      <div className="max-w-7xl mx-auto px-6 relative z-10 py-16">

        {/* ── TEAM GRID ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-24">
          {team.map((member, i) => (
            <MemberCard key={i} {...member} />
          ))}
        </div>

        {/* ── SUPERVISOR SECTION ── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="group relative mb-24"
        >
          <div className="absolute -inset-[1px] bg-gradient-to-br from-blue-200/0 via-blue-300/0 to-cyan-200/0 group-hover:from-blue-300 group-hover:via-blue-200 group-hover:to-cyan-300 rounded-[3rem] transition-all duration-500 -z-10" />
          <div className="p-12 rounded-[3rem] bg-blue-50/80 border-2 border-blue-100/50 shadow-lg shadow-blue-900/5 backdrop-blur-xl group-hover:bg-gradient-to-br group-hover:from-blue-50 group-hover:via-white/60 group-hover:to-blue-50 group-hover:border-blue-200 group-hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">

            <div className="flex flex-col md:flex-row items-center gap-12">
              {/* Avatar */}
              <div className="w-36 h-36 rounded-full overflow-hidden bg-blue-100 flex items-center justify-center border-4 border-blue-200 shadow-xl shadow-blue-900/10 shrink-0 group-hover:border-blue-400 transition-all duration-300">
                <img
                  src="/team/supervisor.png"
                  alt="Supervisor"
                  className="w-full h-full object-cover"
                />
              </div>

              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 border border-blue-200 rounded-full mb-4">
                  <Shield size={10} className="text-blue-500" />
                  <span className="text-[8px] font-black uppercase tracking-widest text-blue-500">Project Supervisor</span>
                </div>
                <h3 className="text-3xl font-black text-slate-800 mb-2 tracking-tight">Ms. Saira Moin</h3>
                <p className="text-slate-500 font-light leading-relaxed max-w-xl group-hover:text-slate-700 transition-colors">
                  Providing critical guidance and academic oversight for the Examinal project, ensuring the platform meets the highest pedagogical and technical standards of the University of Lahore.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── MISSION SECTION ── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="p-10 md:p-16 rounded-[3rem] bg-blue-600 border border-blue-500 shadow-2xl shadow-blue-900/20 relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/50 to-transparent" />
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-400/20 blur-[100px] rounded-full" />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10">
            {/* Text side */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/60 border border-blue-400 rounded-full mb-6">
                <Rocket size={10} className="text-blue-200" />
                <span className="text-[8px] font-black uppercase tracking-widest text-blue-100">Our North Star</span>
              </div>
              <h2 className="text-4xl font-black text-white mb-6 tracking-tight">Driven by a Shared Mission.</h2>
              <p className="text-blue-100 font-light leading-relaxed mb-8">
                At Examinal, our goal isn't just to build tools, but to redefine the standard of academic integrity and efficiency. We believe every student deserves a fair chance, and every educator deserves more time to inspire.
              </p>
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-500 border border-blue-400 flex items-center justify-center text-white">
                    <Shield size={14} />
                  </div>
                  <span className="text-xs font-black text-white tracking-tight uppercase">Integrity by Design</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-500 border border-blue-400 flex items-center justify-center text-white">
                    <Zap size={14} />
                  </div>
                  <span className="text-xs font-black text-white tracking-tight uppercase">Speed with Accuracy</span>
                </div>
              </div>
            </div>

            {/* Animated Brain visual */}
            <div className="relative group perspective-[1000px]">
              <motion.div
                whileHover={{ rotateY: -8, rotateX: 5, scale: 1.02 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="aspect-video rounded-[2.5rem] bg-blue-700/50 border border-blue-400/30 overflow-hidden relative flex items-center justify-center shadow-2xl backdrop-blur-3xl transform-gpu"
              >
                {/* Grid backdrop */}
                <div className="absolute inset-0 opacity-[0.06] bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:40px_40px]" />

                {/* Moving radial glow */}
                <motion.div
                  animate={{
                    background: [
                      "radial-gradient(circle at 50% 50%, rgba(147,197,253,0.20) 0%, transparent 70%)",
                      "radial-gradient(circle at 80% 20%, rgba(147,197,253,0.30) 0%, transparent 70%)",
                      "radial-gradient(circle at 20% 80%, rgba(147,197,253,0.20) 0%, transparent 70%)",
                      "radial-gradient(circle at 50% 50%, rgba(147,197,253,0.20) 0%, transparent 70%)",
                    ],
                  }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0"
                />

                {/* Pulsing rings + brain */}
                <div className="relative z-10 flex items-center justify-center">
                  {[...Array(3)].map((_, i) => (
                    <motion.div
                      key={i}
                      animate={{ scale: [1, 2.5], opacity: [0.4, 0] }}
                      transition={{ duration: 4, repeat: Infinity, delay: i * 1.3, ease: "easeOut" }}
                      className="absolute w-20 h-20 border border-blue-300/40 rounded-full"
                    />
                  ))}
                  <motion.div
                    animate={{
                      scale: [1, 1.05, 1],
                      filter: [
                        "drop-shadow(0 0 20px rgba(147,197,253,0.3))",
                        "drop-shadow(0 0 50px rgba(147,197,253,0.7))",
                        "drop-shadow(0 0 20px rgba(147,197,253,0.3))",
                      ],
                    }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <Brain className="text-white w-24 h-24 relative z-20 opacity-30 group-hover:opacity-100 transition-opacity duration-700" />
                  </motion.div>
                </div>
              </motion.div>

              {/* Outer glows */}
              <div className="absolute -top-12 -right-12 w-64 h-64 bg-blue-300/20 rounded-full blur-[100px] -z-10 group-hover:bg-blue-300/30 transition-all duration-700" />
              <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-cyan-400/10 rounded-full blur-[100px] -z-10 group-hover:bg-cyan-400/20 transition-all duration-700" />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

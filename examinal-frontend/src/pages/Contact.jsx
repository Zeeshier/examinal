import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Send, Mail, MapPin, MessageSquare, ArrowRight, Clock } from "lucide-react";
import toast from "react-hot-toast";
import API, { formatError } from "../api/axios";
import HeroSection from "../components/HeroSection";

// ── Client-side rate limit: max 1 submission per 60 seconds ──
const COOLDOWN_SECONDS = 60;

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [sending, setSending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const cooldownRef = useRef(null);

  const startCooldown = () => {
    setCooldown(COOLDOWN_SECONDS);
    cooldownRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(cooldownRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (cooldown > 0) {
      toast.error(`Please wait ${cooldown}s before sending another message.`);
      return;
    }
    // Basic field validation
    if (!form.name.trim() || form.name.trim().length < 2) {
      toast.error("Please enter your full name (at least 2 characters).");
      return;
    }
    if (!form.message.trim() || form.message.trim().length < 10) {
      toast.error("Message must be at least 10 characters.");
      return;
    }

    setSending(true);
    try {
      await API.post("/api/contact/", form);
      toast.success("Message sent! We'll get back to you soon.");
      setForm({ name: "", email: "", subject: "", message: "" });
      startCooldown();
    } catch (err) {
      toast.error(formatError(err));
    } finally {
      setSending(false);
    }
  };

  const isDisabled = sending || cooldown > 0;

  return (
    <div className="relative min-h-screen overflow-hidden bg-blue-50/10 -mt-16">
      {/* Local inline noise texture — no external request */}
      <div
        className="absolute inset-0 pointer-events-none z-50"
        style={{
          opacity: 0.03,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
          backgroundSize: "200px 200px",
        }}
      />

      {/* Ambient backdrop */}
      <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-blue-400/10 rounded-full blur-[120px] -z-10" />

      <HeroSection
        height="min-h-[50vh]"
        tag="Contact Us"
        title="Feel Free To"
        highlight="Reach Out."
        subtitle="Have questions about Examinal? Send us a message and our team will get back to you as soon as possible."
      />

      <div className="max-w-6xl mx-auto px-6 relative z-10 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-16 items-start">

          {/* ── CONTACT INFO NODES ── */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-2 space-y-5"
          >
            {[
              { icon: Mail, label: "Our Email", value: "hello@examinal.com" },
              { icon: MapPin, label: "Our Location", value: "University of Lahore, Sargodha Campus" },
              { icon: MessageSquare, label: "Help & Support", value: "support@examinal.com" },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="group relative"
              >
                {/* Border glow */}
                <div className="absolute -inset-[1px] bg-gradient-to-br from-blue-200/0 via-blue-300/0 to-cyan-200/0 group-hover:from-blue-300 group-hover:via-blue-200 group-hover:to-cyan-300 rounded-2xl transition-all duration-500 -z-10" />

                <div className="flex items-center gap-5 p-6 rounded-2xl bg-blue-50/80 border-2 border-blue-100/50 shadow-lg shadow-blue-900/5 backdrop-blur-xl group-hover:bg-gradient-to-br group-hover:from-blue-50 group-hover:via-white/60 group-hover:to-blue-50 group-hover:border-blue-200 group-hover:-translate-y-1 transition-all duration-300">
                  <div className="w-14 h-14 bg-blue-100 border border-blue-200 rounded-2xl flex items-center justify-center text-blue-500 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-all duration-300 flex-shrink-0 shadow-sm shadow-blue-900/5">
                    <item.icon size={22} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400 mb-1">{item.label}</p>
                    <p className="text-sm font-black text-slate-700 group-hover:text-blue-600 transition-colors">{item.value}</p>
                  </div>
                </div>
              </motion.div>
            ))}

            {/* ── Rate limit notice ── */}
            <div className="mt-6 p-4 rounded-2xl bg-blue-50 border border-blue-100">
              <p className="text-[10px] font-semibold text-blue-500 uppercase tracking-widest mb-1">Spam Protection</p>
              <p className="text-xs text-slate-500 leading-relaxed">
                To prevent abuse, you may only send one message per minute.
              </p>
            </div>
          </motion.div>

          {/* ── CONTACT FORM ── */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-3 group relative"
          >
            <div className="absolute -inset-[1px] bg-gradient-to-br from-blue-200/0 via-blue-300/0 to-cyan-200/0 group-hover:from-blue-300 group-hover:via-blue-200 group-hover:to-cyan-300 rounded-[3.5rem] transition-all duration-500 -z-10" />

            <form
              onSubmit={handleSubmit}
              className="p-10 md:p-12 rounded-[3.5rem] bg-blue-600 border border-blue-500 shadow-2xl shadow-blue-900/20 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-400/20 blur-[100px] rounded-full" />

              <div className="relative z-10 space-y-7">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-7">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-200 ml-1">Your Name</label>
                    <input
                      className="w-full bg-blue-500/50 border border-blue-400/50 rounded-2xl px-5 py-4 text-white placeholder-blue-300/60 focus:outline-none focus:border-white/60 focus:ring-1 focus:ring-white/30 transition-all font-light text-sm disabled:opacity-50"
                      placeholder="Enter your name..."
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      disabled={isDisabled}
                      required
                      minLength={2}
                      maxLength={255}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-200 ml-1">Email Address</label>
                    <input
                      className="w-full bg-blue-500/50 border border-blue-400/50 rounded-2xl px-5 py-4 text-white placeholder-blue-300/60 focus:outline-none focus:border-white/60 focus:ring-1 focus:ring-white/30 transition-all font-light text-sm disabled:opacity-50"
                      type="email"
                      placeholder="you@example.com"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      disabled={isDisabled}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-200 ml-1">Subject</label>
                  <input
                    className="w-full bg-blue-500/50 border border-blue-400/50 rounded-2xl px-5 py-4 text-white placeholder-blue-300/60 focus:outline-none focus:border-white/60 focus:ring-1 focus:ring-white/30 transition-all font-light text-sm disabled:opacity-50"
                    placeholder="Subject of your message..."
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    disabled={isDisabled}
                    required
                    maxLength={255}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-200 ml-1">
                    Your Message
                    <span className="ml-3 text-blue-300/60 font-normal normal-case tracking-normal">
                      ({form.message.length}/2000)
                    </span>
                  </label>
                  <textarea
                    className="w-full bg-blue-500/50 border border-blue-400/50 rounded-2xl px-5 py-4 text-white placeholder-blue-300/60 focus:outline-none focus:border-white/60 focus:ring-1 focus:ring-white/30 transition-all font-light text-sm min-h-[160px] resize-none disabled:opacity-50"
                    placeholder="How can we help?"
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    disabled={isDisabled}
                    required
                    minLength={10}
                    maxLength={2000}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isDisabled}
                  aria-disabled={isDisabled}
                  className="w-full h-14 bg-white text-blue-600 rounded-2xl font-black text-sm uppercase tracking-[0.2em] hover:bg-blue-50 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 shadow-lg shadow-black/10 disabled:opacity-50 disabled:cursor-not-allowed group motion-safe:hover:scale-[1.02]"
                >
                  {sending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      SENDING...
                    </>
                  ) : cooldown > 0 ? (
                    <>
                      <Clock size={18} />
                      WAIT {cooldown}s
                    </>
                  ) : (
                    <>
                      SEND MESSAGE
                      <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform motion-safe:group-hover:translate-x-1" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>

        </div>
      </div>
    </div>
  );
}

import { useState } from "react";
import { motion } from "framer-motion";
import { Send, Mail, MapPin, MessageSquare, Sparkles, ArrowRight, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";
import API from "../api/axios";
import ParticleBackground from "../components/ParticleBackground";

const contactValidators = {
  name: (v) => (!v || !v.trim()) ? "Name is required" : v.trim().length < 2 ? "Name must be at least 2 characters" : "",
  email: (v) => (!v || !v.trim()) ? "Email is required" : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? "Enter a valid email" : "",
  subject: (v) => (!v || !v.trim()) ? "Subject is required" : v.trim().length < 3 ? "Subject must be at least 3 characters" : "",
  message: (v) => (!v || !v.trim()) ? "Message is required" : v.trim().length < 10 ? "Message must be at least 10 characters" : "",
};

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [sending, setSending] = useState(false);
  const [touched, setTouched] = useState({});
  const [errors, setErrors] = useState({});

  const validateAll = () => {
    const errs = {};
    for (const key of Object.keys(contactValidators)) {
      const err = contactValidators[key](form[key]);
      if (err) errs[key] = err;
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleBlur = (field) => () => {
    setTouched({ ...touched, [field]: true });
    setErrors({ ...errors, [field]: contactValidators[field](form[field]) });
  };

  const handleChange = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value });
    if (touched[field]) {
      setErrors({ ...errors, [field]: contactValidators[field](e.target.value) });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ name: true, email: true, subject: true, message: true });
    if (!validateAll()) {
      toast.error("Please fix the errors before sending.");
      return;
    }
    setSending(true);
    try {
      const sanitized = {
        name: form.name.trim(),
        email: form.email.trim(),
        subject: form.subject.trim(),
        message: form.message.trim(),
      };
      await API.post("/api/contact/", sanitized);
      toast.success("Message sent! Core connection established.");
      setForm({ name: "", email: "", subject: "", message: "" });
      setTouched({});
      setErrors({});
    } catch (err) {
      toast.error(err.response?.data?.detail || "Transmission failed. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen pt-16 pb-16 relative overflow-hidden bg-white">
      {/* ── AMBIENT BACKDROP ── */}
      <div className="absolute top-0 left-0 w-full h-[500px] overflow-hidden z-0 pointer-events-none opacity-60">
        <ParticleBackground />
        <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-white to-transparent" />
      </div>
      <div className="absolute top-0 right-0 w-[800px] h-[600px] bg-blue-400/10 rounded-full blur-[150px] -z-10" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-cyan-400/10 rounded-full blur-[120px] -z-10" />

      <div className="max-w-6xl mx-auto px-6 relative z-10">
        {/* ── HEADER ── */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10 relative"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 border border-blue-100 rounded-full mb-8 backdrop-blur-md shadow-sm shadow-blue-900/5">
            <Sparkles size={11} className="text-blue-600" />
            <span className="text-[9px] font-black uppercase tracking-[0.4em] text-blue-600">Contact Us</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black text-navy-950 mb-8 tracking-tighter">
            Feel Free To  <br/>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 italic">
              Reach Out.    </span>
          </h1>
          <p className="text-slate-600 max-w-xl mx-auto text-xl font-light leading-relaxed">
            Have questions about Examinal? Send us a message and our team will get back to you as soon as possible.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-16 items-start">
          {/* ── CONTACT DATA NODES ── */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2 space-y-8"
          >
            {[
              { icon: Mail, label: "Our Email", value: "hello@examinal.com" },
              { icon: MapPin, label: "Our Location", value: "Cloud-based · Worldwide" },
              { icon: MessageSquare, label: "Help & Support", value: "support@examinal.com" },
            ].map((item, i) => (
              <div key={i} className="group flex items-center gap-6 p-6 rounded-3xl bg-white/90 border border-slate-200/70 hover:bg-white hover:border-blue-200 hover:shadow-xl hover:shadow-blue-900/10 shadow-lg shadow-blue-900/5 transition-all duration-300">
                <div className="w-14 h-14 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-center text-blue-600 shadow-sm shadow-blue-900/5 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 flex-shrink-0">
                  <item.icon size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-1">{item.label}</p>
                  <p className="text-lg font-black text-navy-950 tracking-tight group-hover:text-blue-600 transition-colors">{item.value}</p>
                </div>
              </div>
            ))}
          </motion.div>

          {/* ── COMMUNICATION INTERFACE ── */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-3"
          >
            <form onSubmit={handleSubmit} className="p-10 md:p-12 rounded-[3.5rem] bg-blue-600 border border-blue-500 shadow-2xl shadow-blue-900/20 backdrop-blur-3xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/50 to-transparent" />
              
              <div className="space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-white ml-1">Your Name</label>
                    <input 
                      className={`w-full bg-blue-700/50 border rounded-2xl px-6 py-4 text-white placeholder-white/70 focus:outline-none focus:ring-1 transition-all font-light shadow-sm shadow-black/10 ${touched.name && errors.name ? "border-red-300 focus:border-red-300 focus:ring-red-300/30" : "border-blue-500 focus:border-white focus:bg-blue-700 focus:ring-white/30"}`}
                      placeholder="Enter your name..." 
                      value={form.name} 
                      onChange={handleChange("name")}
                      onBlur={handleBlur("name")}
                    />
                    {touched.name && errors.name && <p className="flex items-center gap-1 text-xs text-red-200 mt-1 ml-1"><AlertCircle size={12} />{errors.name}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-white ml-1">Email Address</label>
                    <input 
                      className={`w-full bg-blue-700/50 border rounded-2xl px-6 py-4 text-white placeholder-white/70 focus:outline-none focus:ring-1 transition-all font-light shadow-sm shadow-black/10 ${touched.email && errors.email ? "border-red-300 focus:border-red-300 focus:ring-red-300/30" : "border-blue-500 focus:border-white focus:bg-blue-700 focus:ring-white/30"}`}
                      type="email" 
                      placeholder="you@example.com" 
                      value={form.email} 
                      onChange={handleChange("email")}
                      onBlur={handleBlur("email")}
                    />
                    {touched.email && errors.email && <p className="flex items-center gap-1 text-xs text-red-200 mt-1 ml-1"><AlertCircle size={12} />{errors.email}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-white ml-1">Subject</label>
                  <input 
                    className={`w-full bg-blue-700/50 border rounded-2xl px-6 py-4 text-white placeholder-white/70 focus:outline-none focus:ring-1 transition-all font-light shadow-sm shadow-black/10 ${touched.subject && errors.subject ? "border-red-300 focus:border-red-300 focus:ring-red-300/30" : "border-blue-500 focus:border-white focus:bg-blue-700 focus:ring-white/30"}`}
                    placeholder="Subject of your message..." 
                    value={form.subject} 
                    onChange={handleChange("subject")}
                    onBlur={handleBlur("subject")}
                  />
                  {touched.subject && errors.subject && <p className="flex items-center gap-1 text-xs text-red-200 mt-1 ml-1"><AlertCircle size={12} />{errors.subject}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-white ml-1">Your Message</label>
                  <textarea 
                    className={`w-full bg-blue-700/50 border rounded-2xl px-6 py-4 text-white placeholder-white/70 focus:outline-none focus:ring-1 transition-all font-light min-h-[160px] resize-none shadow-sm shadow-black/10 ${touched.message && errors.message ? "border-red-300 focus:border-red-300 focus:ring-red-300/30" : "border-blue-500 focus:border-white focus:bg-blue-700 focus:ring-white/30"}`}
                    placeholder="How can we help?" 
                    value={form.message} 
                    onChange={handleChange("message")}
                    onBlur={handleBlur("message")}
                  />
                  {touched.message && errors.message && <p className="flex items-center gap-1 text-xs text-red-200 mt-1 ml-1"><AlertCircle size={12} />{errors.message}</p>}
                </div>

                <button 
                  type="submit" 
                  disabled={sending} 
                  className="w-full h-16 bg-white text-blue-600 rounded-2xl font-black text-sm uppercase tracking-[0.2em] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-4 shadow-xl shadow-black/10 hover:shadow-black/20 disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  {sending ? "SENDING..." : (
                    <>
                      SEND MESSAGE <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
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


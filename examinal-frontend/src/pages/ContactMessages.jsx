import { useState, useEffect } from "react";
import API from "../api/axios";
import Header from "../components/Header";
import LoadingSpinner from "../components/LoadingSpinner";
import Modal from "../components/Modal";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, User, Calendar, MessageSquare, Search, Inbox, Filter, Clock, ChevronRight, Hash, X, Send, Reply, BellRing } from "lucide-react";

export default function ContactMessages() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedMsg, setSelectedMsg] = useState(null);
  const [replyMsg, setReplyMsg] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      const res = await API.get("/api/contact/");
      setMessages(res.data);
    } catch (err) {
      toast.error("Failed to load institutional feedback.");
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async () => {
    if (!replyText.trim()) return;
    setIsSending(true);
    try {
      await API.post(`/api/contact/${replyMsg.id}/reply`, { reply: replyText });
      toast.success("Response transmitted successfully!");
      setReplyMsg(null);
      setReplyText("");
      fetchMessages();
    } catch (err) {
      toast.error("Failed to transmit response.");
    } finally {
      setIsSending(false);
    }
  };

  const filtered = messages.filter(m => 
    m.name.toLowerCase().includes(search.toLowerCase()) || 
    m.subject.toLowerCase().includes(search.toLowerCase()) ||
    m.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="">
      <Header 
        title="Institutional Feedback" 
        subtitle="Review and manage communications from the Oracle network."
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
        <div className="card p-5">
           <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 mb-1">Total Inquiries</p>
                <p className="text-3xl font-bold text-navy-800">{messages.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                 <Inbox size={22} />
              </div>
           </div>
        </div>
      </div>

      <div className="card p-4 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className="input pl-10"
            placeholder="Search by name, email or subject..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : filtered.length === 0 ? (
        <div className="card py-12 text-center border-dashed bg-slate-50/50">
          <MessageSquare size={40} className="mx-auto text-slate-300 mb-4 opacity-50" />
          <p className="text-slate-400 text-sm font-medium">No feedback data nodes found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {filtered.map((msg) => (
              <motion.div
                key={msg.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`card overflow-hidden hover:border-blue-200 transition-all duration-300 ${msg.replies?.length > 0 ? 'border-l-4 border-l-emerald-500' : ''}`}
              >
                  <div className="px-6 py-4 border-b border-slate-100 bg-white flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-sm font-semibold text-slate-600">
                          {msg.name.charAt(0).toUpperCase()}
                       </div>
                       <div>
                          <p className="text-sm font-semibold text-navy-800">{msg.name}</p>
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                             <Mail size={12} />
                             {msg.email}
                          </div>
                       </div>
                    </div>
                    <div className="flex items-center gap-4">
                       {msg.replies?.length > 0 && <span className="badge-emerald text-[10px] uppercase">{msg.replies.length} Replies</span>}
                       <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                          <Clock size={12} />
                          {new Date(msg.created_at).toLocaleDateString()}
                       </div>
                       <span className="badge-slate uppercase tracking-wider text-[10px]">Inquiry #{msg.id}</span>
                    </div>
                  </div>

                  <div className="p-6 bg-slate-50/30">
                    <h3 className="text-sm font-bold text-navy-900 mb-2 truncate">{msg.subject}</h3>
                    <p className="text-sm text-slate-600 line-clamp-2">{msg.message}</p>
                  </div>

                  <div className="px-6 py-3 bg-white border-t border-slate-100 flex justify-end gap-3">
                     <button 
                        onClick={() => setReplyMsg(msg)}
                        className="text-[11px] font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-1.5 hover:gap-2 transition-all p-2 hover:bg-emerald-50 rounded-lg"
                     >
                        <Reply size={14} /> Send Reply
                     </button>
                     <button 
                        onClick={() => setSelectedMsg(msg)}
                        className="text-[11px] font-bold text-blue-600 uppercase tracking-widest flex items-center gap-1.5 hover:gap-2 transition-all p-2 hover:bg-blue-50 rounded-lg"
                     >
                        View Stream <ChevronRight size={14} />
                     </button>
                  </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Detail Modal */}
      <Modal 
        open={!!selectedMsg} 
        onClose={() => setSelectedMsg(null)} 
        title="Inquiry Discourse Stream"
        size="lg"
      >
        {selectedMsg && (
          <div className="space-y-6 max-h-[70vh] overflow-y-auto px-1 custom-scrollbar">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-blue-600 font-bold text-lg border border-slate-100">
                  {selectedMsg.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-bold text-navy-800">{selectedMsg.name}</p>
                  <p className="text-xs text-slate-500">{selectedMsg.email}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Origin Received</p>
                <p className="text-xs font-bold text-slate-700">{new Date(selectedMsg.created_at).toLocaleString()}</p>
              </div>
            </div>

            <div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1 flex items-center gap-2">
                  <Hash size={12} /> Inquiry Node Subject
               </p>
               <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-2xl text-blue-900 font-bold">
                  {selectedMsg.subject}
               </div>
            </div>

            <div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1 flex items-center gap-2">
                  <MessageSquare size={12} /> Primary Message Transcription
               </p>
               <div className="p-6 bg-white border border-slate-200 rounded-2xl text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">
                  {selectedMsg.message}
               </div>
            </div>

            {selectedMsg.replies && selectedMsg.replies.length > 0 && (
                <div className="border-t-2 border-dashed border-emerald-100 pt-6 space-y-5">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600">
                            <Reply size={16} />
                        </div>
                        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Oracle Response Sequence</p>
                    </div>
                    {selectedMsg.replies.map((reply, idx) => (
                        <motion.div 
                            key={reply.id} 
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="p-6 bg-emerald-50/30 border border-emerald-100 rounded-2xl text-slate-700 text-sm italic leading-relaxed whitespace-pre-wrap relative overflow-hidden"
                        >
                            <span className="absolute top-0 right-0 p-2 text-[8px] font-bold text-emerald-300">NODE_TX_{idx + 1}</span>
                            {reply.content}
                            <div className="mt-4 text-right text-[10px] font-bold text-emerald-600/70 flex items-center justify-end gap-1.5 uppercase">
                                <Send size={10} /> Recorded at {new Date(reply.created_at).toLocaleString()}
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            <div className="flex justify-end pt-4 border-t border-slate-100 sticky bottom-0 bg-white z-10 gap-3">
               <button 
                className="btn-primary" 
                onClick={() => {
                    const m = selectedMsg;
                    setSelectedMsg(null);
                    setReplyMsg(m);
                }}
                >
                New Response
               </button>
               <button 
                className="btn-outline" 
                onClick={() => setSelectedMsg(null)}
               >
                Close Stream
               </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Reply Modal */}
      <Modal 
        open={!!replyMsg} 
        onClose={() => { setReplyMsg(null); setReplyText(""); }} 
        title="Compose Official Response Node"
        size="lg"
      >
        {replyMsg && (
          <div className="space-y-6">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-3">
                  <Mail size={14} className="text-slate-400" />
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">TARGET: {replyMsg.name}</span>
                </div>
                <h3 className="text-sm font-bold text-navy-800">RE: {replyMsg.subject}</h3>
              </div>
              <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-emerald-600">
                 <BellRing size={20} />
              </div>
            </div>

            <div>
               <label className="label">Response Content</label>
               <textarea 
                  className="input min-h-[220px] resize-none py-4 border-emerald-100 focus:border-emerald-500"
                  placeholder="Draft your professional response here. This will be transmitted immediately via Gmail..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
               />
               <p className="text-[10px] text-emerald-600 font-bold mt-2 flex items-center gap-1.5 uppercase tracking-wider px-1">
                  <Send size={10} /> Transmission protocol: SMTP TLS 1.3 (Gmail)
               </p>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
               <button 
                  className="btn-outline border-slate-200 text-slate-500" 
                  onClick={() => { setReplyMsg(null); setReplyText(""); }}
                  disabled={isSending}
               >
                Abort Transmission
               </button>
               <button 
                  className="btn-success shadow-lg shadow-emerald-600/20" 
                  onClick={handleReply}
                  disabled={isSending || !replyText.trim()}
               >
                {isSending ? "Transmitting..." : "Send Real Response"}
                {!isSending && <Send size={16} />}
               </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}


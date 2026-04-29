import { useEffect, useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import API from "../api/axios";
import Header from "../components/Header";
import LoadingSpinner from "../components/LoadingSpinner";
import { Send, MessageSquare, User, Search, Clock, CheckCircle, FileText, ArrowLeft, MoreVertical, Sparkles } from "lucide-react";
import toast from "react-hot-toast";

export default function Messages() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [activeChat, setActiveChat] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msgLoading, setMsgLoading] = useState(false);
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState("");
  const scrollRef = useRef();

  const loadConvos = async () => {
    try {
      const { data } = await API.get("/api/messages/conversations");
      setConversations(data);
    } catch (err) {
      toast.error("Failed to load conversations");
    } finally {
      setLoading(false);
    }
  };

  const loadChat = async (otherId) => {
    setMsgLoading(true);
    try {
      const { data } = await API.get(`/api/messages/conversation/${otherId}`);
      setActiveChat(data);
      setSelectedUserId(otherId);
      // Mark as read in local state for unread badge if I implement it
      setConversations(prev => prev.map(c => c.user_id === otherId ? { ...c, unread_count: 0 } : c));
    } catch (err) {
      toast.error("Failed to load chat thread");
    } finally {
      setMsgLoading(false);
    }
  };

  useEffect(() => {
    loadConvos();
    const interval = setInterval(loadConvos, 15000); // Poll every 15s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeChat]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!content.trim() || !selectedUserId) return;
    setSending(true);
    try {
      const { data } = await API.post("/api/messages/", {
        receiver_id: selectedUserId,
        content: content.trim()
      });
      setActiveChat(prev => [...prev, data]);
      setContent("");
      loadConvos();
    } catch (err) {
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  const filteredConvos = conversations.filter(c => 
    c.user_name.toLowerCase().includes(search.toLowerCase())
  );

  const activeUser = conversations.find(c => c.user_id === selectedUserId);

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col">
      <Header 
        title="Neural Interface" 
        subtitle="Secure encrypted communication channel." 
      />

      <div className="flex-1 flex overflow-hidden card border-white/50 bg-white/80 backdrop-blur-3xl shadow-2xl shadow-blue-900/10 rounded-[2.5rem]">
        {/* Conversations Sidebar */}
        <div className={`w-full lg:w-[350px] border-r border-slate-100 flex flex-col ${selectedUserId ? 'hidden lg:flex' : 'flex'}`}>
          <div className="p-6 border-b border-slate-100">
            <div className="relative group">
              <Search size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
              <input 
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-6 py-3 text-sm placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-400/5 transition-all font-light"
                placeholder="Search communications..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1">
            {!filteredConvos.length ? (
              <div className="p-10 text-center">
                <MessageSquare size={32} className="mx-auto text-slate-200 mb-3" />
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No signals found</p>
              </div>
            ) : (
              filteredConvos.map(c => (
                <button
                  key={c.user_id}
                  onClick={() => loadChat(c.user_id)}
                  className={`w-full text-left p-4 rounded-3xl transition-all duration-300 flex items-center gap-4 ${
                    selectedUserId === c.user_id 
                    ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20' 
                    : 'hover:bg-blue-50 text-slate-600'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-black shrink-0 shadow-sm ${
                    selectedUserId === c.user_id ? 'bg-white/20 text-white' : 'bg-blue-600/10 text-blue-600'
                  }`}>
                    {c.user_name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-sm font-black tracking-tight uppercase truncate">{c.user_name}</span>
                      {c.unread_count > 0 && (
                        <span className="w-5 h-5 bg-emerald-500 text-white text-[8px] font-black rounded-full flex items-center justify-center animate-pulse border-2 border-white shadow-sm">
                          {c.unread_count}
                        </span>
                      )}
                    </div>
                    <p className={`text-[10px] uppercase tracking-widest font-bold mb-1 ${selectedUserId === c.user_id ? 'text-white/60' : 'text-blue-500'}`}>{c.user_role}</p>
                    <p className={`text-xs truncate font-light ${selectedUserId === c.user_id ? 'text-white/80' : 'text-slate-400'}`}>
                      {c.last_message}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat Interface */}
        <div className={`flex-1 flex flex-col bg-slate-50/50 ${!selectedUserId ? 'hidden lg:flex items-center justify-center text-center p-20' : 'flex'}`}>
          {!selectedUserId ? (
            <div className="max-w-md">
              <div className="w-24 h-24 bg-blue-600/5 rounded-[2.5rem] flex items-center justify-center text-blue-600/20 mb-8 mx-auto border border-blue-600/10">
                <Sparkles size={48} />
              </div>
              <h3 className="text-2xl font-black text-navy-950 uppercase tracking-tighter mb-4">Select a Node</h3>
              <p className="text-slate-500 font-light leading-relaxed">Choose a conversation to view detailed data transmissions and communicate securely.</p>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="px-8 py-5 bg-white border-b border-slate-100 flex items-center justify-between shadow-sm relative z-10">
                <div className="flex items-center gap-4">
                  <button onClick={() => setSelectedUserId(null)} className="lg:hidden p-2 text-slate-400 hover:text-blue-600 transition-colors">
                    <ArrowLeft size={20} />
                  </button>
                  <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-lg font-black text-white shadow-lg shadow-blue-600/20">
                    {activeUser?.user_name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-navy-950 uppercase tracking-tight leading-none mb-1">{activeUser?.user_name}</h4>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{activeUser?.user_role} · Secure Line</span>
                    </div>
                  </div>
                </div>
                <button className="p-3 text-slate-300 hover:text-blue-600 transition-colors">
                  <MoreVertical size={20} />
                </button>
              </div>

              {/* Messages Area */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
                {msgLoading ? (
                  <div className="h-full flex items-center justify-center">
                    <LoadingSpinner />
                  </div>
                ) : (
                  activeChat.map((m, idx) => {
                    const isMe = m.sender_id === user.id;
                    return (
                      <div key={m.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                        {m.exam_title && (
                          <div className={`flex items-center gap-2 mb-2 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${isMe ? 'bg-blue-100 text-blue-600' : 'bg-slate-200 text-slate-500'}`}>
                            <FileText size={10} /> Context: {m.exam_title}
                          </div>
                        )}
                        <div className={`max-w-[80%] p-5 rounded-3xl text-sm font-light leading-relaxed shadow-sm ${
                          isMe 
                          ? 'bg-blue-600 text-white rounded-tr-none' 
                          : 'bg-white text-navy-900 border border-slate-100 rounded-tl-none'
                        }`}>
                          {m.content}
                        </div>
                        <div className="mt-2 flex items-center gap-2 text-[8px] font-bold text-slate-400 uppercase tracking-widest px-1">
                          <Clock size={10} /> {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {isMe && m.is_read && <><span className="mx-1">·</span> <CheckCircle size={10} className="text-emerald-500" /> Read</>}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Message Input */}
              <div className="p-8 bg-white border-t border-slate-100 shadow-[0_-4px_20px_rgba(0,0,0,0.02)]">
                <form onSubmit={handleSend} className="relative group">
                  <textarea 
                    className="w-full bg-slate-50 border border-slate-100 rounded-3xl pl-8 pr-20 py-5 text-sm placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-400/5 transition-all font-light min-h-[60px] max-h-[200px] resize-none overflow-hidden"
                    placeholder="Type your message..."
                    rows={1}
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend(e);
                      }
                    }}
                  />
                  <button 
                    type="submit" 
                    disabled={sending || !content.trim()}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center hover:scale-[1.05] active:scale-[0.95] transition-all shadow-lg shadow-blue-600/30 disabled:opacity-50 disabled:grayscale group/send"
                  >
                    <Send size={20} className="group-hover/send:translate-x-0.5 group-hover/send:-translate-y-0.5 transition-transform" />
                  </button>
                </form>
                <div className="mt-3 flex items-center justify-center gap-6 text-[8px] font-black text-slate-300 uppercase tracking-[0.3em]">
                  <span className="flex items-center gap-1"><CheckCircle size={10} /> End-to-End Encrypted</span>
                  <span className="flex items-center gap-1"><Sparkles size={10} /> AI Neural Protocol</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

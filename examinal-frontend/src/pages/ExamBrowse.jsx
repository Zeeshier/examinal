import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import API from "../api/axios";
import Header from "../components/Header";
import LoadingSpinner from "../components/LoadingSpinner";
import Modal from "../components/Modal";
import { Eye, Clock, Award, Calendar, Send, CheckCircle, XCircle, AlertCircle, Play, Key } from "lucide-react";
import toast from "react-hot-toast";

const EXAM_CATEGORIES = [
  "All", "General", "Medical", "Computer Science", "Electrical Engineering", "Civil Engineering", 
  "Mechanical Engineering", "Arts", "Business", "Law", "Science", "Mathematics", 
  "History", "Languages", "Psychology", "Architecture", "Aviation", "Chemistry", 
  "Physics", "Biology", "Nursing", "Accounting", "Marketing", "Human Resources", 
  "Cyber Security", "AI & Data Science"
];

export default function ExamBrowse() {
  const { user } = useAuth();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);
  const [requestMessage, setRequestMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [category, setCategory] = useState("All");
  const [date, setDate] = useState("");

  const load = async () => {
    try {
      const { data } = await API.get("/api/exams/browse", {
        params: { category, date: date || undefined }
      });
      setExams(data);
    } catch (err) {
      toast.error("Failed to load exams");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [category, date]);

  const handleRequest = async (e) => {
    e.preventDefault();
    if (!selectedExam) return;
    setBusy(true);
    try {
      await API.post("/api/enrollment-requests/", {
        exam_id: selectedExam.id,
        message: requestMessage.trim(),
      });
      toast.success("Enrollment request sent!");
      setShowRequestModal(false);
      setRequestMessage("");
      load(); // Refresh to show pending status
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to send request");
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="pb-12">
      <Header 
        title="Discover Exams" 
        subtitle="Browse available assessments and request enrollment to begin." 
      />

      {/* Filters Section */}
      <div className="mb-10 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Categories - Scrollable */}
          <div className="flex-1 min-w-0 overflow-hidden">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-4 ml-1">Filter by Category</p>
            <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
              {(() => {
                const available = new Set([...EXAM_CATEGORIES, ...exams.map(e => e.category).filter(Boolean)]);
                return Array.from(available).map(cat => (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`px-6 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-300 flex-shrink-0 ${
                      category.toLowerCase() === cat.toLowerCase() 
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30" 
                        : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60 hover:border-slate-300"
                    }`}
                  >
                    {cat}
                  </button>
                ));
              })()}
            </div>
          </div>

          {/* Date Picker */}
          <div className="w-full lg:w-72 shrink-0">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-4 ml-1">Select Exam Date</p>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 group-focus-within:bg-blue-600 group-focus-within:text-white transition-all duration-300 pointer-events-none">
                <Calendar size={16} />
              </div>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                onClick={(e) => e.target.showPicker && e.target.showPicker()}
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-14 pr-12 py-3.5 text-xs font-bold uppercase tracking-widest text-slate-700 focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:bg-white focus:border-blue-400 transition-all duration-300 cursor-pointer"
              />
              {date && (
                <button 
                  onClick={() => setDate("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-7 h-7 bg-white text-slate-400 hover:text-red-500 hover:shadow-md rounded-full flex items-center justify-center transition-all duration-200 shadow-sm border border-slate-100"
                >
                  <XCircle size={14} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {!exams.length ? (
        <div className="card p-20 text-center">
          <Eye size={44} className="mx-auto text-slate-300 mb-4" />
          <h3 className="text-xl font-bold text-navy-950 mb-1 uppercase tracking-tight">No exams found</h3>
          <p className="text-slate-500 font-light">Try adjusting your filters or check back later.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {exams.map((ex) => (
            <div key={ex.id} className="card overflow-hidden group hover:shadow-2xl hover:shadow-blue-900/10 transition-all duration-500 border-white/50 bg-white/80 backdrop-blur-xl">
              <div className="p-6">
                <div className="flex items-start justify-between mb-6">
                  <div className="w-14 h-14 bg-blue-600/10 rounded-2xl flex items-center justify-center text-blue-600 shadow-sm shadow-blue-900/5 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500">
                    <Award size={28} />
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="badge-blue text-[9px] py-1">{ex.category}</span>
                    {ex.enrollment_status && (
                      <span className={`text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-full ${
                        ex.enrollment_status === 'approved' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                        ex.enrollment_status === 'pending' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                        'bg-red-50 text-red-600 border border-red-100'
                      }`}>
                        {ex.enrollment_status}
                      </span>
                    )}
                  </div>
                </div>

                <div className="mb-6">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600 mb-2">{ex.course_title}</p>
                  <h3 className="text-xl font-black text-navy-950 tracking-tighter mb-2 line-clamp-1 uppercase leading-tight">{ex.title}</h3>
                  <p className="text-sm text-slate-500 font-light line-clamp-2 leading-relaxed">{ex.description || "No description provided."}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 py-5 border-y border-slate-100 mb-6">
                  <div className="flex items-center gap-3 text-slate-500">
                    <Clock size={16} className="text-blue-500" />
                    <span className="text-xs font-medium uppercase tracking-widest">{ex.duration_minutes}m</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-500">
                    <Calendar size={16} className="text-blue-500" />
                    <span className="text-xs font-medium uppercase tracking-widest">
                      {ex.schedule_type === 'anytime' 
                        ? 'Anytime' 
                        : `${new Date(ex.start_time).toLocaleDateString()} · ${new Date(ex.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${new Date(ex.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-[10px] font-bold text-slate-500 uppercase">
                      {ex.teacher_name?.charAt(0)}
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{ex.teacher_name}</span>
                  </div>

                  {!ex.enrollment_status ? (
                    <button 
                      onClick={() => { setSelectedExam(ex); setShowRequestModal(true); }}
                      className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-600 hover:text-blue-700 transition-colors group/btn"
                    >
                      Enroll <Send size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                    </button>
                  ) : ex.enrollment_status === 'approved' ? (
                    <div className="flex flex-col items-end gap-2">
                      <div className="px-3 py-1.5 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-2">
                        <Key size={12} className="text-emerald-600" />
                        <span className="text-[10px] font-black text-emerald-700 font-mono">APPROVED</span>
                      </div>
                      <Link 
                        to={`/exams`}
                        className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 group/go"
                      >
                        <Play size={14} className="group-hover/go:scale-110 transition-transform" /> START EXAM
                      </Link>
                    </div>
                  ) : ex.enrollment_status === 'pending' ? (
                    <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-amber-500">
                      <Clock size={14} /> Pending
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-red-500">
                      <XCircle size={14} /> Rejected
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Request Enrollment Modal */}
      <Modal 
        open={showRequestModal} 
        onClose={() => setShowRequestModal(false)} 
        title="Request Enrollment"
        size="md"
      >
        <div className="p-1">
          <div className="mb-6 p-4 bg-blue-50 rounded-2xl border border-blue-100 flex gap-4">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm shadow-blue-900/5 shrink-0">
              <AlertCircle size={20} />
            </div>
            <div>
              <p className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-1">Requesting Access</p>
              <p className="text-sm text-blue-700/70 font-light leading-relaxed">
                Send a brief message to <strong>{selectedExam?.teacher_name}</strong> to request the secret key for <strong>{selectedExam?.title}</strong>.
              </p>
            </div>
          </div>

          <form onSubmit={handleRequest} className="space-y-6">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-1">Message (Optional)</label>
              <textarea 
                className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-4 text-navy-900 placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:bg-blue-50/50 focus:ring-1 focus:ring-blue-400/20 transition-all font-light min-h-[120px] resize-none shadow-sm shadow-blue-900/5" 
                placeholder="I would like to take this exam as part of my course requirements..." 
                value={requestMessage} 
                onChange={(e) => setRequestMessage(e.target.value)}
                maxLength={1000}
              />
            </div>

            <button 
              type="submit" 
              disabled={busy} 
              className="w-full h-14 bg-blue-600 text-white rounded-2xl font-black text-sm uppercase tracking-[0.2em] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-4 shadow-xl shadow-blue-600/20 hover:shadow-blue-600/30 disabled:opacity-50 group"
            >
              {busy ? "SENDING..." : (
                <>
                  SEND REQUEST <Send size={20} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>
      </Modal>
    </div>
  );
}

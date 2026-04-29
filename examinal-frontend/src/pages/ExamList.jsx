import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import API from "../api/axios";
import Header from "../components/Header";
import Modal from "../components/Modal";
import LoadingSpinner from "../components/LoadingSpinner";
import { Plus, FileText, ArrowRight, Trash2, Play, Key, Calendar, Clock } from "lucide-react";
import toast from "react-hot-toast";

const EXAM_CATEGORIES = [
  "General", "Medical", "Computer Science", "Electrical Engineering", "Civil Engineering", 
  "Mechanical Engineering", "Arts", "Business", "Law", "Science", "Mathematics", 
  "History", "Languages", "Psychology", "Architecture", "Aviation", "Chemistry", 
  "Physics", "Biology", "Nursing", "Accounting", "Marketing", "Human Resources", 
  "Cyber Security", "AI & Data Science"
];

export default function ExamList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);
  const [accessKey, setAccessKey] = useState("");
  const [busy, setBusy] = useState(false);
  const [filterCategory, setFilterCategory] = useState("All");
  const [filterDate, setFilterDate] = useState("");
  const [form, setForm] = useState({ 
    course_id: "", 
    title: "", 
    description: "", 
    duration_minutes: 60, 
    total_marks: 100, 
    passing_marks: 40,
    category: "General",
    schedule_type: "anytime",
    start_time: "",
    end_time: ""
  });

  const filteredExams = (exams || []).filter(ex => {
    const matchesCategory = filterCategory === "All" || 
      (ex.category && ex.category.toLowerCase() === filterCategory.toLowerCase());
    const matchesDate = !filterDate || (ex.start_time && String(ex.start_time).split('T')[0] === filterDate);
    return matchesCategory && matchesDate;
  });

  const load = async () => { 
    try { 
      const [e, c] = await Promise.all([API.get("/api/exams/"), API.get("/api/courses/")]); 
      setExams(e.data); 
      setCourses(c.data); 
    } catch {} 
    setLoading(false); 
  };
  useEffect(() => { load(); }, []);

  const create = async (e) => { 
    e.preventDefault(); 
    setBusy(true); 
    try { 
      await API.post("/api/exams/", { ...form, course_id: parseInt(form.course_id) }); 
      toast.success("Exam created"); 
      setShowCreate(false); 
      load(); 
    } catch (err) { 
      toast.error(err.response?.data?.detail || "Failed"); 
    } 
    setBusy(false); 
  };

  const del = async (id) => { 
    if (!confirm("Delete?")) return; 
    try { 
      await API.delete(`/api/exams/${id}`); 
      toast.success("Deleted"); 
      load(); 
    } catch { 
      toast.error("Failed"); 
    } 
  };

  const handleStart = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      // We don't actually call /start here, we just navigate to the take page with the key as a state or query param
      // The /start call happens inside ExamTaking.jsx
      navigate(`/exam/${selectedExam.id}/take`, { state: { accessKey: accessKey.trim() } });
    } catch (err) {
      toast.error("Invalid state");
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  const isInstr = user.role !== "student";

  return (
    <div>
      <Header 
        title={isInstr ? "Manage Exams" : "My Assigned Exams"} 
        subtitle={isInstr ? "Create, edit, and monitor your assessments." : "Take your assigned assessments and view results."} 
      >
        {user.role === "instructor" && (
          <button onClick={() => setShowCreate(true)} className="btn-primary">
            <Plus size={18} /> CREATE EXAM
          </button>
        )}
      </Header>

      {/* Filters Section */}
      <div className="mb-10 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Categories - Scrollable */}
          <div className="flex-1 min-w-0 overflow-hidden">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-4 ml-1">Filter by Category</p>
            <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
              {["All", ...EXAM_CATEGORIES].map(cat => (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat)}
                  className={`px-6 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-300 flex-shrink-0 ${
                    filterCategory.toLowerCase() === cat.toLowerCase() 
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30" 
                      : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60 hover:border-slate-300"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Date Picker */}
          <div className="w-full lg:w-72 shrink-0">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-4 ml-1">Select Exam Date</p>
            <div className="relative group">
              {/* Added pointer-events-none so clicking the icon opens the date picker */}
              <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 group-focus-within:bg-blue-600 group-focus-within:text-white transition-all duration-300 pointer-events-none">
                <Calendar size={16} />
              </div>
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                onClick={(e) => e.target.showPicker && e.target.showPicker()}
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-14 pr-12 py-3.5 text-xs font-bold uppercase tracking-widest text-slate-700 focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:bg-white focus:border-blue-400 transition-all duration-300 cursor-pointer"
              />
              {filterDate && (
                <button 
                  onClick={() => setFilterDate("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-7 h-7 bg-white text-slate-400 hover:text-red-500 hover:shadow-md rounded-full flex items-center justify-center transition-all duration-200 shadow-sm border border-slate-100"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {!filteredExams.length ? (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-[2.5rem] p-20 text-center">
          <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6 text-slate-300">
            <FileText size={40} />
          </div>
          <h3 className="text-2xl font-black text-navy-950 mb-2 uppercase tracking-tight">No assessments found</h3>
          <p className="text-slate-500 font-light max-w-sm mx-auto leading-relaxed">
            We couldn't find any exams matching your current filters. Try adjusting them or create a new assessment from the top.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredExams.map((ex) => (
            <div key={ex.id} className="group relative bg-white border border-slate-100 rounded-[2rem] p-2 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-1">
              <div className="bg-slate-50/50 rounded-[1.75rem] p-6 h-full border border-transparent group-hover:border-blue-50 group-hover:bg-white transition-all duration-500">
                <div className="flex items-start justify-between mb-6">
                  <div className="w-14 h-14 bg-white shadow-sm border border-slate-50 rounded-2xl flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform duration-500">
                    <FileText size={28} />
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[9px] font-black uppercase tracking-widest">{ex.category}</span>
                    <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${ex.is_published ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                      {ex.is_published ? 'Published' : 'Draft'}
                    </span>
                  </div>
                </div>

                <div className="mb-6">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 mb-1">
                    {courses.find(c => c.id === ex.course_id)?.title || "Course"}
                  </p>
                  <h3 className="text-lg font-black text-navy-950 tracking-tighter uppercase mb-2 line-clamp-1">{ex.title}</h3>
                  <div className="flex items-center gap-2 text-slate-400">
                    <Clock size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">{ex.duration_minutes} MIN</span>
                    <span className="text-slate-200">•</span>
                    <span className="text-[10px] font-bold uppercase tracking-widest">{ex.schedule_type === 'anytime' ? 'Anytime' : new Date(ex.start_time).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                  {user.role === 'instructor' ? (
                    <>
                      <Link to={`/exams/${ex.id}/build`} className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-blue-600 hover:text-blue-700 transition-colors">
                        BUILD <ArrowRight size={14} />
                      </Link>
                      <button onClick={() => del(ex.id)} className="p-2 hover:bg-red-50 rounded-lg text-red-400 hover:text-red-600 transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </>
                  ) : user.role === 'admin' ? (
                    <div className="flex items-center justify-between w-full">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-50 px-3 py-1 rounded-lg">ADMIN VIEW</span>
                      <button onClick={() => del(ex.id)} className="p-2 hover:bg-red-50 rounded-lg text-red-400 hover:text-red-600 transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => { setSelectedExam(ex); setShowKeyModal(true); }}
                      className="w-full flex items-center justify-center gap-2 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/10"
                    >
                      <Play size={14} /> START EXAM
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Exam Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create Exam" size="lg">
        <form onSubmit={create} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Course</label>
              <select className="input" value={form.course_id} onChange={(e) => setForm({ ...form, course_id: e.target.value })} required>
                <option value="">Select course</option>
                {courses.map((c) => <option key={c.id} value={c.id}>{c.title} ({c.code})</option>)}
              </select>
            </div>
            <div>
              <label className="label">Category</label>
              <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required>
                {EXAM_CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
          </div>
          <div><label className="label">Title</label><input className="input" placeholder="Midterm Exam" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
          <div><label className="label">Description</label><textarea className="input min-h-[60px]" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <div className="grid grid-cols-3 gap-4">
            <div><label className="label">Duration (min)</label><input className="input" type="number" value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: parseInt(e.target.value) })} /></div>
            <div><label className="label">Total Marks</label><input className="input" type="number" value={form.total_marks} onChange={(e) => setForm({ ...form, total_marks: parseFloat(e.target.value) })} /></div>
            <div><label className="label">Pass Marks</label><input className="input" type="number" value={form.passing_marks} onChange={(e) => setForm({ ...form, passing_marks: parseFloat(e.target.value) })} /></div>
          </div>

          <div className="space-y-3 pt-2">
            <label className="label">Schedule Type</label>
            <div className="flex gap-4">
              <label className="flex-1 flex items-center gap-3 p-4 bg-slate-50 border border-slate-100 rounded-2xl cursor-pointer hover:bg-slate-100 transition-colors">
                <input type="radio" name="schedule_type" value="anytime" checked={form.schedule_type === "anytime"} onChange={(e) => setForm({ ...form, schedule_type: e.target.value })} className="w-4 h-4 text-blue-600" />
                <div>
                  <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">Anytime</p>
                  <p className="text-[10px] text-slate-500">Students can take the exam at any time.</p>
                </div>
              </label>
              <label className="flex-1 flex items-center gap-3 p-4 bg-slate-50 border border-slate-100 rounded-2xl cursor-pointer hover:bg-slate-100 transition-colors">
                <input type="radio" name="schedule_type" value="scheduled" checked={form.schedule_type === "scheduled"} onChange={(e) => setForm({ ...form, schedule_type: e.target.value })} className="w-4 h-4 text-blue-600" />
                <div>
                  <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">Scheduled</p>
                  <p className="text-[10px] text-slate-500">Set a specific date and window.</p>
                </div>
              </label>
            </div>
          </div>

          {form.schedule_type === "scheduled" && (
            <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <div>
                <label className="label">Start Date & Time</label>
                <input type="datetime-local" className="input" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} required={form.schedule_type === "scheduled"} />
              </div>
              <div>
                <label className="label">End Date & Time</label>
                <input type="datetime-local" className="input" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} required={form.schedule_type === "scheduled"} />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t"><button type="button" className="btn-outline" onClick={() => setShowCreate(false)}>Cancel</button><button type="submit" className="btn-primary" disabled={busy}>{busy ? "Creating..." : "Create"}</button></div>
        </form>
      </Modal>

      {/* Secret Key Modal */}
      <Modal open={showKeyModal} onClose={() => setShowKeyModal(false)} title="Enter Secret Key" size="md">
        <form onSubmit={handleStart} className="space-y-6">
          <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-4">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-amber-600 shadow-sm shrink-0">
              <Key size={20} />
            </div>
            <div>
              <p className="text-xs font-bold text-amber-900 uppercase tracking-wider mb-1">Authorization Required</p>
              <p className="text-sm text-amber-700/70 font-light leading-relaxed">
                Please enter the secret access key provided by your instructor to begin <strong>{selectedExam?.title}</strong>.
              </p>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-1">Secret Access Key</label>
            <input 
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-center text-xl font-black tracking-[0.5em] text-navy-900 uppercase placeholder-slate-300 focus:outline-none focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-400/5 transition-all shadow-sm" 
              placeholder="••••••••" 
              value={accessKey} 
              onChange={(e) => setAccessKey(e.target.value)}
              required
              autoFocus
            />
          </div>

          <button 
            type="submit" 
            disabled={!accessKey.trim()}
            className="w-full h-14 bg-blue-600 text-white rounded-2xl font-black text-sm uppercase tracking-[0.2em] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-4 shadow-xl shadow-blue-600/20 disabled:opacity-50"
          >
            VERIFY & START <ArrowRight size={20} />
          </button>
        </form>
      </Modal>
    </div>
  );
}

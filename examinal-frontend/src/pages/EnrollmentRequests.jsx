import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import API from "../api/axios";
import Header from "../components/Header";
import LoadingSpinner from "../components/LoadingSpinner";
import { ClipboardCheck, CheckCircle, XCircle, Clock, User, FileText, Send, MessageSquare } from "lucide-react";
import toast from "react-hot-toast";

export default function EnrollmentRequests() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const load = async () => {
    try {
      const { data } = await API.get("/api/enrollment-requests/pending");
      setRequests(data);
    } catch (err) {
      toast.error("Failed to load requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleUpdate = async (id, status) => {
    setBusyId(id);
    try {
      await API.patch(`/api/enrollment-requests/${id}`, { status });
      toast.success(`Request ${status} successfully!`);
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to update request");
    } finally {
      setBusyId(null);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="pb-12">
      <Header 
        title="Enrollment Requests" 
        subtitle="Review and approve student requests for exam access." 
      />

      {!requests.length ? (
        <div className="card p-20 text-center">
          <ClipboardCheck size={44} className="mx-auto text-slate-300 mb-4" />
          <h3 className="text-xl font-bold text-navy-950 mb-1 uppercase tracking-tight">No pending requests</h3>
          <p className="text-slate-500 font-light">All student requests have been processed.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {requests.map((req) => (
            <div key={req.id} className="card overflow-hidden bg-white/80 backdrop-blur-xl border-white/50 hover:shadow-xl hover:shadow-blue-900/5 transition-all duration-300">
              <div className="p-8">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                  <div className="flex items-start gap-6 flex-1">
                    <div className="w-16 h-16 bg-blue-600/10 rounded-2xl flex items-center justify-center text-blue-600 shadow-sm shadow-blue-900/5">
                      <User size={32} />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-xl font-black text-navy-950 tracking-tight uppercase leading-none">{req.student_name}</h3>
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full uppercase tracking-widest">{req.student_email}</span>
                      </div>
                      <div className="flex items-center gap-4 text-slate-500 mb-4">
                        <div className="flex items-center gap-1.5">
                          <FileText size={14} className="text-blue-500" />
                          <span className="text-xs font-bold uppercase tracking-widest text-slate-600">{req.exam_title}</span>
                        </div>
                        <div className="flex items-center gap-1.5 border-l border-slate-200 pl-4">
                          <Clock size={14} className="text-slate-400" />
                          <span className="text-xs font-medium text-slate-400">{new Date(req.created_at).toLocaleString()}</span>
                        </div>
                      </div>
                      
                      {req.message && (
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex gap-3">
                          <MessageSquare size={16} className="text-slate-400 mt-1 shrink-0" />
                          <p className="text-sm text-slate-600 font-light leading-relaxed italic italic">"{req.message}"</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <button 
                      onClick={() => handleUpdate(req.id, 'rejected')}
                      disabled={busyId === req.id}
                      className="h-12 px-6 rounded-xl border border-red-200 text-red-600 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-red-50 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <XCircle size={16} /> Decline
                    </button>
                    <button 
                      onClick={() => handleUpdate(req.id, 'approved')}
                      disabled={busyId === req.id}
                      className="h-12 px-8 rounded-xl bg-blue-600 text-white text-[10px] font-black uppercase tracking-[0.2em] hover:scale-[1.05] active:scale-[0.95] transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 disabled:opacity-50"
                    >
                      <CheckCircle size={16} /> Approve Access
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

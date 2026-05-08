import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import API from "../api/axios";
import Header from "../components/Header";
import LoadingSpinner from "../components/LoadingSpinner";
import { ClipboardCheck, CheckCircle, XCircle, Clock, User, FileText, MessageSquare, CheckSquare } from "lucide-react";
import toast from "react-hot-toast";

export default function EnrollmentRequests() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  
  const [selected, setSelected] = useState([]);
  const [bulkBusy, setBulkBusy] = useState(false);

  const load = async () => {
    try {
      const { data } = await API.get("/api/enrollment-requests/pending");
      setRequests(data);
      // clean up selected if they are no longer in list
      setSelected(prev => prev.filter(id => data.find(r => r.id === id)));
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

  const handleSelectAll = (e) => {
    if (e.target.checked) setSelected(requests.map(r => r.id));
    else setSelected([]);
  };

  const toggleSelect = (id) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleBulkUpdate = async (status) => {
    if (!selected.length) return;
    if (!confirm(`Are you sure you want to ${status} ${selected.length} requests?`)) return;
    
    setBulkBusy(true);
    try {
      await Promise.all(selected.map(id => API.patch(`/api/enrollment-requests/${id}`, { status })));
      toast.success(`Successfully ${status} ${selected.length} requests!`);
      setSelected([]);
      load();
    } catch (err) {
      toast.error("Failed to update some requests");
    } finally {
      setBulkBusy(false);
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
          
          {/* Bulk Actions Header */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between shadow-sm">
            <label className="flex items-center gap-3 cursor-pointer pl-2">
              <input 
                type="checkbox" 
                className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                checked={requests.length > 0 && selected.length === requests.length}
                onChange={handleSelectAll}
              />
              <span className="text-sm font-bold text-slate-700 uppercase tracking-wider">
                Select All ({selected.length} selected)
              </span>
            </label>
            
            {selected.length > 0 && (
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => handleBulkUpdate('rejected')}
                  disabled={bulkBusy}
                  className="px-5 py-2.5 rounded-xl border border-red-200 text-red-600 text-xs font-bold uppercase tracking-wider hover:bg-red-50 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  <XCircle size={16} /> Decline Selected
                </button>
                <button 
                  onClick={() => handleBulkUpdate('approved')}
                  disabled={bulkBusy}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold uppercase tracking-wider hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 shadow-md shadow-blue-600/20 disabled:opacity-50"
                >
                  <CheckSquare size={16} /> Approve Selected
                </button>
              </div>
            )}
          </div>

          <div className="space-y-4">
            {requests.map((req) => (
              <div key={req.id} className={`card overflow-hidden transition-all duration-300 ${selected.includes(req.id) ? 'ring-2 ring-blue-500 bg-blue-50/30' : 'bg-white hover:shadow-xl hover:shadow-blue-900/5 border-slate-200'}`}>
                <div className="p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  
                  <div className="flex items-center gap-6 flex-1">
                    <input 
                      type="checkbox"
                      className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer shrink-0"
                      checked={selected.includes(req.id)}
                      onChange={() => toggleSelect(req.id)}
                    />
                    <div className="w-14 h-14 bg-blue-600/10 rounded-2xl flex items-center justify-center text-blue-600 shrink-0">
                      <User size={28} />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-lg font-black text-navy-950 tracking-tight uppercase leading-none">{req.student_name}</h3>
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full uppercase tracking-widest">{req.student_email}</span>
                      </div>
                      <div className="flex items-center gap-4 text-slate-500">
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
                        <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-100 flex gap-2">
                          <MessageSquare size={14} className="text-slate-400 mt-0.5 shrink-0" />
                          <p className="text-xs text-slate-600 italic">"{req.message}"</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button 
                      onClick={() => handleUpdate(req.id, 'rejected')}
                      disabled={busyId === req.id || bulkBusy}
                      className="h-10 px-5 rounded-xl border border-red-200 text-red-600 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-red-50 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      Decline
                    </button>
                    <button 
                      onClick={() => handleUpdate(req.id, 'approved')}
                      disabled={busyId === req.id || bulkBusy}
                      className="h-10 px-6 rounded-xl bg-blue-600 text-white text-[10px] font-black uppercase tracking-[0.2em] hover:scale-[1.05] active:scale-[0.95] transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 disabled:opacity-50"
                    >
                      Approve
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

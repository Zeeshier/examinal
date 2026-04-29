import { useEffect, useState } from "react";
import API from "../api/axios";
import Header from "../components/Header";
import LoadingSpinner from "../components/LoadingSpinner";
import { Activity, Search, Filter } from "lucide-react";

export default function ActivityLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ user_id: "", exam_id: "", action_type: "" });

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.user_id) params.user_id = filters.user_id;
      if (filters.exam_id) params.exam_id = filters.exam_id;
      if (filters.action_type) params.action_type = filters.action_type;
      const { data } = await API.get("/api/admin/activity-logs", { params: { ...params, limit: 200 } });
      setLogs(data);
    } catch { /* */ }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const actionColor = {
    exam_started: "badge-blue",
    exam_submitted: "badge-emerald",
    tab_switch: "badge-amber",
    focus_lost: "badge-amber",
    copy_attempt: "badge-red",
    paste_attempt: "badge-red",
  };

  return (
    <div>
      <Header title="Activity Logs" subtitle="Platform-wide audit trail" />

      <div className="card p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-3">
          <input className="input" placeholder="User ID" value={filters.user_id} onChange={(e) => setFilters({ ...filters, user_id: e.target.value })} />
          <input className="input" placeholder="Exam ID" value={filters.exam_id} onChange={(e) => setFilters({ ...filters, exam_id: e.target.value })} />
          <input className="input" placeholder="Action type" value={filters.action_type} onChange={(e) => setFilters({ ...filters, action_type: e.target.value })} />
          <button onClick={load} className="btn-primary whitespace-nowrap">
            <Filter size={16} /> Filter
          </button>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-slate-50">
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Time</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">User</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Action</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Exam</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {logs.map((l) => (
                <tr key={l.id} className="hover:bg-slate-50">
                  <td className="px-6 py-3 text-sm text-slate-600">
                    {l.created_at ? new Date(l.created_at).toLocaleString() : "—"}
                  </td>
                  <td className="px-6 py-3 text-sm text-navy-800 font-medium">
                    <div className="flex flex-col">
                      <span className="text-navy-950 font-bold">{l.user_email}</span>
                      <span className="text-[10px] text-slate-400 uppercase tracking-tighter">ID: {l.user_id}</span>
                    </div>
                  </td>
                  <td className="px-6 py-3">
                    <span className={actionColor[l.action_type] || "badge-slate"}>{l.action_type}</span>
                  </td>
                  <td className="px-6 py-3 text-sm text-slate-600">
                    <div className="flex flex-col">
                      <span className="font-medium text-slate-700">{l.exam_title}</span>
                      <span className="text-[10px] text-slate-400">ID: {l.exam_id || "N/A"}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {logs.length === 0 && <p className="text-center py-12 text-sm text-slate-400">No logs found</p>}
        </div>
      )}
    </div>
  );
}

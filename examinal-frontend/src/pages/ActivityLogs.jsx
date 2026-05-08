import { useEffect, useState, useCallback } from "react";
import API from "../api/axios";
import Header from "../components/Header";
import LoadingSpinner from "../components/LoadingSpinner";
import toast from "react-hot-toast";
import {
  Activity, Filter, Download, ChevronDown, ChevronUp,
  X, Monitor, Globe, Clock, User, FileText
} from "lucide-react";

// ── Action type badge colours ──────────────────────────────────────────────────
const ACTION_COLORS = {
  exam_started:        "badge-blue",
  exam_started_secure: "badge-blue",
  exam_submitted:      "badge-emerald",
  tab_switch:          "badge-amber",
  focus_lost:          "badge-amber",
  copy_attempt:        "badge-red",
  paste_attempt:       "badge-red",
  cut_attempt:         "badge-red",
  right_click:         "badge-red",
  blocked_key:         "badge-amber",
  fullscreen_exit:     "badge-amber",
  cursor_out:          "badge-amber",
  print_attempt:       "badge-red",
};

// ── CSV export helper ──────────────────────────────────────────────────────────
function exportCSV(logs) {
  const headers = ["ID", "Time", "User ID", "User Email", "Action", "Exam ID", "Exam Title", "Details", "IP Address", "User Agent"];
  const rows = logs.map((l) => [
    l.id,
    l.created_at ? new Date(l.created_at).toISOString() : "",
    l.user_id,
    l.user_email ?? "",
    l.action_type,
    l.exam_id ?? "",
    l.exam_title ?? "",
    typeof l.details === "object" ? JSON.stringify(l.details) : (l.details ?? ""),
    l.ip_address ?? "",
    l.user_agent ?? "",
  ]);

  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `activity-logs-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Details Drawer ─────────────────────────────────────────────────────────────
function DetailsDrawer({ log, onClose }) {
  if (!log) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <span className={`${ACTION_COLORS[log.action_type] || "badge-slate"} mb-2 inline-block`}>
              {log.action_type}
            </span>
            <p className="text-xs text-slate-400">
              {log.created_at ? new Date(log.created_at).toLocaleString() : "—"}
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all">
            <X size={18} />
          </button>
        </div>

        {/* Fields */}
        <div className="space-y-3">
          {[
            { icon: User, label: "User", value: `${log.user_email ?? "—"} (ID: ${log.user_id})` },
            { icon: FileText, label: "Exam", value: log.exam_title ? `${log.exam_title} (ID: ${log.exam_id})` : `ID: ${log.exam_id ?? "N/A"}` },
            { icon: Globe, label: "IP Address", value: log.ip_address || "Not recorded" },
            { icon: Monitor, label: "User Agent", value: log.user_agent || "Not recorded" },
            { icon: Activity, label: "Details", value: typeof log.details === "object" ? JSON.stringify(log.details, null, 2) : (log.details || "No details") },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="bg-slate-50 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-1.5">
                <Icon size={13} className="text-slate-400" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</span>
              </div>
              <pre className="text-sm text-slate-700 whitespace-pre-wrap break-all font-sans">{value}</pre>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function ActivityLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ user_id: "", exam_id: "", action_type: "" });
  const [selectedLog, setSelectedLog] = useState(null);
  const [expandedRows, setExpandedRows] = useState(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit: 500 };
      if (filters.user_id) params.user_id = filters.user_id;
      if (filters.exam_id) params.exam_id = filters.exam_id;
      if (filters.action_type) params.action_type = filters.action_type;
      const { data } = await API.get("/api/admin/activity-logs", { params });
      setLogs(data);
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed to load activity logs.");
    }
    setLoading(false);
  }, [filters]);

  useEffect(() => { load(); }, []);

  const toggleRow = (id) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div>
      <Header title="Activity Logs" subtitle="Platform-wide audit trail with full details" />

      {/* ── Filters ── */}
      <div className="card p-4 mb-5">
        <div className="flex flex-col md:flex-row gap-3">
          <input
            className="input flex-1"
            placeholder="User ID"
            value={filters.user_id}
            onChange={(e) => setFilters({ ...filters, user_id: e.target.value })}
          />
          <input
            className="input flex-1"
            placeholder="Exam ID"
            value={filters.exam_id}
            onChange={(e) => setFilters({ ...filters, exam_id: e.target.value })}
          />
          <input
            className="input flex-1"
            placeholder="Action type (e.g. tab_switch)"
            value={filters.action_type}
            onChange={(e) => setFilters({ ...filters, action_type: e.target.value })}
          />
          <button onClick={load} className="btn-primary whitespace-nowrap">
            <Filter size={16} /> Filter
          </button>
          <button
            onClick={() => exportCSV(logs)}
            disabled={!logs.length}
            className="btn-outline whitespace-nowrap disabled:opacity-40"
            title="Export to CSV"
          >
            <Download size={16} /> Export CSV
          </button>
        </div>
        {logs.length > 0 && (
          <p className="text-xs text-slate-400 mt-2 ml-1">{logs.length} record{logs.length !== 1 ? "s" : ""} found</p>
        )}
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b bg-slate-50">
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider w-36">Time</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">User</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Action</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Exam</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden xl:table-cell">IP</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider w-20">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((l) => {
                  const expanded = expandedRows.has(l.id);
                  const hasDetails = l.details || l.ip_address || l.user_agent;
                  return (
                    <>
                      <tr
                        key={l.id}
                        className="hover:bg-slate-50 transition-colors cursor-pointer"
                        onClick={() => setSelectedLog(l)}
                      >
                        <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <Clock size={11} className="text-slate-300 flex-shrink-0" />
                            {l.created_at ? new Date(l.created_at).toLocaleString() : "—"}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold text-slate-800 truncate max-w-[160px]">{l.user_email ?? `User #${l.user_id}`}</span>
                            <span className="text-[10px] text-slate-400 uppercase tracking-tight">ID: {l.user_id}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={ACTION_COLORS[l.action_type] || "badge-slate"}>
                            {l.action_type}
                          </span>
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-slate-700 truncate max-w-[180px]">{l.exam_title ?? "—"}</span>
                            <span className="text-[10px] text-slate-400">ID: {l.exam_id ?? "N/A"}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden xl:table-cell">
                          <span className="text-xs text-slate-500 font-mono">{l.ip_address ?? "—"}</span>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={(e) => { e.stopPropagation(); setSelectedLog(l); }}
                            className="text-xs text-blue-500 hover:text-blue-700 font-medium flex items-center gap-1 hover:underline"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    </>
                  );
                })}
              </tbody>
            </table>
            {logs.length === 0 && (
              <p className="text-center py-16 text-sm text-slate-400">No logs found. Try adjusting the filters.</p>
            )}
          </div>
        </div>
      )}

      {/* ── Details Drawer ── */}
      {selectedLog && <DetailsDrawer log={selectedLog} onClose={() => setSelectedLog(null)} />}
    </div>
  );
}

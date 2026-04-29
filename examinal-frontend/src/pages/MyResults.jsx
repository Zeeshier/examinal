import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../api/axios";
import Header from "../components/Header";
import LoadingSpinner from "../components/LoadingSpinner";
import { Award, ArrowRight, CheckCircle, XCircle } from "lucide-react";

export default function MyResults() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try { const { data } = await API.get("/api/submissions/my/all"); setSubmissions(data.filter((s) => s.status !== "in_progress")); } catch {}
      setLoading(false);
    })();
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <Header title="My Results" subtitle="View your exam scores and feedback" />
      {!submissions.length ? (
        <div className="card p-20 text-center"><Award size={44} className="mx-auto text-slate-300 mb-4" /><h3 className="text-lg font-semibold text-navy-800 text-navy-800 mb-1">No results yet</h3><p className="text-sm text-slate-400">Complete exams to see results.</p></div>
      ) : (
        <div className="space-y-3">
          {submissions.map((s) => (
            <Link key={s.id} to={`/results/${s.id}`} className="card p-5 flex items-center justify-between hover:shadow-md transition-all duration-200 block">
              <div className="flex items-center gap-4">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${s.is_passed ? "bg-emerald-50" : s.status === "submitted" ? "bg-amber-50" : "bg-red-50"}`}>
                  {s.is_passed ? <CheckCircle size={20} className="text-emerald-600" /> : s.status === "graded" ? <XCircle size={20} className="text-red-500" /> : <Award size={20} className="text-amber-600" />}
                </div>
                <div>
                  <p className="text-sm font-semibold text-navy-800">Exam #{s.exam_id}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{s.submitted_at ? new Date(s.submitted_at).toLocaleString() : "Pending"}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {s.status === "graded" ? (
                  <>
                    <div className="text-right"><p className="text-xl font-bold text-navy-800">{s.percentage?.toFixed(1)}%</p><p className="text-xs text-slate-400">{s.total_score}/{s.max_score}</p></div>
                    <span className={s.is_passed ? "badge-emerald" : "badge-red"}>{s.is_passed ? "Passed" : "Failed"}</span>
                  </>
                ) : <span className="badge-amber">Awaiting Grade</span>}
                <ArrowRight size={15} className="text-slate-300" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

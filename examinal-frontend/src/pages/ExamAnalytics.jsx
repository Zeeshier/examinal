import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import API from "../api/axios";
import Header from "../components/Header";
import LoadingSpinner from "../components/LoadingSpinner";
import { BarChart3, Users, Award, Target } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const COLORS = ["#ef4444", "#f59e0b", "#6366f1", "#3b82f6", "#10b981"];

export default function ExamAnalytics() {
  const { examId } = useParams();
  const [analytics, setAnalytics] = useState(null);
  const [qAnalytics, setQAnalytics] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [aRes, qRes] = await Promise.all([
          API.get(`/api/analytics/exam/${examId}`),
          API.get(`/api/analytics/exam/${examId}/questions`),
        ]);
        setAnalytics(aRes.data);
        setQAnalytics(qRes.data);
      } catch { /* */ }
      setLoading(false);
    })();
  }, [examId]);

  if (loading) return <LoadingSpinner />;
  if (!analytics) return <p>No analytics available</p>;

  const distData = Object.entries(analytics.score_distribution).map(([range, count]) => ({
    range,
    count,
  }));

  return (
    <div>
      <Header title="Exam Analytics" subtitle={analytics.exam_title} />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
              <Users size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Total Students</p>
              <p className="text-xl font-bold text-navy-800">{analytics.total_students}</p>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
              <Award size={20} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Average Score</p>
              <p className="text-xl font-bold text-navy-800">{analytics.average_score?.toFixed(1) ?? "—"}%</p>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
              <Target size={20} className="text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Pass Rate</p>
              <p className="text-xl font-bold text-navy-800">{analytics.pass_rate?.toFixed(1) ?? "—"}%</p>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
              <BarChart3 size={20} className="text-slate-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Highest / Lowest</p>
              <p className="text-xl font-bold text-navy-800">{analytics.highest_score?.toFixed(0) ?? "—"} / {analytics.lowest_score?.toFixed(0) ?? "—"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="card p-6">
          <h3 className="font-semibold text-navy-800 mb-4">Score Distribution</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={distData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="range" tick={{ fontSize: 12, fill: "#64748b" }} />
              <YAxis tick={{ fontSize: 12, fill: "#64748b" }} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0" }} />
              <Bar dataKey="count" fill="#4f46e5" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card p-6">
          <h3 className="font-semibold text-navy-800 mb-4">Submission Status</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={[
                  { name: "Graded", value: analytics.graded_count },
                  { name: "Submitted", value: analytics.submitted_count - analytics.graded_count },
                  { name: "Not submitted", value: analytics.total_students - analytics.submitted_count },
                ].filter((d) => d.value > 0)}
                cx="50%" cy="50%" outerRadius={90} dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}
                labelLine={false}
              >
                {[0, 1, 2].map((i) => <Cell key={i} fill={COLORS[i + 2]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Question analytics */}
      <div className="card">
        <div className="px-6 py-4 border-b">
          <h3 className="font-semibold text-navy-800">Question‑Level Analysis</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-slate-50">
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">#</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Question</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Type</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Accuracy</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Avg Score</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Difficulty</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {qAnalytics.map((q, i) => (
                <tr key={q.question_id} className="hover:bg-slate-50">
                  <td className="px-6 py-3 text-sm font-semibold text-slate-400">{i + 1}</td>
                  <td className="px-6 py-3 text-sm text-navy-800 max-w-xs truncate">{q.question_text}</td>
                  <td className="px-6 py-3"><span className="badge-blue">{q.question_type}</span></td>
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-600 rounded-full" style={{ width: `${q.accuracy_rate * 100}%` }} />
                      </div>
                      <span className="text-xs text-slate-600">{(q.accuracy_rate * 100).toFixed(0)}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-3 text-sm text-slate-700">{q.average_score.toFixed(2)}</td>
                  <td className="px-6 py-3">
                    <span className={q.difficulty_rating === "easy" ? "badge-emerald" : q.difficulty_rating === "medium" ? "badge-amber" : "badge-red"}>
                      {q.difficulty_rating}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

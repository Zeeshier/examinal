import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import API from "../api/axios";
import Header from "../components/Header";
import LoadingSpinner from "../components/LoadingSpinner";
import { BarChart3, BookOpen, Users, Award, ArrowRight } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function CourseAnalytics() {
  const { courseId } = useParams();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await API.get(`/api/analytics/course/${courseId}`);
        setAnalytics(data);
      } catch { /* */ }
      setLoading(false);
    })();
  }, [courseId]);

  if (loading) return <LoadingSpinner />;

  if (!analytics) {
    return (
      <div>
        <Header title="Course Analytics" />
        <div className="card p-16 text-center">
          <BarChart3 size={40} className="mx-auto text-slate-300 mb-4" />
          <p className="text-sm text-slate-500">No analytics available.</p>
        </div>
      </div>
    );
  }

  const chartData = analytics.exam_summaries.map((e) => ({
    name: e.exam_title.substring(0, 20),
    average: e.average_score || 0,
    pass_rate: e.pass_rate || 0,
  }));

  return (
    <div>
      <Header title="Course Analytics" subtitle={analytics.course_title} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
              <BookOpen size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Total Exams</p>
              <p className="text-xl font-bold text-navy-800">{analytics.total_exams}</p>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
              <Users size={20} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Enrolled Students</p>
              <p className="text-xl font-bold text-navy-800">{analytics.total_students}</p>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
              <Award size={20} className="text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Overall Average</p>
              <p className="text-xl font-bold text-navy-800">{analytics.overall_average?.toFixed(1) ?? "—"}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <div className="card p-6 mb-8">
          <h3 className="font-semibold text-navy-800 mb-4">Exam Performance Comparison</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} />
              <YAxis tick={{ fontSize: 12, fill: "#64748b" }} domain={[0, 100]} />
              <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0" }} />
              <Bar dataKey="average" name="Avg Score %" fill="#4f46e5" radius={[6, 6, 0, 0]} />
              <Bar dataKey="pass_rate" name="Pass Rate %" fill="#10b981" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Exam summaries */}
      <div className="card">
        <div className="px-6 py-4 border-b">
          <h3 className="font-semibold text-navy-800">Exam Summaries</h3>
        </div>
        <div className="divide-y">
          {analytics.exam_summaries.map((e) => (
            <div key={e.exam_id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
              <div>
                <p className="text-sm font-medium text-navy-800">{e.exam_title}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {e.total_students} students · {e.graded_count} graded
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm font-bold text-navy-800">{e.average_score?.toFixed(1) ?? "—"}%</p>
                  <p className="text-xs text-slate-500">avg score</p>
                </div>
                <span className={e.pass_rate && e.pass_rate > 70 ? "badge-emerald" : e.pass_rate ? "badge-amber" : "badge-slate"}>
                  {e.pass_rate?.toFixed(0) ?? "—"}% pass
                </span>
                <Link to={`/exams/${e.exam_id}/analytics`}>
                  <ArrowRight size={16} className="text-slate-400" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

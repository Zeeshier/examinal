import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import API from "../api/axios";
import Header from "../components/Header";
import LoadingSpinner from "../components/LoadingSpinner";
import { TrendingUp, Award, AlertTriangle, BarChart3 } from "lucide-react";

export default function StudentPerformance() {
  const { studentId: paramId } = useParams();
  const { user } = useAuth();
  const studentId = paramId || user.id;
  const [perf, setPerf] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await API.get(`/api/analytics/student/${studentId}`);
        setPerf(data);
      } catch { /* */ }
      setLoading(false);
    })();
  }, [studentId]);

  if (loading) return <LoadingSpinner />;

  if (!perf) {
    return (
      <div>
        <Header title="Performance" />
        <div className="card p-16 text-center">
          <TrendingUp size={40} className="mx-auto text-slate-300 mb-4" />
          <h3 className="text-lg font-semibold text-navy-800 text-navy-800 mb-1">No data yet</h3>
          <p className="text-sm text-slate-500">Complete exams to see your performance.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header title="Performance Overview" subtitle={perf.student_name} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
              <BarChart3 size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Exams Taken</p>
              <p className="text-xl font-bold text-navy-800">{perf.exams_taken}</p>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
              <TrendingUp size={20} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Average Score</p>
              <p className="text-xl font-bold text-navy-800">{perf.average_score.toFixed(1)}%</p>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
              <Award size={20} className="text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Highest</p>
              <p className="text-xl font-bold text-navy-800">{perf.highest_score.toFixed(1)}%</p>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
              <AlertTriangle size={20} className="text-red-500" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Lowest</p>
              <p className="text-xl font-bold text-navy-800">{perf.lowest_score.toFixed(1)}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Score bar */}
      <div className="card p-6 mb-6">
        <h3 className="font-semibold text-navy-800 mb-4">Score Summary</h3>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-slate-600">Average</span>
              <span className="font-medium text-navy-800">{perf.average_score.toFixed(1)}%</span>
            </div>
            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-blue-600 rounded-full transition-all" style={{ width: `${perf.average_score}%` }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-slate-600">Highest</span>
              <span className="font-medium text-navy-800">{perf.highest_score.toFixed(1)}%</span>
            </div>
            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${perf.highest_score}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Weak areas */}
      {perf.weak_areas.length > 0 && (
        <div className="card p-6">
          <h3 className="font-semibold text-navy-800 mb-4 flex items-center gap-2">
            <AlertTriangle size={18} className="text-amber-500" /> Areas for Improvement
          </h3>
          <div className="space-y-2">
            {perf.weak_areas.map((area, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl">
                <div className="w-6 h-6 bg-amber-100 rounded-lg flex items-center justify-center text-xs font-bold text-amber-600">{i + 1}</div>
                <p className="text-sm text-slate-700">{area}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import API from "../api/axios";
import Header from "../components/Header";
import LoadingSpinner from "../components/LoadingSpinner";
import toast from "react-hot-toast";
import { Users, BookOpen, FileText, ClipboardList, Award, ArrowRight, TrendingUp, Eye } from "lucide-react";

function StatCard({ icon: Icon, label, value, color, to }) {
  const colors = {
    blue: "bg-blue-50 text-blue-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    slate: "bg-slate-100 text-slate-600",
  };
  const inner = (
    <div className="card p-5 hover:shadow-md transition-all duration-200 cursor-pointer">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500 mb-1">{label}</p>
          <p className="text-3xl font-bold text-navy-800">{value ?? "—"}</p>
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colors[color]}`}>
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
  return to ? <Link to={to}>{inner}</Link> : inner;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [courses, setCourses] = useState([]);
  const [exams, setExams] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        if (user.role === "admin") {
          const { data } = await API.get("/api/admin/stats");
          setStats(data);
        }
        const [cRes, eRes] = await Promise.all([API.get("/api/courses/"), API.get("/api/exams/")]);
        setCourses(cRes.data);
        setExams(eRes.data);
        if (user.role === "student") {
          const sRes = await API.get("/api/submissions/my/all");
          setSubmissions(sRes.data);
        }
      } catch (err) {
        toast.error(err?.response?.data?.detail || "Failed to load dashboard data. Please refresh.");
      }
      setLoading(false);
    })();
  }, [user]);

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <Header title={`Welcome back, ${user.full_name.split(" ")[0]}`} subtitle={new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })} />

      {user.role === "admin" && stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <StatCard icon={Users} label="Total Users" value={stats.total_users} color="blue" to="/users" />
          <StatCard icon={BookOpen} label="Courses" value={stats.total_courses} color="emerald" to="/courses" />
          <StatCard icon={FileText} label="Exams" value={stats.total_exams} color="amber" to="/exams" />
          <StatCard icon={ClipboardList} label="Submissions" value={stats.total_submissions} color="slate" />
        </div>
      )}
      {user.role === "instructor" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          <StatCard icon={BookOpen} label="My Courses" value={courses.length} color="blue" to="/courses" />
          <StatCard icon={FileText} label="My Exams" value={exams.length} color="emerald" to="/exams" />
          <StatCard icon={ClipboardList} label="Published" value={exams.filter((e) => e.is_published).length} color="amber" />
        </div>
      )}
      {user.role === "student" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
          <StatCard icon={Eye} label="Available Exams" value={exams.length} color="blue" to="/browse-exams" />
          <StatCard icon={Award} label="Completed" value={submissions.filter((s) => s.status === "graded").length} color="amber" to="/my-results" />
        </div>
      )}

      <div className={`grid grid-cols-1 ${user.role === 'student' ? '' : 'lg:grid-cols-2'} gap-6`}>
        {user.role !== "student" && (
          <div className="card">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="font-semibold text-navy-800">Recent Courses</h3>
              <Link to="/courses" className="text-sm text-blue-600 font-medium hover:underline flex items-center gap-1">View All <ArrowRight size={14} /></Link>
            </div>
            <div className="divide-y divide-slate-100">
              {courses.slice(0, 5).map((c) => (
                <Link key={c.id} to={`/courses/${c.id}`} className="flex items-center justify-between px-6 py-3.5 hover:bg-slate-50 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-navy-800">{c.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{c.code}</p>
                  </div>
                  <ArrowRight size={15} className="text-slate-300" />
                </Link>
              ))}
              {!courses.length && <p className="px-6 py-10 text-center text-sm text-slate-400">No courses yet</p>}
            </div>
          </div>
        )}

        <div className="card">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <h3 className="font-semibold text-navy-800">{user.role === 'student' ? 'My Recent Exams' : 'Recent Exams'}</h3>
            <Link to="/exams" className="text-sm text-blue-600 font-medium hover:underline flex items-center gap-1">
              {user.role === 'student' ? 'My Exams' : 'View All'} <ArrowRight size={14} />
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {exams.slice(0, 5).map((e) => (
              <div key={e.id} className="flex items-center justify-between px-6 py-3.5">
                <div>
                  <p className="text-sm font-medium text-navy-800">{e.title}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{e.duration_minutes} min</p>
                </div>
                <span className={e.is_published ? "badge-emerald" : "badge-amber"}>{e.is_published ? "Published" : "Draft"}</span>
              </div>
            ))}
            {!exams.length && <p className="px-6 py-10 text-center text-sm text-slate-400">No exams yet</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

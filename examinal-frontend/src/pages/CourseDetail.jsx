import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import API from "../api/axios";
import Header from "../components/Header";
import Modal from "../components/Modal";
import LoadingSpinner from "../components/LoadingSpinner";
import {
  BookOpen, FileText, Upload, Users, UserPlus,
  BarChart3, ArrowRight, Trash2, Search, X,
  CheckCircle, GraduationCap, Mail,
} from "lucide-react";
import toast from "react-hot-toast";

export default function CourseDetail() {
  const { courseId } = useParams();
  const { user } = useAuth();
  const [course, setCourse] = useState(null);
  const [students, setStudents] = useState([]);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);

  // Enrollment state
  const [showEnroll, setShowEnroll] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [enrolling, setEnrolling] = useState(null); // student id being enrolled

  const isInstructor = user.role === "instructor";
  const isAdmin = user.role === "admin";
  const canManage = isInstructor;
  const canSeeAudit = isInstructor || isAdmin;

  const load = useCallback(async () => {
    try {
      const { data: c } = await API.get(`/api/courses/${courseId}`);
      setCourse(c);
      const { data: ex } = await API.get("/api/exams/", { params: { course_id: courseId } });
      setExams(ex);
      if (canSeeAudit) {
        try {
          const { data: st } = await API.get(`/api/courses/${courseId}/students`);
          setStudents(st);
        } catch { /* course may have no students */ }
      }
    } catch {
      toast.error("Failed to load course");
    }
    setLoading(false);
  }, [courseId, isInstructor]);

  useEffect(() => { load(); }, [load]);

  // ── Student Search ──
  const searchStudents = useCallback(async (query) => {
    if (!query || query.trim().length === 0) {
      // Show all available students when search is empty
      try {
        setSearching(true);
        const { data } = await API.get(`/api/courses/${courseId}/search-students`, {
          params: { q: "" },
        });
        setSearchResults(data);
      } catch {
        setSearchResults([]);
      }
      setSearching(false);
      return;
    }

    setSearching(true);
    try {
      const { data } = await API.get(`/api/courses/${courseId}/search-students`, {
        params: { q: query.trim() },
      });
      setSearchResults(data);
    } catch {
      setSearchResults([]);
    }
    setSearching(false);
  }, [courseId]);

  // Search on query change with debounce
  useEffect(() => {
    if (!showEnroll) return;
    const timer = setTimeout(() => {
      searchStudents(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, showEnroll, searchStudents]);

  // Load students when modal opens
  useEffect(() => {
    if (showEnroll) {
      searchStudents("");
    }
  }, [showEnroll, searchStudents]);

  // ── Enroll a student ──
  const enrollStudent = async (student) => {
    setEnrolling(student.id);
    try {
      await API.post(`/api/courses/${courseId}/enroll`, {
        student_id: student.id,
      });
      toast.success(`${student.full_name} enrolled successfully`);
      // Remove from search results
      setSearchResults((prev) => prev.filter((s) => s.id !== student.id));
      // Refresh student list
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Enrollment failed");
    }
    setEnrolling(null);
  };

  // ── Unenroll ──
  const unenroll = async (studentId, studentName) => {
    if (!confirm(`Remove ${studentName} from this course?`)) return;
    try {
      await API.delete(`/api/courses/${courseId}/enroll/${studentId}`);
      toast.success(`${studentName} removed`);
      load();
    } catch {
      toast.error("Failed to remove student");
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!course) return <p className="text-center py-20 text-slate-400">Course not found</p>;

  return (
    <div>
      <Header
        title={course.title}
        subtitle={`Course Code: ${course.code}`}
        actions={
          canManage && (
            <div className="flex gap-3">
              <Link to={`/courses/${courseId}/content`} className="btn-outline">
                <Upload size={16} /> Content
              </Link>
              <Link to={`/courses/${courseId}/analytics`} className="btn-outline">
                <BarChart3 size={16} /> Analytics
              </Link>
            </div>
          )
        }
      />

      {course.description && (
        <div className="card p-5 mb-6">
          <p className="text-sm text-slate-600">{course.description}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Exams ── */}
        <div className="card">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <h3 className="font-semibold text-navy-800 flex items-center gap-2">
              <FileText size={18} className="text-blue-600" /> Exams
            </h3>
            {canManage && (
              <Link to="/exams" className="text-sm text-blue-600 font-medium hover:underline">
                Create Exam
              </Link>
            )}
          </div>
          <div className="divide-y divide-slate-100">
            {exams.map((e) => (
              <div key={e.id} className="flex items-center justify-between px-6 py-3.5">
                <div>
                  <p className="text-sm font-medium text-navy-800">{e.title}</p>
                  <p className="text-xs text-slate-400">{e.duration_minutes} min · {e.total_marks} marks</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={e.is_published ? "badge-emerald" : "badge-amber"}>
                    {e.is_published ? "Published" : "Draft"}
                  </span>
                  {canManage ? (
                    <Link to={`/exams/${e.id}/build`} className="p-1.5 hover:bg-slate-100 rounded-lg">
                      <ArrowRight size={16} className="text-slate-400" />
                    </Link>
                  ) : isAdmin ? (
                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-2">READ ONLY</div>
                  ) : e.is_published ? (
                    <Link to={`/exam/${e.id}/take`} className="btn-primary text-xs px-3 py-1.5">
                      Take Exam
                    </Link>
                  ) : null}
                </div>
              </div>
            ))}
            {exams.length === 0 && (
              <p className="px-6 py-10 text-center text-sm text-slate-400">No exams yet</p>
            )}
          </div>
        </div>

        {/* ── Students (audit view for admin, management for instructor) ── */}
        {canSeeAudit && (
          <div className="card">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="font-semibold text-navy-800 flex items-center gap-2">
                <Users size={18} className="text-blue-600" />
                Students ({students.length})
              </h3>
              {canManage && (
                <button
                  onClick={() => setShowEnroll(true)}
                  className="btn-primary text-xs px-3 py-1.5"
                >
                  <UserPlus size={14} /> Enroll
                </button>
              )}
            </div>
            <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto">
              {students.map((s) => (
                <div key={s.id} className="flex items-center justify-between px-6 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-xs font-bold text-blue-600">
                      {(s.student_name || "?").charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-navy-800">
                        {s.student_name || `Student #${s.student_id}`}
                      </p>
                      <p className="text-xs text-slate-400">
                        {s.student_username ? `@${s.student_username}` : ""}
                        {s.student_email ? ` · ${s.student_email}` : ""}
                      </p>
                    </div>
                  </div>
                  {canManage && (
                    <button
                      onClick={() => unenroll(s.student_id, s.student_name || `Student #${s.student_id}`)}
                      className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={14} className="text-red-500" />
                    </button>
                  )}
                </div>
              ))}
              {students.length === 0 && (
                <div className="px-6 py-10 text-center">
                  <Users size={32} className="mx-auto text-slate-300 mb-2" />
                  <p className="text-sm text-slate-400">No students enrolled yet</p>
                  <button
                    onClick={() => setShowEnroll(true)}
                    className="text-sm text-blue-600 font-medium hover:underline mt-1"
                  >
                    Enroll your first student
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Enroll Student Modal ── */}
      <Modal
        open={showEnroll}
        onClose={() => {
          setShowEnroll(false);
          setSearchQuery("");
          setSearchResults([]);
        }}
        title="Enroll Students"
        size="md"
      >
        <div className="space-y-4">
          {/* Search input */}
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              className="input pl-10 pr-10"
              placeholder="Search by name, email, or username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Search results */}
          <div className="max-h-[350px] overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100">
            {searching ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : searchResults.length > 0 ? (
              searchResults.map((student) => (
                <div
                  key={student.id}
                  className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center">
                      <GraduationCap size={16} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-navy-800">
                        {student.full_name}
                      </p>
                      <p className="text-xs text-slate-400">
                        @{student.username} · {student.email}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => enrollStudent(student)}
                    disabled={enrolling === student.id}
                    className="btn-primary text-xs px-3 py-1.5"
                  >
                    {enrolling === student.id ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <UserPlus size={14} /> Enroll
                      </>
                    )}
                  </button>
                </div>
              ))
            ) : (
              <div className="text-center py-10">
                <Users size={32} className="mx-auto text-slate-300 mb-2" />
                <p className="text-sm text-slate-400">
                  {searchQuery
                    ? "No students found matching your search"
                    : "No available students to enroll"}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Students must create an account with the "Student" role first
                </p>
              </div>
            )}
          </div>

          {/* Help text */}
          <div className="bg-slate-50 rounded-xl p-3">
            <p className="text-xs text-slate-500">
              <strong>Tip:</strong> Search for students by their name, email, or username.
              Students must have registered on the platform with the "Student" role to appear here.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}

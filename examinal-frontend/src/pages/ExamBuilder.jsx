import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import API from "../api/axios";
import Header from "../components/Header";
import LoadingSpinner from "../components/LoadingSpinner";
import Modal from "../components/Modal";
import {
  Send, Eye, EyeOff, ListChecks, UserPlus, BarChart3,
  Settings, CheckCircle, Sparkles, Users, Plus, Key
} from "lucide-react";
import toast from "react-hot-toast";

export default function ExamBuilder() {
  const { examId } = useParams();
  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAssigned, setShowAssigned] = useState(false);
  const [assignedStudents, setAssignedStudents] = useState([]);

  const load = async () => {
    try {
      const { data: e } = await API.get(`/api/exams/${examId}`);
      setExam(e);
      const { data: q } = await API.get(`/api/questions/exam/${examId}`);
      setQuestions(q);
      const { data: a } = await API.get(`/api/exams/${examId}/assignments`);
      setAssignedStudents(a);
    } catch { toast.error("Exam not found"); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [examId]);

  const publish = async () => {
    try {
      const url = exam.is_published ? `/api/exams/${examId}/unpublish` : `/api/exams/${examId}/publish`;
      const { data } = await API.post(url);
      setExam(data);
      toast.success(data.is_published ? "Exam published" : "Exam unpublished");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed");
    }
  };

  const assignAll = async () => {
    try {
      const { data } = await API.post(`/api/exams/${examId}/assign-all`);
      toast.success(`Assigned ${data.assigned} students`);
      const { data: a } = await API.get(`/api/exams/${examId}/assignments`);
      setAssignedStudents(a);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed");
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!exam) return <p>Exam not found</p>;

  const currentTotalMarks = questions.reduce((acc, q) => acc + q.marks, 0);
  const marksMismatch = exam && currentTotalMarks !== exam.total_marks;

  return (
    <div>
      <Header
        title={exam.title}
        subtitle={`${exam.duration_minutes} min · ${exam.total_marks} marks · ${questions.length} questions`}
        actions={
          <div className="flex gap-3">
            <button onClick={publish} className={exam.is_published ? "btn-outline" : "btn-success"}>
              {exam.is_published ? <><EyeOff size={16} /> Unpublish</> : <><Send size={16} /> Publish</>}
            </button>
          </div>
        }
      />

      {marksMismatch && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between shadow-sm shadow-amber-900/5">
          <div className="flex items-center gap-3 text-amber-800">
            <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
              <Plus size={16} className="rotate-45" />
            </div>
            <p className="text-sm font-medium">
              Marks Mismatch: Questions sum to <strong>{currentTotalMarks}</strong>, but the exam total is <strong>{exam.total_marks}</strong>.
            </p>
          </div>
          <p className="text-xs text-amber-600 italic">This will prevent you from publishing.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <Link to={`/exams/${examId}/questions`} className="card p-5 hover:border-blue-300 transition-colors group">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
              <Sparkles size={20} className="text-blue-600" />
            </div>
          </div>
          <h3 className="font-semibold text-navy-800 mb-0.5">Questions</h3>
          <p className="text-xs text-slate-500">{questions.length} questions · Add or generate with AI</p>
        </Link>

        <div 
          className="card p-5 hover:border-emerald-300 transition-colors cursor-pointer group" 
          onClick={() => setShowAssigned(true)}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
              <Users size={20} className="text-emerald-600" />
            </div>
            <button 
              onClick={(e) => { e.stopPropagation(); assignAll(); }}
              className="p-2 hover:bg-emerald-100 rounded-lg text-emerald-600 transition-colors"
              title="Assign All Enrolled Students"
            >
              <UserPlus size={18} />
            </button>
          </div>
          <h3 className="font-semibold text-navy-800 mb-0.5">Assigned Students</h3>
          <p className="text-xs text-slate-500 font-medium group-hover:text-emerald-600 transition-colors">Click to view all assigned</p>
        </div>

        <Link to={`/exams/${examId}/grading`} className="card p-5 hover:border-amber-300 transition-colors">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
              <CheckCircle size={20} className="text-amber-600" />
            </div>
          </div>
          <h3 className="font-semibold text-navy-800 mb-0.5">Grading</h3>
          <p className="text-xs text-slate-500">Auto-grade or review submissions</p>
        </Link>
...
      {/* Assigned Students Modal */}
      <Modal 
        show={showAssigned} 
        onClose={() => setShowAssigned(false)}
        title="Assigned Students"
        maxWidth="2xl"
      >
        <div className="p-1">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-sm text-slate-500">List of students currently assigned to this exam.</p>
            </div>
            <button onClick={assignAll} className="btn-success py-2 text-xs">
              <UserPlus size={14} /> Assign All
            </button>
          </div>

          <div className="overflow-hidden border border-slate-100 rounded-2xl">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Student</th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Access Key</th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Assigned</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {assignedStudents.map(s => (
                  <tr key={s.student_id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-4">
                      <div className="font-bold text-navy-900 text-xs">{s.student_name}</div>
                      <div className="text-[10px] text-slate-400">{s.student_email}</div>
                    </td>
                    <td className="px-4 py-4">
                      <code className="text-[10px] font-mono bg-blue-50 text-blue-700 px-2 py-1 rounded-md">
                        {s.access_key || "No Key"}
                      </code>
                    </td>
                    <td className="px-4 py-4 text-[10px] text-slate-500">
                      {new Date(s.assigned_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
                {assignedStudents.length === 0 && (
                  <tr>
                    <td colSpan="3" className="px-4 py-12 text-center text-slate-400 italic text-sm">
                      No students assigned yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Modal>

        <Link to={`/exams/${examId}/analytics`} className="card p-5 hover:border-slate-300 transition-colors">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
              <BarChart3 size={20} className="text-slate-600" />
            </div>
          </div>
          <h3 className="font-semibold text-navy-800 mb-0.5">Analytics</h3>
          <p className="text-xs text-slate-500">View performance stats</p>
        </Link>
      </div>

      {/* Questions preview */}
      <div className="card">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h3 className="font-semibold text-navy-800">Questions Preview</h3>
          <Link to={`/exams/${examId}/questions`} className="text-sm text-blue-600 font-medium hover:underline">
            Manage Questions
          </Link>
        </div>
        <div className="divide-y">
          {questions.map((q, i) => (
            <div key={q.id} className="px-6 py-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-slate-400">Q{i + 1}</span>
                    <span className="badge-blue">{q.question_type}</span>
                    <span className="badge-slate">{q.difficulty}</span>
                    <span className="text-xs text-slate-500">{q.marks} marks</span>
                  </div>
                  <p className="text-sm text-navy-800">{q.question_text}</p>
                  {q.options && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {Object.entries(q.options).map(([k, v]) => (
                        <span key={k} className={`text-xs px-2.5 py-1 rounded-lg ${k === q.correct_answer ? "bg-emerald-50 text-emerald-700 font-medium" : "bg-slate-50 text-slate-600"}`}>
                          {k}: {v}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {questions.length === 0 && (
            <p className="px-6 py-12 text-center text-sm text-slate-400">No questions added yet</p>
          )}
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import API from "../api/axios";
import Header from "../components/Header";
import LoadingSpinner from "../components/LoadingSpinner";
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";

export default function ResultDetail() {
  const { submissionId } = useParams();
  const [detail, setDetail] = useState(null);
  const [questions, setQuestions] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await API.get(`/api/submissions/${submissionId}`);
        setDetail(data);

        // Fetch questions for the exam (student view doesn't have correct answers but graded results do)
        if (data.submission.exam_id) {
          try {
            const { data: qs } = await API.get(`/api/exams/${data.submission.exam_id}/questions-student`);
            const map = {};
            qs.forEach((q) => { map[q.id] = q; });
            setQuestions(map);
          } catch { /* */ }
        }
      } catch { /* */ }
      setLoading(false);
    })();
  }, [submissionId]);

  if (loading) return <LoadingSpinner />;
  if (!detail) return <p>Result not found</p>;

  const { submission, answers } = detail;

  return (
    <div>
      <Header
        title="Exam Result"
        subtitle={`Submitted: ${submission.submitted_at ? new Date(submission.submitted_at).toLocaleString() : "—"}`}
      />

      {/* Score card */}
      {submission.status === "graded" && (
        <div className={`card p-6 mb-6 ${submission.is_passed ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 mb-1">Your Score</p>
              <p className="text-3xl font-bold text-navy-800">{submission.percentage?.toFixed(1)}%</p>
              <p className="text-sm text-slate-600 mt-1">{submission.total_score} / {submission.max_score} marks</p>
            </div>
            <div className="text-right">
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold ${submission.is_passed ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                {submission.is_passed ? <CheckCircle size={18} /> : <XCircle size={18} />}
                {submission.is_passed ? "Passed" : "Failed"}
              </div>
            </div>
          </div>
        </div>
      )}

      {submission.status === "submitted" && (
        <div className="card p-6 mb-6 bg-amber-50 border-amber-200">
          <div className="flex items-center gap-3">
            <AlertCircle size={20} className="text-amber-600" />
            <p className="text-sm font-medium text-amber-700">Your exam is being graded. Check back later for results.</p>
          </div>
        </div>
      )}

      {/* Answers */}
      <div className="space-y-3">
        {answers.map((a, i) => {
          const q = questions[a.question_id];
          return (
            <div key={a.id} className={`card p-5 border-l-4 ${a.is_correct === true ? "border-l-emerald-500" : a.is_correct === false ? "border-l-red-500" : "border-l-slate-300"}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-semibold text-slate-400">Q{i + 1}</span>
                    {q && <span className="badge-blue">{q.question_type}</span>}
                    {a.is_correct === true && <span className="badge-emerald">Correct</span>}
                    {a.is_correct === false && <span className="badge-red">Incorrect</span>}
                  </div>
                  {q && <p className="text-sm font-medium text-navy-800 mb-2">{q.question_text}</p>}
                  <p className="text-sm text-slate-700">
                    <span className="font-medium">Your answer:</span> {a.student_answer || "(no answer)"}
                  </p>
                  {a.ai_feedback && (
                    <p className="text-xs text-slate-500 mt-2 bg-slate-50 p-3 rounded-lg">💡 {a.ai_feedback}</p>
                  )}
                </div>
                <div className="text-right ml-4">
                  <p className="text-lg font-bold text-navy-800">{a.score}</p>
                  <p className="text-xs text-slate-500">/ {a.max_score}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import API from "../api/axios";
import Header from "../components/Header";
import Modal from "../components/Modal";
import LoadingSpinner from "../components/LoadingSpinner";
import {
  CheckCircle, Zap, Eye, Pencil, Loader2,
  AlertCircle, Settings, LayoutDashboard,
} from "lucide-react";
import { toast } from "react-hot-toast";

export default function GradingPanel() {
  const { examId } = useParams();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [grading, setGrading] = useState(false);
  const [detail, setDetail] = useState(null);
  const [lowConf, setLowConf] = useState([]);
  const [showLowConf, setShowLowConf] = useState(false);
  const [override, setOverride] = useState({ id: null, score: 0, feedback: "" });
  const [showOverride, setShowOverride] = useState(false);
  const [gradingConfig, setGradingConfig] = useState(null);

  const load = async () => {
    try {
      const [subRes, confRes] = await Promise.all([
        API.get(`/api/submissions/exam/${examId}`),
        API.get("/api/grading/config"),
      ]);
      setSubmissions(subRes.data);
      setGradingConfig(confRes.data);
    } catch { /* */ }
    setLoading(false);
  };

  useEffect(() => { load(); }, [examId]);

  const gradeAll = async () => {
    setGrading(true);
    try {
      const { data } = await API.post(`/api/grading/auto/exam/${examId}`);
      toast.success(
        `Graded ${data.graded} submissions (${data.grading_mode} mode, ${data.llm_model})`
      );
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Grading failed");
    }
    setGrading(false);
  };

  const gradeOne = async (subId) => {
    try {
      await API.post(`/api/grading/auto/${subId}`);
      toast.success("Graded");
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed");
    }
  };

  const viewDetail = async (subId) => {
    try {
      const { data } = await API.get(`/api/submissions/${subId}`);
      setDetail(data);
    } catch { toast.error("Failed to load"); }
  };

  const loadLowConf = async () => {
    try {
      const { data } = await API.get(`/api/grading/low-confidence/${examId}`);
      setLowConf(data);
      setShowLowConf(true);
    } catch { toast.error("Failed"); }
  };

  const saveOverride = async () => {
    try {
      await API.patch(`/api/grading/manual/${override.id}`, null, {
        params: { score: override.score, feedback: override.feedback },
      });
      toast.success("Score updated");
      setShowOverride(false);
      if (detail) viewDetail(detail.submission.id);
      load();
    } catch { toast.error("Failed"); }
  };

  if (loading) return <LoadingSpinner />;

  const submitted = submissions.filter((s) => s.status === "submitted");
  const graded = submissions.filter((s) => s.status === "graded");

  return (
    <div>
      <Header
        title="Grading Panel"
        subtitle={`${submitted.length} pending . ${graded.length} graded`}
        actions={
          <div className="flex gap-3">
            {graded.length > 0 && (
              <button onClick={loadLowConf} className="btn-outline">
                <AlertCircle size={16} /> Review Low Confidence
              </button>
            )}
            {submitted.length > 0 && (
              <button onClick={gradeAll} disabled={grading} className="btn-primary">
                {grading ? (
                  <><Loader2 size={16} className="animate-spin" /> Grading...</>
                ) : (
                  <><Zap size={16} /> Auto-Grade All</>
                )}
              </button>
            )}
          </div>
        }
      />

      {/* AI Config Banner */}
      {gradingConfig && (
        <div className="card p-4 mb-6 bg-slate-50 border-slate-200">
          <div className="flex items-center gap-3 text-sm">
            <LayoutDashboard size={16} className="text-blue-600" />
            <span className="text-slate-600">
              <strong>AI Stack:</strong>{" "}
              LLM: <span className="font-mono text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">{gradingConfig?.llm_model || "N/A"}</span>
              {" . "}Embed: <span className="font-mono text-xs bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded">{gradingConfig?.embed_model || "N/A"}</span>
              {" . "}Rerank: <span className="font-mono text-xs bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded">{gradingConfig?.rerank_model || "N/A"}</span>
              {" . "}Mode: <span className="font-mono text-xs bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">{gradingConfig?.grading_mode || "N/A"}</span>
            </span>
          </div>
        </div>
      )}

      {/* Submissions table */}
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-slate-50">
              <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase">Student</th>
              <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase">Status</th>
              <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase">Score</th>
              <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase">Submitted</th>
              <th className="text-right px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {(() => {
              const statusPriority = { graded: 3, submitted: 2, in_progress: 1 };
              const deduped = Object.values(submissions.reduce((acc, sub) => {
                const existing = acc[sub.student_id];
                if (!existing || statusPriority[sub.status] > statusPriority[existing.status]) {
                  acc[sub.student_id] = sub;
                } else if (statusPriority[sub.status] === statusPriority[existing.status]) {
                  // Tie-break with latest submission
                  if (new Date(sub.submitted_at || sub.id) > new Date(existing.submitted_at || existing.id)) {
                    acc[sub.student_id] = sub;
                  }
                }
                return acc;
              }, {}));

              return deduped.sort((a, b) => b.id - a.id).map((s) => (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 text-sm font-medium text-navy-800">Student #{s.student_id}</td>
                  <td className="px-6 py-4">
                    <span className={
                      s.status === "graded" ? "badge-emerald" :
                        s.status === "submitted" ? "badge-amber" : "badge-slate"
                    }>
                      {s.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-700">
                    {s.total_score != null ? (
                      <span>
                        {s.total_score}/{s.max_score}
                        <span className={`ml-2 font-semibold ${s.percentage >= 70 ? "text-emerald-600" : s.percentage >= 40 ? "text-amber-600" : "text-red-600"}`}>
                          ({s.percentage?.toFixed(1)}%)
                        </span>
                      </span>
                    ) : "—"}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">
                    {s.submitted_at ? new Date(s.submitted_at).toLocaleString() : "—"}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => viewDetail(s.id)} className="p-2 hover:bg-slate-100 rounded-lg">
                        <Eye size={15} className="text-slate-500" />
                      </button>
                      {s.status === "submitted" && (
                        <button onClick={() => gradeOne(s.id)} className="p-2 hover:bg-emerald-50 rounded-lg">
                          <CheckCircle size={15} className="text-emerald-600" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ));
            })()}
          </tbody>
        </table>
        {submissions.length === 0 && (
          <p className="text-center py-12 text-sm text-slate-400">No submissions yet</p>
        )}
      </div>

      {/* Detail modal */}
      <Modal open={!!detail} onClose={() => setDetail(null)} title="Submission Detail" size="xl">
        {detail && (
          <div className="space-y-4">
            <div className="flex gap-3 flex-wrap text-sm">
              <span className="badge-blue">Student #{detail.submission.student_id}</span>
              <span className={detail?.submission?.is_passed ? "badge-emerald" : "badge-red"}>
                {detail?.submission?.is_passed ? "Passed" : "Failed"}
              </span>
              <span className="text-slate-600">
                Score: {detail?.submission?.total_score}/{detail?.submission?.max_score} ({detail?.submission?.percentage?.toFixed(1)}%)
              </span>
            </div>
            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
              {detail.answers.map((a) => {
                const confColor = a.confidence_score >= 0.7
                  ? "text-emerald-600" : a.confidence_score >= 0.4
                    ? "text-amber-600" : "text-red-600";
                return (
                  <div key={a.id} className={`p-4 rounded-xl border ${a.is_correct ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"}`}>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold text-slate-500">Q#{a.question_id}</span>
                          <span className="text-xs text-slate-600">{a.score}/{a.max_score}</span>
                          {a.confidence_score != null && (
                            <span className={`text-xs font-mono ${confColor}`}>
                              conf: {(a.confidence_score * 100).toFixed(0)}%
                            </span>
                          )}
                          {a.confidence_score != null && a.confidence_score < 0.7 && (
                            <AlertCircle size={12} className="text-amber-500" />
                          )}
                        </div>
                        <p className="text-sm text-slate-700"><strong>Answer:</strong> {a.student_answer || "(no answer)"}</p>
                        {a.ai_feedback && (
                          <p className="text-xs text-slate-500 mt-1 bg-white/50 p-2 rounded-lg">{a.ai_feedback}</p>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          setOverride({ id: a.id, score: a.score, feedback: "" });
                          setShowOverride(true);
                        }}
                        className="p-1.5 hover:bg-white rounded-lg ml-2"
                      >
                        <Pencil size={14} className="text-slate-500" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Modal>

      {/* Low confidence review modal */}
      <Modal open={showLowConf} onClose={() => setShowLowConf(false)} title="Low Confidence Answers - Review Needed" size="xl">
        <div className="space-y-3 max-h-[60vh] overflow-y-auto">
          {lowConf.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle size={32} className="mx-auto text-emerald-500 mb-2" />
              <p className="text-sm text-slate-600">All answers have high confidence scores. No review needed.</p>
            </div>
          ) : (
            lowConf.map((a) => (
              <div key={a.answer_id} className="p-4 rounded-xl border border-amber-200 bg-amber-50">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-slate-500">
                        Submission #{a.submission_id} . Q#{a.question_id}
                      </span>
                      <span className="text-xs font-mono text-red-600">
                        confidence: {((a.confidence_score || a.confidence || 0) * 100).toFixed(0)}%
                      </span>
                    </div>
                    <p className="text-sm text-slate-700 mb-1">
                      <strong>Answer:</strong> {a.student_answer || "(empty)"}
                    </p>
                    <p className="text-xs text-slate-500">
                      Current: {a.current_score}/{a.max_score} - {a.ai_feedback}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setOverride({ id: a.answer_id, score: a.current_score, feedback: "" });
                      setShowOverride(true);
                    }}
                    className="btn-outline text-xs px-3 py-1.5 ml-2"
                  >
                    <Pencil size={12} /> Override
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </Modal>

      {/* Override modal */}
      <Modal open={showOverride} onClose={() => setShowOverride(false)} title="Override Score" size="sm">
        <div className="space-y-4">
          <div>
            <label className="label">Score</label>
            <input
              className="input" type="number" step="0.5"
              value={override.score}
              onChange={(e) => setOverride({ ...override, score: parseFloat(e.target.value) })}
            />
          </div>
          <div>
            <label className="label">Feedback</label>
            <textarea
              className="input min-h-[60px]"
              placeholder="Explain why you changed the score..."
              value={override.feedback}
              onChange={(e) => setOverride({ ...override, feedback: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button className="btn-outline" onClick={() => setShowOverride(false)}>Cancel</button>
            <button className="btn-primary" onClick={saveOverride}>Save Override</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

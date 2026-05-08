import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import API from "../api/axios";
import { useAuth } from "../context/AuthContext";
import {
  Clock, Send, ChevronLeft, ChevronRight, Save, GraduationCap,
  AlertTriangle, Shield, Maximize, Eye, EyeOff,
} from "lucide-react";
import toast from "react-hot-toast";

const MAX_VIOLATIONS = 3;

// ── Pre-Exam Security Modal ──────────────────────────────────────────────────
function PreExamModal({ exam, onStart }) {
  return (
    <div className="fixed inset-0 bg-slate-950 flex items-center justify-center z-50 p-6">
      <div className="max-w-lg w-full bg-slate-900 border border-slate-700 rounded-3xl p-8 shadow-2xl">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-blue-600/20 border-2 border-blue-500/40 rounded-3xl flex items-center justify-center">
            <Shield size={36} className="text-blue-400" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-white text-center mb-2">
          {exam?.title}
        </h1>
        <div className="text-center mb-8">
          <p className="text-slate-400 text-sm">
            Duration: {exam?.duration_minutes} min &nbsp;·&nbsp; {exam?.total_marks} marks
          </p>
          {exam?.schedule_type === "scheduled" && (
            <p className="text-blue-400 text-xs font-bold uppercase tracking-widest mt-2">
              Ends at: {new Date(exam.end_time).toLocaleDateString()} {new Date(exam.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          )}
        </div>

        {/* Rules */}
        <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5 mb-6 space-y-3">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
            Security Rules — Please Read
          </p>
          {[
            { icon: "🖥️", text: "Exam will run in fullscreen. Exiting fullscreen is a violation." },
            { icon: "🚫", text: "Switching tabs or windows will be flagged as cheating." },
            { icon: "🖱️", text: "Moving your cursor outside the exam window will be logged." },
            { icon: "⚠️", text: "After 3 violations, your exam will be auto-submitted immediately." },
            { icon: "📋", text: "Copy, paste, right-click, and screenshots are blocked." },
            { icon: "⌨️", text: "Keys like F12, Ctrl+U, and PrintScreen are disabled." },
          ].map((r, i) => (
            <div key={i} className="flex items-start gap-3">
              <span className="text-lg flex-shrink-0">{r.icon}</span>
              <p className="text-sm text-slate-300 leading-snug">{r.text}</p>
            </div>
          ))}
        </div>

        <p className="text-xs text-slate-500 text-center mb-6">
          By starting the exam, you agree to follow all rules and accept that violations may result in automatic submission.
        </p>

        <button
          onClick={onStart}
          className="w-full btn-primary py-3.5 text-base rounded-2xl"
        >
          <Maximize size={18} />
          Enter Fullscreen & Start Exam
        </button>
      </div>
    </div>
  );
}

// ── Warning Overlay ──────────────────────────────────────────────────────────
function ViolationWarning({ count, message, onDismiss }) {
  if (!message) return null;
  const isFinal = count >= MAX_VIOLATIONS;
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-6">
      <div className={`max-w-md w-full border rounded-3xl p-8 shadow-2xl text-center ${
        isFinal
          ? "bg-red-950 border-red-700"
          : "bg-amber-950 border-amber-700"
      }`}>
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 ${
          isFinal ? "bg-red-700/40" : "bg-amber-700/40"
        }`}>
          <AlertTriangle size={32} className={isFinal ? "text-red-400" : "text-amber-400"} />
        </div>
        <h2 className={`text-xl font-bold mb-2 ${isFinal ? "text-red-300" : "text-amber-300"}`}>
          {isFinal ? "Exam Auto-Submitted" : `Violation Warning ${count}/${MAX_VIOLATIONS}`}
        </h2>
        <p className={`text-sm mb-6 leading-relaxed ${isFinal ? "text-red-400" : "text-amber-400"}`}>
          {message}
        </p>
        {!isFinal && (
          <button
            onClick={onDismiss}
            className={`btn-primary px-8 py-3 rounded-2xl ${
              count === MAX_VIOLATIONS - 1
                ? "bg-red-600 hover:bg-red-500"
                : "bg-amber-600 hover:bg-amber-500"
            }`}
          >
            I Understand — Resume Exam
          </button>
        )}
      </div>
    </div>
  );
}

// ── Blackout Overlay (screenshot deterrent) ──────────────────────────────────
function BlackoutOverlay({ active }) {
  if (!active) return null;
  return (
    <div className="fixed inset-0 bg-black z-[100] flex items-center justify-center select-none">
      <div className="text-center">
        <EyeOff size={48} className="text-slate-700 mx-auto mb-4" />
        <p className="text-slate-600 text-sm font-medium">
          Return to the exam window to continue
        </p>
      </div>
    </div>
  );
}

// ── Main ExamTaking Component ─────────────────────────────────────────────────
export default function ExamTaking() {
  const { examId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const accessKey = location.state?.accessKey;

  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [examStarted, setExamStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [violations, setViolations] = useState(0);
  const [violationMsg, setViolationMsg] = useState("");
  const [blackout, setBlackout] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const timerRef = useRef(null);
  const autosaveRef = useRef(null);
  const violationsRef = useRef(0);
  const submittingRef = useRef(false);

  // ── Load exam data ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!accessKey) {
      toast.error("Access key required to start exam");
      navigate("/exams");
      return;
    }

    (async () => {
      try {
        const { data: e } = await API.get(`/api/exams/${examId}`);
        setExam(e);
        
        // Calculate Time Left
        const now = new Date();
        if (e.schedule_type === "scheduled" && e.end_time) {
          const endTime = new Date(e.end_time);
          const diffInSecs = Math.floor((endTime - now) / 1000);
          
          if (diffInSecs <= 0) {
            toast.error("This exam's scheduled time has already ended.");
            navigate("/exams");
            return;
          }
          
          // Time left is the minimum of (duration) and (time until end_time)
          const durationSecs = e.duration_minutes * 60;
          setTimeLeft(Math.min(durationSecs, diffInSecs));
        } else {
          // Anytime exam
          setTimeLeft(e.duration_minutes * 60);
        }

        const { data: q } = await API.get(`/api/exams/${examId}/questions-student`);
        setQuestions(q);
        const { data: sub } = await API.post("/api/submissions/start", { 
          exam_id: parseInt(examId),
          access_key: accessKey
        });
        setSubmission(sub);
      } catch (err) {
        toast.error(err.response?.data?.detail || "Cannot start exam");
        navigate("/exams");
      }
      setLoading(false);
    })();
  }, [examId, accessKey]);

  // ── Timer ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!submission || !examStarted || timeLeft <= 0) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((p) => {
        if (p <= 1) {
          clearInterval(timerRef.current);
          handleSubmit(true, "time_up");
          return 0;
        }
        return p - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [submission, examStarted]);

  // ── Autosave every 30s ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!submission || !examStarted) return;
    autosaveRef.current = setInterval(() => doAutosave(), 30000);
    return () => clearInterval(autosaveRef.current);
  }, [submission, examStarted, answers]);

  // ── Activity logger ────────────────────────────────────────────────────────
  const logActivity = useCallback((type, details = "") => {
    if (!submission) return;
    API.post("/api/submissions/activity", {
      exam_id: parseInt(examId),
      submission_id: submission.id,
      action_type: type,
      details,
    }).catch(() => {});
  }, [submission, examId]);

  // ── Core violation handler ─────────────────────────────────────────────────
  const triggerViolation = useCallback((reason, logType) => {
    violationsRef.current += 1;
    const current = violationsRef.current;
    setViolations(current);
    logActivity(logType, `Violation #${current}: ${reason}`);

    if (current >= MAX_VIOLATIONS) {
      setViolationMsg(
        `You have reached ${MAX_VIOLATIONS} violations. Your exam has been automatically submitted with your current answers.`
      );
      handleSubmit(true, "auto_submit_violations");
    } else {
      setViolationMsg(
        current === MAX_VIOLATIONS - 1
          ? `⚠️ FINAL WARNING! ${reason}. One more violation will AUTO-SUBMIT your exam immediately!`
          : `${reason}. You have ${MAX_VIOLATIONS - current} warning(s) remaining before auto-submission.`
      );
      // Request fullscreen again on violation
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
    }
  }, [logActivity]);

  // ── Security event listeners (active only after exam starts) ──────────────
  useEffect(() => {
    if (!submission || !examStarted) return;

    // 1. Tab visibility change
    const handleVisibility = () => {
      if (submittingRef.current) return;
      if (document.hidden) {
        setBlackout(true);
        triggerViolation("You switched to another tab", "tab_switch");
      } else {
        setBlackout(false);
      }
    };

    // 2. Window blur (switched app/window)
    const handleBlur = () => {
      if (submittingRef.current) return;
      setBlackout(true);
      triggerViolation("You left the exam window", "focus_lost");
    };

    const handleFocus = () => {
      if (submittingRef.current) return;
      setBlackout(false);
    };

    // 3. Fullscreen exit
    const handleFullscreenChange = () => {
      if (submittingRef.current) return;
      if (!document.fullscreenElement && violationsRef.current < MAX_VIOLATIONS) {
        triggerViolation("You exited fullscreen mode", "fullscreen_exit");
      }
    };

    // 4. Mouse leaves window
    const handleMouseLeave = (e) => {
      if (submittingRef.current) return;
      if (e.clientY <= 0 || e.clientX <= 0 || e.clientX >= window.innerWidth || e.clientY >= window.innerHeight) {
        triggerViolation("Your cursor left the exam window", "cursor_out");
      }
    };

    // 5. Blocked keys: F12, Ctrl+U, Ctrl+Shift+I/J/C, PrintScreen, Ctrl+P
    const handleKeyDown = (e) => {
      if (submittingRef.current) return;
      const blocked = [
        e.key === "F12",
        e.key === "PrintScreen",
        e.ctrlKey && e.key === "u",
        e.ctrlKey && e.key === "U",
        e.ctrlKey && e.key === "p",
        e.ctrlKey && e.key === "P",
        e.ctrlKey && e.shiftKey && ["I", "i", "J", "j", "C", "c", "K", "k"].includes(e.key),
        e.altKey && e.key === "Tab", // Alt+Tab
      ];
      if (blocked.some(Boolean)) {
        e.preventDefault();
        logActivity("blocked_key", `Key: ${e.key}`);
        toast.error("This key is disabled during the exam", { id: "blocked-key" });
      }
    };

    // 6. Copy / Paste / Cut / Context menu
    const handleCopy = (e) => { if (submittingRef.current) return; e.preventDefault(); logActivity("copy_attempt"); toast.error("Copying is disabled", { id: "copy" }); };
    const handlePaste = (e) => { if (submittingRef.current) return; e.preventDefault(); logActivity("paste_attempt"); toast.error("Pasting is disabled", { id: "paste" }); };
    const handleCut = (e) => { if (submittingRef.current) return; e.preventDefault(); logActivity("cut_attempt"); };
    const handleContextMenu = (e) => { if (submittingRef.current) return; e.preventDefault(); logActivity("right_click"); };

    // 7. Block print
    const handleBeforePrint = () => {
      if (submittingRef.current) return;
      logActivity("print_attempt");
      toast.error("Printing is not allowed during the exam");
    };

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("blur", handleBlur);
    window.addEventListener("focus", handleFocus);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("mouseleave", handleMouseLeave);
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("copy", handleCopy);
    document.addEventListener("paste", handlePaste);
    document.addEventListener("cut", handleCut);
    document.addEventListener("contextmenu", handleContextMenu);
    window.addEventListener("beforeprint", handleBeforePrint);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("mouseleave", handleMouseLeave);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("copy", handleCopy);
      document.removeEventListener("paste", handlePaste);
      document.removeEventListener("cut", handleCut);
      document.removeEventListener("contextmenu", handleContextMenu);
      window.removeEventListener("beforeprint", handleBeforePrint);
    };
  }, [submission, examStarted, triggerViolation, logActivity]);

  // ── Start exam: request fullscreen ─────────────────────────────────────────
  const handleStartExam = async () => {
    try {
      await document.documentElement.requestFullscreen();
    } catch {
      // Fullscreen may be denied on some browsers, ignore but warn
      toast("Fullscreen request was denied. Please enable it in your browser.", { icon: "⚠️" });
    }
    setExamStarted(true);
    logActivity("exam_started_secure", "Pre-exam modal accepted");
  };

  // ── Autosave ───────────────────────────────────────────────────────────────
  const doAutosave = useCallback(async () => {
    if (!submission) return;
    const payload = Object.entries(answers).map(([q, a]) => ({
      question_id: parseInt(q),
      student_answer: a,
    }));
    if (!payload.length) return;
    try {
      await API.post(`/api/submissions/${submission.id}/autosave`, { answers: payload });
    } catch {}
  }, [submission, answers]);

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = useCallback(async (auto = false, reason = "manual") => {
    if (!auto && !confirm("Are you sure you want to submit your exam?")) return;
    
    submittingRef.current = true;
    setSubmitting(true);
    
    clearInterval(timerRef.current);
    clearInterval(autosaveRef.current);

    // Exit fullscreen gracefully
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }

    const payload = Object.entries(answers).map(([q, a]) => ({
      question_id: parseInt(q),
      student_answer: a,
    }));
    try {
      await API.post(`/api/submissions/${submission.id}/submit`, { answers: payload });
      if (auto && reason === "auto_submit_violations") {
        toast.error("Exam auto-submitted due to violations.", { duration: 5000 });
      } else if (auto) {
        toast("Time's up! Exam submitted automatically.", { icon: "⏱️" });
      } else {
        toast.success("Exam submitted successfully!");
      }
      navigate("/my-results");
    } catch {
      toast.error("Submission failed. Please try again.");
      setSubmitting(false);
    }
  }, [submission, answers, navigate]);

  // ── Dismiss violation warning ──────────────────────────────────────────────
  const dismissWarning = () => {
    setViolationMsg("");
    setBlackout(false);
    // Re-enter fullscreen after dismissal
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  };

  // ── Helpers ────────────────────────────────────────────────────────────────
  const fmt = (s) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-[3px] border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500 text-sm">Loading exam...</p>
        </div>
      </div>
    );
  }

  // Pre-exam security modal
  if (!examStarted) {
    return <PreExamModal exam={exam} onStart={handleStartExam} />;
  }

  const q = questions[currentIdx];
  const urgent = timeLeft < 300;
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="min-h-screen bg-slate-50 exam-secure select-none overflow-hidden">

      {/* Overlays */}
      <BlackoutOverlay active={blackout && !violationMsg} />
      <ViolationWarning
        count={violations}
        message={violationMsg}
        onDismiss={dismissWarning}
      />

      {/* ── Top Security Bar ─────────────────────────────────────────────── */}
      <div className="sticky top-0 z-50 bg-slate-950 border-b border-slate-800 px-6 py-3 shadow-xl">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          {/* Left: Exam info */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/30">
              <GraduationCap size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white leading-tight">{exam?.title}</h1>
              <p className="text-xs text-slate-500 leading-tight">
                Q {currentIdx + 1}/{questions.length} &nbsp;·&nbsp; {answeredCount}/{questions.length} answered
              </p>
            </div>
          </div>

          {/* Center: Violation indicator */}
          <div className="flex items-center gap-2">
            {[...Array(MAX_VIOLATIONS)].map((_, i) => (
              <div
                key={i}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                  i < violations
                    ? violations >= MAX_VIOLATIONS ? "bg-red-500 animate-pulse" : "bg-amber-500"
                    : "bg-slate-700"
                }`}
                title={`Violation ${i + 1}`}
              />
            ))}
            {violations > 0 && (
              <span className={`text-xs font-medium ml-1 ${
                violations >= MAX_VIOLATIONS ? "text-red-400" : "text-amber-400"
              }`}>
                {violations >= MAX_VIOLATIONS ? "Auto-submitted" : `${violations} violation${violations > 1 ? "s" : ""}`}
              </span>
            )}
          </div>

          {/* Right: Timer + actions */}
          <div className="flex items-center gap-3">
            {/* Shield lock indicator */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-900/40 border border-emerald-700/40 rounded-lg">
              <Shield size={12} className="text-emerald-400" />
              <span className="text-xs text-emerald-400 font-medium">Secure</span>
            </div>

            {/* Timer */}
            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-sm font-bold transition-all duration-300 ${
              urgent
                ? "bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse"
                : "bg-white/5 text-white border border-white/10"
            }`}>
              <Clock size={15} />
              {fmt(timeLeft)}
            </div>

            {/* Autosave */}
            <button
              onClick={() => doAutosave()}
              className="px-3 py-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-all text-xs font-medium"
              title="Save progress"
            >
              <Save size={14} />
            </button>

            {/* Submit */}
            <button
              onClick={() => handleSubmit(false)}
              disabled={submitting}
              className="btn-primary text-xs px-4 py-2 rounded-xl"
            >
              <Send size={14} />
              {submitting ? "Submitting..." : "Submit Exam"}
            </button>
          </div>
        </div>
      </div>

      {/* ── Main Content ─────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-12 gap-6">

          {/* Question Navigator */}
          <div className="col-span-3">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 sticky top-24 shadow-sm">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                Questions
              </h3>
              <div className="grid grid-cols-5 gap-2 mb-5">
                {questions.map((qi, i) => (
                  <button
                    key={qi.id}
                    onClick={() => setCurrentIdx(i)}
                    className={`w-9 h-9 rounded-xl text-xs font-bold transition-all duration-200 ${
                      i === currentIdx
                        ? "bg-blue-600 text-white shadow-sm shadow-blue-600/30 scale-105"
                        : answers[qi.id]
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>

              <div className="space-y-2 text-xs text-slate-400 border-t border-slate-100 pt-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-600 rounded-sm" />
                  Current
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-emerald-50 border border-emerald-200 rounded-sm" />
                  Answered
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-slate-100 rounded-sm" />
                  Unanswered
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-5">
                <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                  <span>Progress</span>
                  <span>{answeredCount}/{questions.length}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${(answeredCount / questions.length) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Question Card */}
          <div className="col-span-9">
            {q && (
              <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
                {/* Question meta */}
                <div className="flex items-center gap-2 mb-6">
                  <span className="badge-blue">{q.question_type?.toUpperCase()}</span>
                  <span className="badge-slate">{q.difficulty}</span>
                  <span className="text-xs text-slate-400 font-medium ml-auto">
                    {q.marks} {q.marks === 1 ? "mark" : "marks"}
                  </span>
                </div>

                {/* Question text */}
                <h2 className="text-lg font-semibold text-slate-800 mb-7 leading-relaxed">
                  {q.question_text}
                </h2>

                {/* MCQ Options */}
                {q.question_type === "mcq" && q.options && (
                  <div className="space-y-3">
                    {Object.entries(q.options).map(([k, v]) => (
                      <label
                        key={k}
                        className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                          answers[q.id] === k
                            ? "border-blue-600 bg-blue-50/80"
                            : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                          answers[q.id] === k ? "border-blue-600" : "border-slate-300"
                        }`}>
                          {answers[q.id] === k && (
                            <div className="w-2.5 h-2.5 bg-blue-600 rounded-full" />
                          )}
                        </div>
                        <span className="text-sm text-slate-700">
                          <span className="font-bold text-slate-800">{k}.</span> {v}
                        </span>
                        <input
                          type="radio"
                          className="hidden"
                          checked={answers[q.id] === k}
                          onChange={() => setAnswers({ ...answers, [q.id]: k })}
                        />
                      </label>
                    ))}
                  </div>
                )}

                {/* Text answer */}
                {q.question_type !== "mcq" && (
                  <textarea
                    className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all min-h-[220px] resize-none leading-relaxed"
                    placeholder="Type your answer here..."
                    value={answers[q.id] || ""}
                    onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                  />
                )}

                {/* Navigation */}
                <div className="flex justify-between mt-8 pt-6 border-t border-slate-100">
                  <button
                    onClick={() => setCurrentIdx(Math.max(0, currentIdx - 1))}
                    disabled={currentIdx === 0}
                    className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft size={16} /> Previous
                  </button>
                  <button
                    onClick={() => setCurrentIdx(Math.min(questions.length - 1, currentIdx + 1))}
                    disabled={currentIdx === questions.length - 1}
                    className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Next <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

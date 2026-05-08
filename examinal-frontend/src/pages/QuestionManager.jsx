import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import API from "../api/axios";
import Header from "../components/Header";
import Modal from "../components/Modal";
import LoadingSpinner from "../components/LoadingSpinner";
import { Plus, Sparkles, Pencil, Trash2, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

export default function QuestionManager() {
  const { examId } = useParams();
  const [questions, setQuestions] = useState([]);
  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showGen, setShowGen] = useState(false);
  const [genBusy, setGenBusy] = useState(false);
  const [editQ, setEditQ] = useState(null);

  const [form, setForm] = useState({
    question_text: "", question_type: "mcq", correct_answer: "",
    marks: 1, difficulty: "medium", explanation: "",
    optA: "", optB: "", optC: "", optD: "",
  });

  const [genConfigs, setGenConfigs] = useState([
    { id: 1, num_questions: 5, question_type: "mcq", marks: 1 }
  ]);
  const [genForm, setGenForm] = useState({
    difficulty: "medium", topic: "",
  });

  const load = async () => {
    try {
      const [eRes, qRes] = await Promise.all([
        API.get(`/api/exams/${examId}`),
        API.get(`/api/questions/exam/${examId}`),
      ]);
      setExam(eRes.data);
      setQuestions(qRes.data);
    } catch { /* */ }
    setLoading(false);
  };

  useEffect(() => { load(); }, [examId]);

  const resetForm = () => {
    setForm({ question_text: "", question_type: "mcq", correct_answer: "", marks: 1, difficulty: "medium", explanation: "", optA: "", optB: "", optC: "", optD: "" });
  };

  const saveQuestion = async (e, addAnother = false) => {
    e.preventDefault();
    if (!form.correct_answer) {
        toast.error("Please specify the correct answer.");
        return;
    }
    const payload = {
      exam_id: parseInt(examId),
      question_text: form.question_text,
      question_type: form.question_type,
      correct_answer: form.correct_answer,
      marks: parseFloat(form.marks),
      difficulty: form.difficulty,
      explanation: form.explanation || null,
      options: form.question_type === "mcq" ? { A: form.optA, B: form.optB, C: form.optC, D: form.optD } : null,
    };
    try {
      if (editQ) {
        await API.patch(`/api/questions/${editQ.id}`, payload);
        toast.success("Question updated");
      } else {
        await API.post("/api/questions/", payload);
        toast.success("Question added");
      }
      
      if (!addAnother) {
        setShowAdd(false);
      }
      setEditQ(null);
      if (addAnother) {
        setForm({ ...form, question_text: "", correct_answer: "", explanation: "", optA: "", optB: "", optC: "", optD: "" });
      } else {
        resetForm();
      }
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed");
    }
  };

  const editQuestion = (q) => {
    setEditQ(q);
    setForm({
      question_text: q.question_text,
      question_type: q.question_type,
      correct_answer: q.correct_answer,
      marks: q.marks,
      difficulty: q.difficulty,
      explanation: q.explanation || "",
      optA: q.options?.A || "",
      optB: q.options?.B || "",
      optC: q.options?.C || "",
      optD: q.options?.D || "",
    });
    setShowAdd(true);
  };

  const deleteQ = async (id) => {
    if (!confirm("Delete this question?")) return;
    try { await API.delete(`/api/questions/${id}`); toast.success("Deleted"); load(); }
    catch { toast.error("Failed"); }
  };

  const generateAI = async (e) => {
    e.preventDefault();
    setGenBusy(true);
    let totalGenerated = 0;
    try {
      for (const config of genConfigs) {
        if (config.num_questions <= 0) continue;
        const payload = {
          course_id: exam.course_id,
          exam_id: parseInt(examId),
          difficulty: genForm.difficulty,
          topic: genForm.topic,
          num_questions: parseInt(config.num_questions),
          question_type: config.question_type,
          marks: parseFloat(config.marks),
        };
        const { data } = await API.post("/api/questions/generate", payload);
        totalGenerated += data.length;
      }
      toast.success(`Generated ${totalGenerated} questions`);
      setShowGen(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Generation failed");
    }
    setGenBusy(false);
  };

  if (loading) return <LoadingSpinner />;

  const currentTotalMarks = questions.reduce((acc, q) => acc + q.marks, 0);
  const marksMismatch = exam && currentTotalMarks !== exam.total_marks;

  return (
    <div>
      <Header
        title="Question Manager"
        subtitle={`${exam?.title} · ${questions.length} questions`}
        actions={
          <div className="flex gap-3">
            <button className="btn-outline" onClick={() => { resetForm(); setEditQ(null); setShowAdd(true); }}>
              <Plus size={16} /> Add Manual
            </button>
            <button className="btn-primary" onClick={() => setShowGen(true)}>
              <Sparkles size={16} /> Generate with AI
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
          <p className="text-xs text-amber-600 italic">Please adjust marks before publishing.</p>
        </div>
      )}

      {/* Questions list */}
      <div className="space-y-3">
        {questions.map((q, i) => (
          <div key={q.id} className="card p-5">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-7 h-7 bg-slate-100 rounded-lg flex items-center justify-center text-xs font-bold text-slate-500">{i + 1}</span>
                  <span className="badge-blue">{q.question_type}</span>
                  <span className="badge-slate">{q.difficulty}</span>
                  <span className="text-xs text-slate-500">{q.marks} marks</span>
                </div>
                <p className="text-sm text-navy-800 mb-2">{q.question_text}</p>
                {q.options && (
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(q.options).map(([k, v]) => (
                      <div key={k} className={`text-xs px-3 py-2 rounded-lg ${k === q.correct_answer ? "bg-emerald-50 text-emerald-700 font-medium border border-emerald-200" : "bg-slate-50 text-slate-600"}`}>
                        <span className="font-semibold">{k}.</span> {v}
                      </div>
                    ))}
                  </div>
                )}
                {q.question_type !== "mcq" && (
                  <div className="mt-2 text-xs bg-emerald-50 text-emerald-700 px-3 py-2 rounded-lg">
                    <span className="font-semibold">Answer:</span> {q.correct_answer}
                  </div>
                )}
                {q.explanation && (
                  <p className="mt-2 text-xs text-slate-500 italic">💡 {q.explanation}</p>
                )}
              </div>
              <div className="flex gap-1 ml-4">
                <button onClick={() => editQuestion(q)} className="p-2 hover:bg-slate-100 rounded-lg">
                  <Pencil size={15} className="text-slate-500" />
                </button>
                <button onClick={() => deleteQ(q.id)} className="p-2 hover:bg-red-50 rounded-lg">
                  <Trash2 size={15} className="text-red-500" />
                </button>
              </div>
            </div>
          </div>
        ))}
        {questions.length === 0 && (
          <div className="card p-16 text-center">
            <Sparkles size={40} className="mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-semibold text-navy-800 text-navy-800 mb-1">No questions yet</h3>
            <p className="text-sm text-slate-500">Add manually or generate with AI.</p>
          </div>
        )}
      </div>

      {/* Add/Edit modal */}
      <Modal open={showAdd} onClose={() => { setShowAdd(false); setEditQ(null); }} title={editQ ? "Edit Question" : "Add Question"} size="lg">
        <form onSubmit={saveQuestion} className="space-y-4">
          <div>
            <label className="label">Question</label>
            <textarea className="input min-h-[80px]" value={form.question_text} onChange={(e) => setForm({ ...form, question_text: e.target.value })} required />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label">Type</label>
              <select className="input" value={form.question_type} onChange={(e) => setForm({ ...form, question_type: e.target.value })}>
                <option value="mcq">MCQ</option>
                <option value="short_answer">Short Answer</option>
                <option value="descriptive">Descriptive</option>
              </select>
            </div>
            <div>
              <label className="label">Difficulty</label>
              <select className="input" value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })}>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <div>
              <label className="label">Marks</label>
              <input className="input" type="number" step="0.5" value={form.marks} onChange={(e) => setForm({ ...form, marks: e.target.value })} />
            </div>
          </div>
          {form.question_type === "mcq" && (
            <div className="grid grid-cols-2 gap-4">
              {["A", "B", "C", "D"].map((k) => (
                <div key={k} className="relative">
                  <label className="label flex items-center gap-2 mb-1 cursor-pointer w-max">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                      checked={form.correct_answer.split(',').includes(k)}
                      onChange={(e) => {
                        let current = form.correct_answer ? form.correct_answer.split(',') : [];
                        if (e.target.checked) {
                            if (!current.includes(k)) current.push(k);
                        } else {
                            current = current.filter(ans => ans !== k);
                        }
                        setForm({ ...form, correct_answer: current.sort().join(',') });
                      }}
                    />
                    Option {k} {form.correct_answer.split(',').includes(k) && <span className="text-[10px] text-emerald-600 font-bold">(Correct)</span>}
                  </label>
                  <input className={`input ${form.correct_answer.split(',').includes(k) ? 'border-emerald-300 bg-emerald-50/30' : ''}`} value={form[`opt${k}`]} onChange={(e) => setForm({ ...form, [`opt${k}`]: e.target.value })} required />
                </div>
              ))}
            </div>
          )}
          {form.question_type !== "mcq" && (
            <div>
              <label className="label">Correct Answer / Model Answer</label>
              <textarea className="input min-h-[60px]" value={form.correct_answer} onChange={(e) => setForm({ ...form, correct_answer: e.target.value })} required />
            </div>
          )}
          <div>
            <label className="label">Explanation (optional)</label>
            <textarea className="input min-h-[60px]" value={form.explanation} onChange={(e) => setForm({ ...form, explanation: e.target.value })} />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" className="btn-outline" onClick={() => { setShowAdd(false); setEditQ(null); }}>Cancel</button>
            {!editQ && (
              <button type="button" className="btn-outline text-blue-600 border-blue-200 hover:bg-blue-50" onClick={(e) => saveQuestion(e, true)}>Save & Add Another</button>
            )}
            <button type="button" className="btn-primary" onClick={(e) => saveQuestion(e, false)}>{editQ ? "Update" : "Add Question"}</button>
          </div>
        </form>
      </Modal>

      {/* AI Generate modal */}
      {(() => {
        const totalGenMarks = genConfigs.reduce((acc, c) => acc + (parseFloat(c.num_questions || 0) * parseFloat(c.marks || 0)), 0);
        const remainingMarks = (exam?.total_marks || 0) - currentTotalMarks - totalGenMarks;
        
        return (
          <Modal open={showGen} onClose={() => setShowGen(false)} title="Generate Questions with AI">
            <form onSubmit={generateAI} className="space-y-4">
              <div className="card p-4 bg-blue-50 border-blue-200">
                <p className="text-sm text-blue-700">
                  AI will use your uploaded course content to generate relevant questions. Queue multiple question types below!
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="label mb-0">Configuration Queue</label>
                  <div className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${remainingMarks < 0 ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                    {remainingMarks < 0 ? `Over Limit: ${Math.abs(remainingMarks)} pts` : `Remaining: ${remainingMarks} pts`}
                  </div>
                </div>
                {genConfigs.map((config, index) => (
                  <div key={config.id} className="flex gap-3 items-center">
                    <div className="flex-1 grid grid-cols-3 gap-3">
                      <div className="relative">
                          <input type="number" min="1" className="input pr-12" placeholder="Count" value={config.num_questions} onChange={(e) => { const newC = [...genConfigs]; newC[index].num_questions = e.target.value; setGenConfigs(newC); }} />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">QTY</span>
                      </div>
                      <select className="input" value={config.question_type} onChange={(e) => { const newC = [...genConfigs]; newC[index].question_type = e.target.value; setGenConfigs(newC); }}>
                        <option value="mcq">MCQ</option>
                        <option value="short_answer">Short Answer</option>
                        <option value="descriptive">Descriptive</option>
                      </select>
                      <div className="relative">
                         <input type="number" step="0.5" className="input pr-12" placeholder="Marks" value={config.marks} onChange={(e) => { const newC = [...genConfigs]; newC[index].marks = e.target.value; setGenConfigs(newC); }} />
                         <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">PTS</span>
                      </div>
                    </div>
                    {genConfigs.length > 1 && (
                      <button type="button" onClick={() => setGenConfigs(genConfigs.filter(c => c.id !== config.id))} className="w-11 h-11 shrink-0 bg-red-50 text-red-500 rounded-xl flex items-center justify-center hover:bg-red-100 transition-colors">
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
                <button type="button" onClick={() => setGenConfigs([...genConfigs, { id: Date.now(), num_questions: 1, question_type: "short_answer", marks: 3 }])} className="text-xs font-bold text-blue-600 flex items-center gap-1.5 hover:text-blue-800 transition-colors mt-1 px-1">
                  <Plus size={14} /> ADD ANOTHER TYPE
                </button>
              </div>
              <div>
                <label className="label">Difficulty</label>
                <select className="input" value={genForm.difficulty} onChange={(e) => setGenForm({ ...genForm, difficulty: e.target.value })}>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                  <option value="mixed">Mixed</option>
                </select>
              </div>
              <div>
                <label className="label">Topic Focus (optional)</label>
                <input className="input" placeholder="e.g. Binary Trees, Sorting Algorithms" value={genForm.topic} onChange={(e) => setGenForm({ ...genForm, topic: e.target.value })} />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <div className="mr-auto text-[10px] font-bold text-slate-400 uppercase tracking-widest pt-2">
                  Total for this batch: {totalGenMarks} pts
                </div>
                <button type="button" className="btn-outline" onClick={() => setShowGen(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={genBusy || remainingMarks < 0}>
                  {genBusy ? <><Loader2 size={16} className="animate-spin" /> Generating...</> : <><Sparkles size={16} /> Generate</>}
                </button>
              </div>
            </form>
          </Modal>
        );
      })()}
    </div>
  );
}


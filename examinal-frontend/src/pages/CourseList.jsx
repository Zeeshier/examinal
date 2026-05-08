import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import API from "../api/axios";
import Header from "../components/Header";
import Modal from "../components/Modal";
import LoadingSpinner from "../components/LoadingSpinner";
import { Plus, ArrowRight, BookOpen, Trash2, Pencil } from "lucide-react";
import toast from "react-hot-toast";

export default function CourseList() {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: "", code: "", description: "" });
  const [busy, setBusy] = useState(false);

  const load = async () => { try { const { data } = await API.get("/api/courses/"); setCourses(data); } catch {} setLoading(false); };
  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault(); setBusy(true);
    try {
      if (editing) {
        await API.patch(`/api/courses/${editing.id}`, form);
        toast.success("Course updated");
      } else {
        await API.post("/api/courses/", form);
        toast.success("Course created");
      }
      setShowCreate(false);
      setEditing(null);
      setForm({ title: "", code: "", description: "" });
      load();
    }
    catch (err) { toast.error(err.response?.data?.detail || "Failed"); } setBusy(false);
  };

  const handleEdit = (course) => {
    setEditing(course);
    setForm({ title: course.title, code: course.code, description: course.description || "" });
    setShowCreate(true);
  };

  const del = async (id) => { if (!confirm("Delete?")) return; try { await API.delete(`/api/courses/${id}`); toast.success("Deleted"); load(); } catch { toast.error("Failed"); } };

  if (loading) return <LoadingSpinner />;
  const isInstructor = user.role === "instructor";
  const isAdmin = user.role === "admin";
  const canManage = isInstructor;

  return (
    <div>
      <Header title="Courses" subtitle={user.role === "student" ? "Your enrolled courses" : "Manage your courses"}
        actions={canManage && <button className="btn-primary" onClick={() => { setEditing(null); setForm({ title: "", code: "", description: "" }); setShowCreate(true); }}><Plus size={18} /> New Course</button>} />

      {!courses.length ? (
        <div className="card p-20 text-center">
          <BookOpen size={44} className="mx-auto text-slate-300 mb-4" />
          <h3 className="text-lg font-semibold text-navy-800 mb-1">No courses yet</h3>
          <p className="text-sm text-slate-400">{isInstructor ? "Create your first course." : "You haven't been enrolled."}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {courses.map((c) => (
            <div key={c.id} className="card p-6 hover:shadow-md transition-all duration-200 group">
              <div className="flex items-start justify-between mb-4">
                <div className="w-11 h-11 bg-blue-50 rounded-xl flex items-center justify-center"><BookOpen size={20} className="text-blue-600" /></div>
                <div className="flex gap-1">
                  {(isInstructor || isAdmin) && (
                    <>
                      <button onClick={() => handleEdit(c)} className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-slate-50 rounded-lg transition-all"><Pencil size={15} className="text-slate-500" /></button>
                      <button onClick={() => del(c.id)} className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={15} className="text-red-500" /></button>
                    </>
                  )}
                </div>
              </div>
              <h3 className="font-semibold text-navy-800 mb-1">{c.title}</h3>
              <p className="text-xs text-slate-400 mb-2 font-mono">{c.code}</p>
              {c.description && <p className="text-sm text-slate-500 mb-4 line-clamp-2">{c.description}</p>}
              <Link to={`/courses/${c.id}`} className="text-sm text-blue-600 font-medium hover:underline inline-flex items-center gap-1">Open <ArrowRight size={14} /></Link>
            </div>
          ))}
        </div>
      )}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title={editing ? "Edit Course" : "Create Course"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="label">Title</label><input className="input" placeholder="e.g. Data Structures" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
          <div><label className="label">Code</label><input className="input" placeholder="e.g. CS201" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required /></div>
          <div><label className="label">Description</label><textarea className="input min-h-[80px]" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <div className="flex justify-end gap-3 pt-4 border-t"><button type="button" className="btn-outline" onClick={() => setShowCreate(false)}>Cancel</button><button type="submit" className="btn-primary" disabled={busy}>{busy ? (editing ? "Updating..." : "Creating...") : (editing ? "Update" : "Create")}</button></div>
        </form>
      </Modal>
    </div>
  );
}


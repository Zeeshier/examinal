import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import API from "../api/axios";
import Header from "../components/Header";
import LoadingSpinner from "../components/LoadingSpinner";
import { Upload, FileText, Trash2, Database, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

const statusBadge = {
  uploaded: "badge-slate",
  processing: "badge-amber",
  indexed: "badge-emerald",
  failed: "badge-red",
};

export default function ContentManager() {
  const { courseId } = useParams();
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [ingesting, setIngesting] = useState({});

  const load = async () => {
    try {
      const { data } = await API.get(`/api/content/documents/${courseId}`);
      setDocs(data);
    } catch { /* */ }
    setLoading(false);
  };

  useEffect(() => { load(); }, [courseId]);

  const upload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    setUploading(true);
    try {
      await API.post(`/api/content/upload/${courseId}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("File uploaded");
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Upload failed");
    }
    setUploading(false);
    e.target.value = "";
  };

  const ingest = async (docId) => {
    setIngesting((prev) => ({ ...prev, [docId]: true }));
    try {
      const { data } = await API.post(`/api/content/ingest/${docId}`);
      toast.success(`Indexed ${data.passages_created} passages`);
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Ingestion failed");
    }
    setIngesting((prev) => ({ ...prev, [docId]: false }));
  };

  const deleteDoc = async (docId) => {
    if (!confirm("Delete this document and all its passages?")) return;
    try {
      await API.delete(`/api/content/documents/${docId}`);
      toast.success("Document deleted");
      load();
    } catch { toast.error("Failed"); }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <Header
        title="Course Content"
        subtitle="Upload and index course materials for AI question generation"
        actions={
          <label className={`btn-primary cursor-pointer ${uploading ? "opacity-50 pointer-events-none" : ""}`}>
            <Upload size={16} />
            {uploading ? "Uploading..." : "Upload File"}
            <input type="file" accept=".pdf,.docx,.pptx" onChange={upload} className="hidden" />
          </label>
        }
      />

      <div className="card p-4 mb-6 bg-blue-50 border-blue-200">
        <p className="text-sm text-blue-700">
          <strong>Supported formats:</strong> PDF, DOCX, PPTX · Upload your course materials, then click "Index" to process them for AI question generation.
        </p>
      </div>

      {docs.length === 0 ? (
        <div className="card p-16 text-center">
          <FileText size={40} className="mx-auto text-slate-300 mb-4" />
          <h3 className="text-lg font-semibold text-navy-800 text-navy-800 mb-1">No documents yet</h3>
          <p className="text-sm text-slate-500">Upload course files to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {docs.map((d) => (
            <div key={d.id} className="card p-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 bg-slate-100 rounded-xl flex items-center justify-center">
                  <FileText size={20} className="text-slate-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-navy-800">{d.original_filename}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {d.file_type.toUpperCase()} · {(d.file_size / 1024).toFixed(0)} KB
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={statusBadge[d.upload_status]}>{d.upload_status}</span>
                {d.upload_status === "uploaded" && (
                  <button
                    onClick={() => ingest(d.id)}
                    disabled={ingesting[d.id]}
                    className="btn-primary text-xs px-3 py-1.5"
                  >
                    {ingesting[d.id] ? (
                      <><Loader2 size={14} className="animate-spin" /> Processing...</>
                    ) : (
                      <><Database size={14} /> Index</>
                    )}
                  </button>
                )}
                {d.upload_status === "failed" && (
                  <button onClick={() => ingest(d.id)} disabled={ingesting[d.id]} className="btn-outline text-xs px-3 py-1.5">
                    Retry
                  </button>
                )}
                <button onClick={() => deleteDoc(d.id)} className="p-2 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 size={15} className="text-red-500" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

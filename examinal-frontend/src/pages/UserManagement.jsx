import { useEffect, useState } from "react";
import API from "../api/axios";
import Header from "../components/Header";
import Modal from "../components/Modal";
import LoadingSpinner from "../components/LoadingSpinner";
import { Users, Plus, Pencil, Trash2, Search, Shield, BookOpen, GraduationCap } from "lucide-react";
import toast from "react-hot-toast";

const roleBadge = {
  admin: "badge-red",
  instructor: "badge-blue",
  student: "badge-emerald",
};
const roleIcon = {
  admin: Shield,
  instructor: BookOpen,
  student: GraduationCap,
};

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [editUser, setEditUser] = useState(null);
  const [editForm, setEditForm] = useState({});

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (roleFilter) params.role = roleFilter;
      const { data } = await API.get("/api/users/", { params });
      setUsers(data);
    } catch (err) {
      toast.error("Failed to load users");
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [roleFilter]);

  const filtered = users.filter(
    (u) =>
      u.full_name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.username.toLowerCase().includes(search.toLowerCase())
  );

  const handleEdit = (u) => {
    setEditUser(u);
    setEditForm({ full_name: u.full_name, email: u.email, role: u.role, is_active: u.is_active });
  };

  const saveEdit = async () => {
    try {
      await API.patch(`/api/users/${editUser.id}`, editForm);
      toast.success("User updated");
      setEditUser(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Update failed");
    }
  };

  const deleteUser = async (id) => {
    if (!confirm("Delete this user? This cannot be undone.")) return;
    try {
      await API.delete(`/api/users/${id}`);
      toast.success("User deleted");
      load();
    } catch (err) {
      toast.error("Delete failed");
    }
  };

  return (
    <div>
      <Header title="User Management" subtitle="Manage all platform users" />

      {/* Filters */}
      <div className="card p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              className="input pl-10"
              placeholder="Search by name, email or username..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select className="input w-auto min-w-[160px]" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="instructor">Instructor</option>
            <option value="student">Student</option>
          </select>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-slate-50">
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">User</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Email</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Role</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="text-right px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((u) => {
                const Icon = roleIcon[u.role] || Users;
                return (
                  <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-slate-200 rounded-xl flex items-center justify-center text-sm font-semibold text-slate-600">
                          {u.full_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-navy-800">{u.full_name}</p>
                          <p className="text-xs text-slate-500">@{u.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{u.email}</td>
                    <td className="px-6 py-4">
                      <span className={roleBadge[u.role]}>{u.role}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={u.is_active ? "badge-emerald" : "badge-red"}>
                        {u.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => handleEdit(u)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                          <Pencil size={15} className="text-slate-500" />
                        </button>
                        <button onClick={() => deleteUser(u.id)} className="p-2 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 size={15} className="text-red-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <p className="text-center py-12 text-sm text-slate-400">No users found</p>
          )}
        </div>
      )}

      {/* Edit modal */}
      <Modal open={!!editUser} onClose={() => setEditUser(null)} title="Edit User">
        <div className="space-y-4">
          <div>
            <label className="label">Full Name</label>
            <input className="input" value={editForm.full_name || ""} onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })} />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input" value={editForm.email || ""} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
          </div>
          <div>
            <label className="label">Role</label>
            <select className="input" value={editForm.role || ""} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}>
              <option value="admin">Admin</option>
              <option value="instructor">Instructor</option>
              <option value="student">Student</option>
            </select>
          </div>
          <div className="flex items-center gap-3">
            <label className="label mb-0">Active</label>
            <button
              type="button"
              onClick={() => setEditForm({ ...editForm, is_active: !editForm.is_active })}
              className={`w-11 h-6 rounded-full transition-colors ${editForm.is_active ? "bg-blue-600" : "bg-slate-300"}`}
            >
              <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${editForm.is_active ? "translate-x-5" : "translate-x-0.5"}`} />
            </button>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button className="btn-outline" onClick={() => setEditUser(null)}>Cancel</button>
            <button className="btn-primary" onClick={saveEdit}>Save Changes</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

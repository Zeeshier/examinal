import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Eye, EyeOff, Lock, Shield, Check, X } from "lucide-react";
import toast from "react-hot-toast";

function getStrength(password) {
  if (!password) return { score: 0, label: "", color: "" };
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;
  if (score <= 2) return { score: 1, label: "Weak", color: "bg-red-500" };
  if (score <= 4) return { score: 2, label: "Medium", color: "bg-yellow-500" };
  return { score: 3, label: "Strong", color: "bg-emerald-500" };
}

export default function ChangePassword() {
  const { changePassword } = useAuth();
  const navigate = useNavigate();
  const [show, setShow] = useState({ current: false, new: false });
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ current: "", newPass: "", confirm: "" });
  const strength = useMemo(() => getStrength(form.newPass), [form.newPass]);

  const checks = [
    { test: form.newPass.length >= 8, label: "8+ chars" },
    { test: /[A-Z]/.test(form.newPass), label: "Uppercase" },
    { test: /[a-z]/.test(form.newPass), label: "Lowercase" },
    { test: /[0-9]/.test(form.newPass), label: "Number" },
    { test: /[^a-zA-Z0-9]/.test(form.newPass), label: "Special" },
  ];
  const allChecks = checks.every((c) => c.test);
  const matches = form.newPass && form.confirm && form.newPass === form.confirm;

  const handle = async (e) => {
    e.preventDefault();
    if (!form.current) return toast.error("Please enter your current password.");
    if (!allChecks) return toast.error("New password does not meet requirements.");
    if (!matches) return toast.error("Passwords do not match.");
    if (form.current === form.newPass) return toast.error("New password must differ from current.");
    setBusy(true);
    try {
      await changePassword(form.current, form.newPass);
      toast.success("Password changed! Please sign in again.");
      navigate("/login");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to change password.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-8 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-blue-600/10 border border-blue-200 flex items-center justify-center">
          <Shield size={22} className="text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Change Password</h1>
          <p className="text-slate-500 text-sm">Updating your password will sign you out of all other sessions.</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm space-y-5">
        <form onSubmit={handle} className="space-y-5">
          {/* Current Password */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Current Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type={show.current ? "text" : "password"}
                value={form.current}
                onChange={(e) => setForm({ ...form, current: e.target.value })}
                placeholder="Your current password"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-11 pr-12 py-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400/20 transition-all"
              />
              <button type="button" onClick={() => setShow({ ...show, current: !show.current })} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-500 transition-colors">
                {show.current ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">New Password</label>
            <div className="relative">
              <input
                type={show.new ? "text" : "password"}
                value={form.newPass}
                onChange={(e) => setForm({ ...form, newPass: e.target.value })}
                placeholder="Min 8 chars, A-z, 0-9, !@#"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 pr-12 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400/20 transition-all"
              />
              <button type="button" onClick={() => setShow({ ...show, new: !show.new })} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-500 transition-colors">
                {show.new ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {form.newPass && (
              <div className="mt-2 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-500 ${strength.color}`} style={{ width: `${(strength.score / 3) * 100}%` }} />
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${
                    strength.score === 1 ? "text-red-500" : strength.score === 2 ? "text-yellow-600" : "text-emerald-600"
                  }`}>{strength.label}</span>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  {checks.map((c) => (
                    <span key={c.label} className={`flex items-center gap-1 text-[10px] font-medium ${c.test ? "text-emerald-600" : "text-slate-400"}`}>
                      {c.test ? <Check size={10} /> : <X size={10} />} {c.label}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Confirm New Password</label>
            <input
              type={show.new ? "text" : "password"}
              value={form.confirm}
              onChange={(e) => setForm({ ...form, confirm: e.target.value })}
              placeholder="Re-enter new password"
              className={`w-full bg-slate-50 border rounded-2xl px-5 py-3 text-slate-800 placeholder-slate-400 focus:outline-none transition-all ${
                form.confirm ? (matches ? "border-emerald-400 focus:ring-1 focus:ring-emerald-400/20" : "border-red-300 focus:ring-1 focus:ring-red-300/20") : "border-slate-200 focus:border-blue-400 focus:ring-1 focus:ring-blue-400/20"
              }`}
            />
            {form.confirm && !matches && (
              <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
            )}
          </div>

          {/* Warning Banner */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 flex gap-3 items-start">
            <Shield size={16} className="text-amber-500 mt-0.5 shrink-0" />
            <p className="text-amber-700 text-xs leading-relaxed">
              Changing your password will immediately sign you out of all other devices and sessions.
            </p>
          </div>

          <button
            type="submit"
            disabled={busy || !form.current || !allChecks || !matches}
            className="w-full py-3.5 bg-blue-600 text-white rounded-2xl font-black text-sm uppercase tracking-[0.2em] hover:bg-blue-500 active:scale-[0.98] transition-all shadow-lg shadow-blue-600/20 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {busy ? "Updating..." : "Update Password"}
          </button>
        </form>
      </div>
    </div>
  );
}

import { useState, useMemo } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Eye, EyeOff, Lock, Check, X } from "lucide-react";
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

export default function ResetPassword() {
  const { resetPassword } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ password: "", confirm: "" });
  const strength = useMemo(() => getStrength(form.password), [form.password]);

  const checks = [
    { test: form.password.length >= 8, label: "8+ chars" },
    { test: /[A-Z]/.test(form.password), label: "Uppercase" },
    { test: /[a-z]/.test(form.password), label: "Lowercase" },
    { test: /[0-9]/.test(form.password), label: "Number" },
    { test: /[^a-zA-Z0-9]/.test(form.password), label: "Special" },
  ];
  const allChecks = checks.every((c) => c.test);
  const matches = form.password && form.confirm && form.password === form.confirm;

  const handle = async (e) => {
    e.preventDefault();
    if (!token) return toast.error("Invalid or missing reset token.");
    if (!allChecks) return toast.error("Password does not meet requirements.");
    if (!matches) return toast.error("Passwords do not match.");
    setBusy(true);
    try {
      await resetPassword(token, form.password);
      toast.success("Password reset! Please sign in with your new password.");
      navigate("/login");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Reset failed. The link may have expired.");
    } finally {
      setBusy(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 px-4">
        <div className="bg-white/5 border border-white/10 rounded-3xl p-10 text-center max-w-sm w-full">
          <p className="text-red-400 text-lg font-semibold mb-4">Invalid Reset Link</p>
          <p className="text-slate-400 text-sm mb-6">This link is missing a reset token. Please request a new one.</p>
          <Link to="/forgot-password" className="text-blue-400 hover:underline text-sm">Request new link →</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-10 shadow-2xl">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
              <span className="text-white font-black text-sm">E</span>
            </div>
            <span className="text-white font-black tracking-wider uppercase text-sm">Examinal</span>
          </div>

          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
              <Lock size={22} className="text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Set New Password</h1>
              <p className="text-slate-400 text-xs mt-0.5">Choose a strong, unique password</p>
            </div>
          </div>

          <form onSubmit={handle} className="space-y-5">
            {/* New Password */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">New Password</label>
              <div className="relative">
                <input
                  type={show ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Min 8 chars, A-z, 0-9, !@#"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 pr-14 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all"
                />
                <button type="button" onClick={() => setShow(!show)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-400 transition-colors">
                  {show ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {form.password && (
                <div className="mt-2 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-500 ${strength.color}`} style={{ width: `${(strength.score / 3) * 100}%` }} />
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${
                      strength.score === 1 ? "text-red-400" : strength.score === 2 ? "text-yellow-400" : "text-emerald-400"
                    }`}>{strength.label}</span>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                    {checks.map((c) => (
                      <span key={c.label} className={`flex items-center gap-1 text-[10px] font-medium ${c.test ? "text-emerald-400" : "text-slate-500"}`}>
                        {c.test ? <Check size={10} /> : <X size={10} />} {c.label}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Confirm Password</label>
              <input
                type={show ? "text" : "password"}
                value={form.confirm}
                onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                placeholder="Re-enter your new password"
                className={`w-full bg-white/5 border rounded-2xl px-5 py-3.5 text-white placeholder-slate-500 focus:outline-none transition-all ${
                  form.confirm ? (matches ? "border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20" : "border-red-500/50 focus:ring-1 focus:ring-red-500/20") : "border-white/10 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30"
                }`}
              />
              {form.confirm && !matches && (
                <p className="text-xs text-red-400 mt-1">Passwords do not match</p>
              )}
            </div>

            <button
              type="submit"
              disabled={busy || !allChecks || !matches}
              className="w-full py-3.5 bg-blue-600 text-white rounded-2xl font-black text-sm uppercase tracking-[0.2em] hover:bg-blue-500 active:scale-[0.98] transition-all shadow-xl shadow-blue-600/30 disabled:opacity-40 disabled:cursor-not-allowed mt-2"
            >
              {busy ? "Resetting..." : "Reset Password"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link to="/login" className="text-slate-400 hover:text-blue-400 text-sm transition-colors">
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

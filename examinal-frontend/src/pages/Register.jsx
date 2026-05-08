import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { UserPlus, Eye, EyeOff, Check, X, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";

// ── Validation helpers ──
const validators = {
  full_name: (v) => {
    if (!v || !v.trim()) return "Full name is required";
    if (v.trim().length < 2) return "Name must be at least 2 characters";
    if (v.trim().length > 255) return "Name is too long";
    return "";
  },
  email: (v) => {
    if (!v || !v.trim()) return "Email is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())) return "Enter a valid email address";
    return "";
  },
  username: (v) => {
    if (!v || !v.trim()) return "Username is required";
    if (v.trim().length < 3) return "Username must be at least 3 characters";
    if (v.trim().length > 100) return "Username is too long";
    if (!/^[a-zA-Z0-9_]+$/.test(v.trim())) return "Only letters, numbers, and underscores";
    return "";
  },
  password: (v) => {
    if (!v) return "Password is required";
    if (v.length < 8) return "Password must be at least 8 characters";
    if (!/[A-Z]/.test(v)) return "Must contain an uppercase letter";
    if (!/[a-z]/.test(v)) return "Must contain a lowercase letter";
    if (!/[0-9]/.test(v)) return "Must contain a number";
    if (!/[^a-zA-Z0-9]/.test(v)) return "Must contain a special character (!@#$...)";
    return "";
  },
  confirmPassword: (v, password) => {
    if (!v) return "Please confirm your password";
    if (v !== password) return "Passwords do not match";
    return "";
  },
};

function getPasswordStrength(password) {
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

function FieldError({ error }) {
  if (!error) return null;
  return (
    <p className="flex items-center gap-1 text-xs text-red-500 mt-1.5 ml-1">
      <AlertCircle size={12} />
      {error}
    </p>
  );
}

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ email: "", username: "", password: "", confirmPassword: "", full_name: "", role: "student" });
  const [touched, setTouched] = useState({});
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const blur = (k) => () => setTouched({ ...touched, [k]: true });

  // ── Live validation ──
  const errors = useMemo(() => ({
    full_name: validators.full_name(form.full_name),
    email: validators.email(form.email),
    username: validators.username(form.username),
    password: validators.password(form.password),
    confirmPassword: validators.confirmPassword(form.confirmPassword, form.password),
  }), [form]);

  const strength = useMemo(() => getPasswordStrength(form.password), [form.password]);
  const isValid = Object.values(errors).every((e) => e === "");

  const handle = async (e) => {
    e.preventDefault();
    // Mark all as touched
    setTouched({ full_name: true, email: true, username: true, password: true, confirmPassword: true });
    if (!isValid) {
      toast.error("Please fix the errors before submitting.");
      return;
    }
    setBusy(true);
    try {
      const { confirmPassword, ...payload } = form;
      await register(payload);
      toast.success("Account created! Sign in to continue.");
      navigate("/login");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Registration failed");
    } finally {
      setBusy(false);
    }
  };

  const inputBase = "w-full bg-white border rounded-2xl px-6 py-2.5 text-navy-900 placeholder-slate-400 focus:outline-none focus:ring-1 transition-all font-light shadow-sm shadow-blue-900/5";
  const inputOk = "border-slate-200 focus:border-blue-400 focus:bg-blue-50/50 focus:ring-blue-400/20";
  const inputErr = "border-red-300 focus:border-red-400 focus:bg-red-50/30 focus:ring-red-400/20";

  const inputClass = (field) =>
    `${inputBase} ${touched[field] && errors[field] ? inputErr : inputOk}`;

  return (
    <div className="">
      <div className="mb-8 text-center lg:text-left">
        <h2 className="text-4xl font-medium text-navy-950 mb-3 tracking-tight uppercase">Initialize</h2>
        <p className="text-slate-600 font-light text-lg">Create your institutional node.</p>
      </div>

      <form onSubmit={handle} className="space-y-5" noValidate>
        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-1">Full Name</label>
          <input 
            className={inputClass("full_name")}
            placeholder="John Doe" 
            value={form.full_name} 
            onChange={set("full_name")}
            onBlur={blur("full_name")}
          />
          {touched.full_name && <FieldError error={errors.full_name} />}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-1">Email Node</label>
            <input 
              className={inputClass("email")}
              type="email" 
              placeholder="john@example.com" 
              value={form.email} 
              onChange={set("email")}
              onBlur={blur("email")}
            />
            {touched.email && <FieldError error={errors.email} />}
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-1">Username</label>
            <input 
              className={inputClass("username")}
              placeholder="johndoe" 
              value={form.username} 
              onChange={set("username")}
              onBlur={blur("username")}
            />
            {touched.username && <FieldError error={errors.username} />}
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-1">Security Key</label>
          <div className="relative">
            <input 
              className={`${inputClass("password")} pr-14`}
              type={show ? "text" : "password"} 
              placeholder="Min 8 chars, A-z, 0-9, !@#" 
              value={form.password} 
              onChange={set("password")}
              onBlur={blur("password")}
            />
            <button 
              type="button" 
              onClick={() => setShow(!show)} 
              className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-blue-600 transition-colors p-1"
            >
              {show ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          {touched.password && <FieldError error={errors.password} />}

          {/* Password Strength Indicator */}
          {form.password && (
            <div className="mt-2 ml-1">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${strength.color}`}
                    style={{ width: `${(strength.score / 3) * 100}%` }}
                  />
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-wider ${
                  strength.score === 1 ? "text-red-500" : strength.score === 2 ? "text-yellow-600" : "text-emerald-600"
                }`}>
                  {strength.label}
                </span>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                {[
                  { test: form.password.length >= 8, label: "8+ chars" },
                  { test: /[A-Z]/.test(form.password), label: "Uppercase" },
                  { test: /[a-z]/.test(form.password), label: "Lowercase" },
                  { test: /[0-9]/.test(form.password), label: "Number" },
                  { test: /[^a-zA-Z0-9]/.test(form.password), label: "Special" },
                ].map((r) => (
                  <span key={r.label} className={`flex items-center gap-1 text-[10px] font-medium ${r.test ? "text-emerald-600" : "text-slate-400"}`}>
                    {r.test ? <Check size={10} /> : <X size={10} />}
                    {r.label}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Confirm Password */}
        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-1">Confirm Security Key</label>
          <input 
            className={inputClass("confirmPassword")}
            type={show ? "text" : "password"} 
            placeholder="Re-enter your password" 
            value={form.confirmPassword} 
            onChange={set("confirmPassword")}
            onBlur={blur("confirmPassword")}
          />
          {touched.confirmPassword && <FieldError error={errors.confirmPassword} />}
        </div>

        <div className="space-y-3">
          <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-1">Access Level</label>
          <div className="grid grid-cols-2 gap-4">
            {["student", "instructor"].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setForm({ ...form, role: r })}
                className={`h-12 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                  form.role === r
                    ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-600/20"
                    : "bg-white border-slate-200 text-slate-500 hover:border-blue-300 hover:text-blue-600"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <button 
          type="submit" 
          disabled={busy} 
          className="w-full h-14 bg-blue-600 text-white rounded-2xl font-black text-sm uppercase tracking-[0.2em] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-4 shadow-xl shadow-blue-600/20 hover:shadow-blue-600/30 disabled:opacity-50 disabled:cursor-not-allowed group mt-4"
        >
          {busy ? (
            "CREATING..." 
          ) : (
            <>
              INITIALIZE ACCOUNT <UserPlus size={20} className="group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </button>
      </form>

      <div className="mt-10 pt-6 border-t border-slate-200 text-center">
        <p className="text-sm text-slate-600 font-light">
          Already a member?{" "}
          <Link to="/login" className="text-blue-600 font-black hover:text-blue-700 transition-colors underline underline-offset-8 decoration-blue-600/20 hover:decoration-blue-700/50 uppercase tracking-wider text-[11px]">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}

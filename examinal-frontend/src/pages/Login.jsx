import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { LogIn, Eye, EyeOff, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", password: "" });
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!form.username || !form.username.trim()) errs.username = "Username or email is required";
    if (!form.password) errs.password = "Password is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handle = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setBusy(true);
    try {
      await login(form.username.trim(), form.password);
      toast.success("Welcome back!");
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Invalid credentials");
    } finally {
      setBusy(false);
    }
  };

  const inputBase = "w-full bg-white border rounded-2xl px-6 py-3.5 text-navy-900 placeholder-slate-400 focus:outline-none focus:ring-1 transition-all font-light shadow-sm shadow-blue-900/5";
  const inputOk = "border-slate-200 focus:border-blue-400 focus:bg-blue-50/50 focus:ring-blue-400/20";
  const inputErr = "border-red-300 focus:border-red-400 focus:bg-red-50/30 focus:ring-red-400/20";

  return (
    <div className="">
      <div className="mb-10 text-center lg:text-left">
        <h2 className="text-4xl font-medium text-navy-950 mb-3 tracking-tight uppercase">Welcome back</h2>
        <p className="text-slate-600 font-light text-lg">Sign in to your node to continue.</p>
      </div>

      <form onSubmit={handle} className="space-y-6" noValidate>
        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-1">Username or Email</label>
          <input
            className={`${inputBase} ${errors.username ? inputErr : inputOk}`}
            placeholder="Enter your credentials..."
            value={form.username}
            onChange={(e) => { setForm({ ...form, username: e.target.value }); setErrors({ ...errors, username: "" }); }}
          />
          {errors.username && (
            <p className="flex items-center gap-1 text-xs text-red-500 mt-1.5 ml-1">
              <AlertCircle size={12} />
              {errors.username}
            </p>
          )}
        </div>
        
        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-1">Password</label>
          <div className="relative">
            <input
              className={`${inputBase} ${errors.password ? inputErr : inputOk} pr-14`}
              type={show ? "text" : "password"}
              placeholder="Enter your security key..."
              value={form.password}
              onChange={(e) => { setForm({ ...form, password: e.target.value }); setErrors({ ...errors, password: "" }); }}
            />
            <button 
              type="button" 
              onClick={() => setShow(!show)} 
              className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-blue-600 transition-colors p-1"
            >
              {show ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          {errors.password && (
            <p className="flex items-center gap-1 text-xs text-red-500 mt-1.5 ml-1">
              <AlertCircle size={12} />
              {errors.password}
            </p>
          )}
          <div className="flex justify-end mt-1">
            <Link to="/forgot-password" className="text-[11px] text-blue-500 hover:text-blue-700 font-semibold transition-colors">
              Forgot password?
            </Link>
          </div>
        </div>

        <button 
          type="submit" 
          disabled={busy} 
          className="w-full h-14 bg-blue-600 text-white rounded-2xl font-black text-sm uppercase tracking-[0.2em] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-4 shadow-xl shadow-blue-600/20 hover:shadow-blue-600/30 disabled:opacity-50 disabled:cursor-not-allowed group mt-8"
        >
          {busy ? (
            "SIGNING IN..." 
          ) : (
            <>
              SIGN IN <LogIn size={20} className="group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </button>
      </form>

      <div className="mt-12 pt-8 border-t border-slate-200 text-center">
        <p className="text-sm text-slate-600 font-light">
          Don't have an account?{" "}
          <Link to="/register" className="text-blue-600 font-black hover:text-blue-700 transition-colors underline underline-offset-8 decoration-blue-600/20 hover:decoration-blue-700/50">
            CREATE ACCOUNT
          </Link>
        </p>
      </div>
    </div>
  );
}

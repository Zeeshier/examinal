import { Link } from "react-router-dom";
import { Search, Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="w-24 h-24 bg-slate-50 border border-slate-100 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-sm">
          <Search size={40} className="text-slate-300" />
        </div>
        
        <h1 className="text-6xl font-black text-navy-900 mb-4 tracking-tighter">404</h1>
        <h2 className="text-2xl font-bold text-navy-800 mb-6">Page Not Found</h2>
        
        <p className="text-slate-500 mb-10 font-light leading-relaxed">
          The assessment node you are looking for does not exist or has been moved to another sector.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button 
            onClick={() => window.history.back()}
            className="btn-outline px-8 py-3 flex items-center justify-center gap-2"
          >
            <ArrowLeft size={18} /> Go Back
          </button>
          <Link 
            to="/dashboard"
            className="btn-primary px-8 py-3 flex items-center justify-center gap-2 shadow-xl shadow-blue-600/20"
          >
            <Home size={18} /> Home
          </Link>
        </div>
        
        <div className="mt-16 text-[10px] font-black uppercase tracking-[0.4em] text-slate-300">
          Neural Mesh System Layer 404
        </div>
      </div>
    </div>
  );
}

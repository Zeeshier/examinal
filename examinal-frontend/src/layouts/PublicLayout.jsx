import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function PublicLayout() {
  return (
    <div className="min-h-screen bg-white relative text-slate-900">
      <Navbar />
      <main className="pt-16 relative z-10">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

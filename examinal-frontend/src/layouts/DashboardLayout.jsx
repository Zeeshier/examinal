import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";

export default function DashboardLayout() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <main className="ml-[260px] p-8">
        <div className="max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

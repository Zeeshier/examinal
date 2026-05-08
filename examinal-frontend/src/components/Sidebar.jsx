import { NavLink, Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import API from "../api/axios";
import { useAuth } from "../context/AuthContext";
import {
  LayoutDashboard, BookOpen, FileText, Users,
  ClipboardList, Activity,
  Award, TrendingUp, LogOut, MessageSquare,
  Eye, ClipboardCheck, KeyRound
} from "lucide-react";

const linkClass = ({ isActive }) =>
  `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
    isActive
      ? "bg-blue-600 text-white shadow-sm shadow-blue-600/30"
      : "text-slate-400 hover:text-white hover:bg-white/5"
  }`;

export default function Sidebar() {
  const { user, logout } = useAuth();
  const [badges, setBadges] = useState({});
  const location = useLocation();

  useEffect(() => {
    if (user) {
      API.get("/api/users/me/sidebar-badges")
        .then((res) => setBadges(res.data))
        .catch(() => {});
    }
  }, [user, location.pathname]);

  const adminLinks = [
    { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/users", icon: Users, label: "Users" },
    { to: "/courses", icon: BookOpen, label: "Courses" },
    { to: "/exams", icon: FileText, label: "Exams" },
    { to: "/contact-messages", icon: MessageSquare, label: "Contacts", badgeKey: "contact-messages" },
    { to: "/messages", icon: MessageSquare, label: "Messages", badgeKey: "messages" },
    { to: "/activity-logs", icon: Activity, label: "Activity Logs" },
  ];

  const instructorLinks = [
    { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/courses", icon: BookOpen, label: "My Courses" },
    { to: "/exams", icon: FileText, label: "My Exams" },
    { to: "/enrollment-requests", icon: ClipboardCheck, label: "Requests", badgeKey: "enrollment-requests" },
    { to: "/messages", icon: MessageSquare, label: "Messages", badgeKey: "messages" },
  ];

  const studentLinks = [
    { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/browse-exams", icon: Eye, label: "Browse Exams" },
    { to: "/exams", icon: ClipboardList, label: "My Exams", badgeKey: "exams" },
    { to: "/my-results", icon: Award, label: "Results" },
    { to: "/messages", icon: MessageSquare, label: "Messages", badgeKey: "messages" },
    { to: "/performance", icon: TrendingUp, label: "Performance" },
  ];

  const links =
    user?.role === "admin" ? adminLinks :
    user?.role === "instructor" ? instructorLinks : studentLinks;

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-[260px] bg-navy-900 border-r border-white/5 flex flex-col z-40">
      {/* Logo */}
      <div className="px-6 py-8">
        <Link to="/home" className="inline-block group">
          <div className="bg-white/90 rounded-2xl px-5 py-2.5 backdrop-blur-md shadow-xl border border-white group-hover:scale-105 transition-all duration-500 flex items-center justify-center">
            <img src="/logo-transparent.png" alt="Examinal Logo" className="h-10 w-auto object-contain" />
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className="px-4 py-2 text-[10px] text-slate-600 uppercase tracking-widest font-semibold">Menu</p>
        {links.map((l) => (
          <NavLink key={l.to} to={l.to} end={l.to === "/dashboard"} className={linkClass}>
            {({ isActive }) => (
              <>
                <l.icon size={18} />
                <span className="flex-1 text-left">{l.label}</span>
                {!isActive && l.badgeKey && badges[l.badgeKey] > 0 && (
                  <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center shadow-sm shadow-red-500/40">
                    {badges[l.badgeKey] > 99 ? "99+" : badges[l.badgeKey]}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="px-4 py-4 border-t border-white/5">
        <div className="flex items-center gap-3 mb-3 px-2">
          <div className="w-9 h-9 bg-blue-600/20 rounded-xl flex items-center justify-center text-sm font-bold text-blue-400">
            {user?.full_name?.charAt(0)?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.full_name}</p>
            <p className="text-xs text-slate-500 capitalize">{user?.role}</p>
          </div>
        </div>
        <NavLink
          to="/change-password"
          className={({ isActive }) =>
            `flex items-center gap-2 w-full px-4 py-2 text-sm font-medium rounded-xl transition-all ${
              isActive
                ? "bg-blue-600/10 text-blue-400"
                : "text-slate-500 hover:text-blue-400 hover:bg-blue-500/10"
            }`
          }
        >
          <KeyRound size={16} />
          Change Password
        </NavLink>
        <button
          onClick={logout}
          className="flex items-center gap-2 w-full px-4 py-2 text-sm font-medium text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}

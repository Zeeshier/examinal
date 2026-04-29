import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicLayout from "./layouts/PublicLayout";
import AuthLayout from "./layouts/AuthLayout";
import DashboardLayout from "./layouts/DashboardLayout";

import Landing from "./pages/Landing";
import Features from "./pages/Features";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import UserManagement from "./pages/UserManagement";
import ContactMessages from "./pages/ContactMessages";
import ActivityLogs from "./pages/ActivityLogs";
import CourseList from "./pages/CourseList";
import CourseDetail from "./pages/CourseDetail";
import ContentManager from "./pages/ContentManager";
import ExamList from "./pages/ExamList";
import ExamBuilder from "./pages/ExamBuilder";
import ExamTaking from "./pages/ExamTaking";
import QuestionManager from "./pages/QuestionManager";
import GradingPanel from "./pages/GradingPanel";
import MyResults from "./pages/MyResults";
import ResultDetail from "./pages/ResultDetail";
import ExamAnalytics from "./pages/ExamAnalytics";
import StudentPerformance from "./pages/StudentPerformance";
import CourseAnalytics from "./pages/CourseAnalytics";
import Team from "./pages/Team";
import ExamBrowse from "./pages/ExamBrowse";
import EnrollmentRequests from "./pages/EnrollmentRequests";
import Messages from "./pages/Messages";
import NotFound from "./pages/NotFound";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-navy-900">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-[3px] border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-white/60 text-sm font-medium">Loading Examinal...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <ScrollToTop />
      <Routes>
      {/* Public pages */}
      <Route element={<PublicLayout />}>
        <Route path="/home" element={<Landing />} />
        <Route path="/features" element={<Features />} />
        <Route path="/about" element={<About />} />
        <Route path="/team" element={<Team />} />
        <Route path="/contact" element={<Contact />} />
      </Route>

      {/* Auth */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" />} />
        <Route path="/register" element={!user ? <Register /> : <Navigate to="/dashboard" />} />
      </Route>

      {/* Dashboard — all authenticated */}
      <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/courses" element={<CourseList />} />
        <Route path="/courses/:courseId" element={<CourseDetail />} />
        <Route path="/performance" element={<StudentPerformance />} />
        <Route path="/performance/:studentId" element={<StudentPerformance />} />
        <Route path="/messages" element={<Messages />} />
      </Route>

      {/* Admin only */}
      <Route element={<ProtectedRoute allowedRoles={["admin"]}><DashboardLayout /></ProtectedRoute>}>
        <Route path="/users" element={<UserManagement />} />
        <Route path="/contact-messages" element={<ContactMessages />} />
        <Route path="/activity-logs" element={<ActivityLogs />} />
      </Route>

      {/* Instructor + Admin */}
      <Route element={<ProtectedRoute allowedRoles={["admin", "instructor"]}><DashboardLayout /></ProtectedRoute>}>
        <Route path="/courses/:courseId/content" element={<ContentManager />} />
        <Route path="/courses/:courseId/analytics" element={<CourseAnalytics />} />
        <Route path="/exams/:examId/build" element={<ExamBuilder />} />
        <Route path="/exams/:examId/questions" element={<QuestionManager />} />
        <Route path="/exams/:examId/grading" element={<GradingPanel />} />
        <Route path="/exams/:examId/analytics" element={<ExamAnalytics />} />
        <Route path="/enrollment-requests" element={<EnrollmentRequests />} />
      </Route>

      {/* Student only */}
      <Route element={<ProtectedRoute allowedRoles={["student"]}><DashboardLayout /></ProtectedRoute>}>
        <Route path="/my-results" element={<MyResults />} />
        <Route path="/results/:submissionId" element={<ResultDetail />} />
        <Route path="/browse-exams" element={<ExamBrowse />} />
      </Route>

      {/* Shared routes for all roles */}
      <Route element={<ProtectedRoute allowedRoles={["admin", "instructor", "student"]}><DashboardLayout /></ProtectedRoute>}>
        <Route path="/exams" element={<ExamList />} />
      </Route>

      {/* Secure exam (no sidebar) */}
      <Route path="/exam/:examId/take" element={<ProtectedRoute><ExamTaking /></ProtectedRoute>} />

      {/* Redirects */}
      <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Navigate to="/home" />} />
      <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

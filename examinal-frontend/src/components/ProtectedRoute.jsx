import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user } = useAuth();

  // Not logged in → redirect to login
  if (!user) return <Navigate to="/login" />;

  // Role check → if allowedRoles specified and user's role not in list
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    toast.error("You don't have permission to access that page.");
    return <Navigate to="/dashboard" />;
  }

  return children;
}

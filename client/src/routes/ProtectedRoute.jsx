import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { ROLES, getDashboardPath } from "../types/roles";
import SessionStatus from "../components/auth/SessionStatus";
const roleBySection = {
  candidate: ROLES.CANDIDATE,
  recruiter: ROLES.RECRUITER,
  admin: ROLES.ADMIN,
};
export default function ProtectedRoute() {
  const { isAuthenticated, isLoading, sessionError, user } = useAuth();
  const location = useLocation();
  if (isLoading || sessionError) return <SessionStatus />;
  if (!isAuthenticated)
    return <Navigate to="/login" replace state={{ from: location }} />;
  const requiredRole = roleBySection[location.pathname.split("/")[1]];
  if (requiredRole && user?.role !== requiredRole)
    return <Navigate to={getDashboardPath(user?.role)} replace />;
  if (location.pathname === `/${location.pathname.split("/")[1]}`)
    return <Navigate to={getDashboardPath(user.role)} replace />;
  return <Outlet />;
}

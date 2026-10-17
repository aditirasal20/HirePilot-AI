import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { getAuthDestination } from "../utils/auth";
import SessionStatus from "../components/auth/SessionStatus";
export default function PublicRoute() {
  const { isAuthenticated, isLoading, sessionError, user } = useAuth();
  const location = useLocation();
  if (isLoading || sessionError) return <SessionStatus />;
  if (isAuthenticated)
    return (
      <Navigate
        to={getAuthDestination(user.role, location.state?.from)}
        replace
      />
    );
  return <Outlet />;
}

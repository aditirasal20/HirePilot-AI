import { Navigate, useLocation } from "react-router-dom";
export default function CandidateAlias({ to }) {
  const { search } = useLocation();
  return <Navigate to={to + search} replace />;
}

import { useAuth } from "../../contexts/AuthContext";
import Brand from "../ui/Brand";
import Button from "../ui/Button";
import FormNotice from "../ui/FormNotice";
import "../../styles/auth.css";
export default function SessionStatus() {
  const { sessionError, retrySession, logout } = useAuth();
  return (
    <main className="hp-theme hp-session-status">
      <Brand />
      {sessionError ? (
        <>
          <h1>Let's reconnect.</h1>
          <FormNotice>{sessionError}</FormNotice>
          <div className="flex flex-wrap justify-center gap-3">
            <Button onClick={retrySession}>Try again</Button>
            <Button variant="outline" onClick={logout}>
              Go to login
            </Button>
          </div>
        </>
      ) : (
        <div role="status" className="hp-session-loading">
          <span className="hp-spinner" aria-hidden="true" />
          <p>Restoring your session...</p>
        </div>
      )}
    </main>
  );
}

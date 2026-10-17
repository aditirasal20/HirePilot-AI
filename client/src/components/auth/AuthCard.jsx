import { Link } from "react-router-dom";
import { FileText, Check } from "lucide-react";
import Brand from "../ui/Brand";
import "../../styles/auth.css";
export default function AuthCard({
  children,
  title,
  subtitle,
  mode = "login",
}) {
  const registering = mode === "register";
  return (
    <div className="hp-theme hp-auth-page">
      <header className="hp-auth-header">
        <Brand />
        <Link to="/">Back to home</Link>
      </header>
      <main className="hp-auth-main">
        <aside className="hp-auth-story" aria-label="Welcome to HirePilot">
          <p className="hp-auth-eyebrow">A clearer path to the right fit.</p>
          <h2>
            Great talent.
            <br />
            Real possibility.<span>Your next chapter.</span>
          </h2>
          <p>
            Whether you're finding your next role or your next teammate, make
            your next move with clarity.
          </p>
          <div className="hp-auth-illustration" aria-hidden="true">
            <div className="hp-auth-document">
              <span className="hp-auth-document-icon">
                <FileText size={25} strokeWidth={1.5} />
              </span>
              <div>
                <strong>Potential, in focus.</strong>
                <span>Experience. Skills. Opportunity.</span>
              </div>
              <span className="hp-auth-check">
                <Check size={15} />
              </span>
            </div>
            <div className="hp-auth-lime-shape" />
            <div className="hp-auth-illustration-caption">
              AI insights. Human decisions.
            </div>
          </div>
          <div className="hp-auth-story-footer">
            <span>For candidates</span>
            <span>For recruiters</span>
          </div>
        </aside>
        <section className="hp-auth-form-panel" aria-labelledby="auth-title">
          <div className="hp-auth-form-inner">
            <p className="hp-auth-eyebrow">
              {registering
                ? "Your next chapter starts here"
                : "Good to have you here"}
            </p>
            <h1 id="auth-title">{title}</h1>
            <p className="hp-auth-subtitle">{subtitle}</p>
            {children}
          </div>
        </section>
      </main>
      <footer className="hp-auth-footer">
        <span>&copy; {new Date().getFullYear()} HirePilot AI</span>
        <span>Built for people. Powered by possibility.</span>
      </footer>
    </div>
  );
}

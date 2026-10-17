import { Link } from "react-router-dom";
export default function CTA() {
  return (
    <section className="hp-cta hp-shell">
      <div className="hp-cta-inner">
        <div className="hp-cta-orb" aria-hidden="true" />
        <p className="hp-eyebrow">Opportunity starts with a connection.</p>
        <h2>
          Let’s find
          <br />
          your next great fit.
        </h2>
        <p>Your next role. Your next teammate. Start with HirePilot.</p>
        <Link to="/register" className="hp-button hp-button-lime">
          Create your account
        </Link>
        <span className="hp-cta-login">
          Already have an account? <Link to="/login">Log in</Link>
        </span>
      </div>
    </section>
  );
}

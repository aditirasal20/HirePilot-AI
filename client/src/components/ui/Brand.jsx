import { Link } from "react-router-dom";
export default function Brand() {
  return (
    <Link to="/" className="hp-brand" aria-label="HirePilot AI home">
      hirepilot<span className="hp-brand-dot">.</span>
      <span className="hp-brand-ai">AI</span>
    </Link>
  );
}

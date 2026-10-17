import { Link } from "react-router-dom";
import Brand from "../ui/Brand";
export default function Footer() {
  return (
    <footer className="hp-footer hp-shell">
      <div className="hp-footer-top">
        <div>
          <Brand />
          <p>A clearer path to the right fit.</p>
        </div>
        <nav aria-label="Footer navigation">
          <a href="#ai-tools">Product</a>
          <a href="#candidates">For candidates</a>
          <a href="#recruiters">For recruiters</a>
          <Link to="/login">Log in</Link>
        </nav>
      </div>
      <div className="hp-footer-bottom">
        <span>© {new Date().getFullYear()} HirePilot AI</span>
        <span>Built for people. Powered by possibility.</span>
      </div>
    </footer>
  );
}

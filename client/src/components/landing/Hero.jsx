import { Link } from "react-router-dom";
import {
  Check,
  FileText,
  ScanLine,
  BriefcaseBusiness,
  SlidersHorizontal,
} from "lucide-react";
export default function Hero() {
  return (
    <section className="hp-hero hp-shell">
      <h1 className="max-w-6xl mx-auto">
        Great talent.
        <br />
        <span className="hp-hero-second">The right opportunity.</span>
      </h1>
      <div className="hp-hero-bottom">
        <figure
          className="hp-hero-product"
          aria-label="Illustrative resume analysis preview"
        >
          <div className="hp-tool-rail" aria-hidden="true">
            <span className="active">
              <FileText />
            </span>
            <span>
              <ScanLine />
            </span>
            <span>
              <BriefcaseBusiness />
            </span>
            <span>
              <SlidersHorizontal />
            </span>
          </div>
          <div className="hp-resume-grid grid-flow-dense">
            <div className="hp-resume-card">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="hp-avatar">AL</span>
                  <div>
                    <strong>Alex Lee</strong>
                    <p>Frontend developer</p>
                  </div>
                </div>
                <span className="hp-file-tag">PDF</span>
              </div>
              <div className="hp-resume-skills">
                <span>Skills, at a glance</span>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {["React", "JavaScript", "TypeScript", "Git"].map((skill) => (
                    <span className="hp-chip" key={skill}>
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
              <div className="hp-reviewed">
                <Check size={13} /> Resume analysis complete
              </div>
            </div>
            {[
              ["Grammar", "Clear & consistent"],
              ["Formatting", "Easy to scan"],
              ["Keywords", "Skills identified"],
              ["Next step", "Explore job matches"],
            ].map(([title, value]) => (
              <div className="hp-mini-card" key={title}>
                <span>{title}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
          <div className="hp-score-column">
            <strong>
              86<span>/100</span>
            </strong>
            <span>ATS score</span>
            <div className="hp-score-fluid" aria-hidden="true" />
          </div>
          <figcaption>Example profile · Illustrative analysis</figcaption>
        </figure>
        <div className="hp-hero-copy">
          <p>
            A better next step, on both sides of hiring. Use AI to strengthen
            your resume, find your fit, and bring the right people into focus.
          </p>
          <div className="flex flex-wrap gap-3 mt-7">
            <Link to="/register" className="hp-button hp-button-dark">
              Get started
            </Link>
            <a href="#ai-tools" className="hp-button hp-button-outline">
              Explore HirePilot
            </a>
          </div>
          <div className="hp-hero-note">
            <div className="hp-note-icon">
              <ScanLine size={23} />
            </div>
            <div>
              <strong>Less guesswork. More possibility.</strong>
              <span>AI insights. Human decisions.</span>
            </div>
            <div className="hp-lime-tile" aria-hidden="true" />
          </div>
        </div>
      </div>
      <div className="hp-capabilities">
        <span>Built around your next move</span>
        <div>
          <span>Resume intelligence</span>
          <span>Job matching</span>
          <span>Candidate screening</span>
          <span>Hiring pipeline</span>
        </div>
      </div>
    </section>
  );
}

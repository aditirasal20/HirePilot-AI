import { Link } from "react-router-dom";
import { Check, FileText, BriefcaseBusiness } from "lucide-react";
export default function Features() {
  return (
    <section id="features" className="hp-section hp-shell">
      <div className="hp-section-heading text-center">
        <p className="hp-eyebrow">Two perspectives. One place.</p>
        <h2>
          Built for both sides
          <br />
          of the next great hire.
        </h2>
      </div>
      <div className="hp-workflows grid grid-cols-1 md:grid-cols-2 grid-flow-dense">
        <article id="candidates" className="hp-workflow hp-candidate-workflow">
          <FileText size={25} strokeWidth={1.5} />
          <p className="hp-eyebrow">For candidates</p>
          <h3>
            Your next chapter
            <br />
            starts with you.
          </h3>
          <p>
            Bring your experience into focus and find opportunities that fit
            what you do best.
          </p>
          <ul>
            {[
              "Upload your resume and get AI feedback",
              "Explore job matches and skill gaps",
              "Track applications and upcoming interviews",
            ].map((item) => (
              <li key={item}>
                <Check size={16} />
                {item}
              </li>
            ))}
          </ul>
          <Link to="/register" className="hp-button hp-button-dark">
            Start your job search
          </Link>
          <div className="hp-workflow-bottom">
            <span className="hp-document-icon">
              <FileText size={23} />
            </span>
            <div>
              <strong>Your experience, with direction.</strong>
              <span>Resume. Insights. Opportunities.</span>
            </div>
          </div>
        </article>
        <article id="recruiters" className="hp-workflow hp-recruiter-workflow">
          <BriefcaseBusiness size={25} strokeWidth={1.5} />
          <p className="hp-eyebrow">For recruiters</p>
          <h3>
            See the person.
            <br />
            Build the right team.
          </h3>
          <p>
            Turn applications into informed conversations, with a clear view of
            every candidate.
          </p>
          <ul>
            {[
              "Post jobs and review candidate profiles",
              "Screen applicants with resume AI insights",
              "Shortlist, schedule interviews, and track hires",
            ].map((item) => (
              <li key={item}>
                <Check size={16} />
                {item}
              </li>
            ))}
          </ul>
          <Link to="/register" className="hp-button hp-button-dark">
            Start hiring
          </Link>
          <div className="hp-pipeline" aria-label="Hiring pipeline stages">
            <span>Applied</span>
            <span>Shortlisted</span>
            <span>Interview</span>
            <span>
              Hired
              <Check size={12} />
            </span>
          </div>
        </article>
      </div>
    </section>
  );
}

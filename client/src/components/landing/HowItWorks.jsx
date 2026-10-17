import { useState } from "react";
const journeys = {
  candidate: [
    [
      "Bring your experience",
      "Create a candidate account, build your profile, and upload your resume.",
    ],
    [
      "Get a clearer picture",
      "Run an AI resume analysis. Review your ATS score and compare your fit with open roles.",
    ],
    [
      "Make your next move",
      "Apply for opportunities and keep track of your applications and interviews.",
    ],
  ],
  recruiter: [
    [
      "Set up your hiring",
      "Create a recruiter account, add your company, and publish an open role.",
    ],
    [
      "Find the potential",
      "Review applications, explore resume insights, and shortlist candidates for your team.",
    ],
    [
      "Move the conversation forward",
      "Schedule interviews and manage each application through to a hiring decision.",
    ],
  ],
};
export default function HowItWorks() {
  const [audience, setAudience] = useState("candidate");
  return (
    <section id="how-it-works" className="hp-section hp-how-section">
      <div className="hp-shell">
        <div className="hp-how-heading">
          <div>
            <p className="hp-eyebrow">Simple from the start</p>
            <h2>
              A good next step.
              <br />
              Then another.
            </h2>
          </div>
          <div
            className="hp-switch"
            role="group"
            aria-label="Choose your workflow"
          >
            <button
              aria-pressed={audience === "candidate"}
              onClick={() => setAudience("candidate")}
            >
              I’m a candidate
            </button>
            <button
              aria-pressed={audience === "recruiter"}
              onClick={() => setAudience("recruiter")}
            >
              I’m a recruiter
            </button>
          </div>
        </div>
        <div
          className="hp-steps grid grid-cols-1 md:grid-cols-3"
          aria-live="polite"
        >
          {journeys[audience].map(([title, text], index) => (
            <article key={title}>
              <span className="hp-step-number">0{index + 1}</span>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

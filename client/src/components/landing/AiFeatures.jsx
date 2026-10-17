import { useState } from "react";
import { Check, Plus, Minus, FileText } from "lucide-react";
const features = [
  {
    title: "A resume with a clearer direction.",
    label: "AI resume analysis",
    text: "Understand your strengths, spot missing skills, and get actionable feedback on grammar, formatting, and keywords.",
    panel: "Your resume, understood.",
    rows: [
      ["Grammar & clarity", "92"],
      ["Formatting", "88"],
      ["Keyword coverage", "78"],
    ],
    note: "Add measurable outcomes to your experience. Show the impact behind the work.",
  },
  {
    title: "Know where you stand.",
    label: "ATS scoring",
    text: "See how your resume scores across key ATS criteria. Use the breakdown to decide what to improve before your next application.",
    panel: "Make every detail count.",
    rows: [
      ["ATS score", "86"],
      ["Formatting", "88"],
      ["Job readiness", "82"],
    ],
    note: "Use clear section headings and consistent formatting to make your experience easier to read.",
  },
  {
    title: "Find the fit behind the job title.",
    label: "AI job matching",
    text: "Compare your resume with open roles to understand skill alignment, gaps, and recommendations before you apply.",
    panel: "A closer look at your fit.",
    rows: [
      ["Overall match", "84"],
      ["Skills alignment", "90"],
      ["Experience fit", "80"],
    ],
    note: "Your React and JavaScript skills align with this example role. Review the missing skills before applying.",
  },
];
export default function AiFeatures() {
  const [active, setActive] = useState(0);
  const current = features[active];
  return (
    <section id="ai-tools" className="hp-section hp-product-section">
      <div className="hp-shell">
        <div className="hp-section-heading">
          <p className="hp-eyebrow">
            A little intelligence. A lot more clarity.
          </p>
          <h2>
            See the potential.
            <br />
            <span className="hp-muted">Know your next move.</span>
          </h2>
        </div>
        <div className="hp-product-layout">
          <div className="hp-accordion">
            {features.map((feature, index) => (
              <div
                className={`hp-accordion-item ${active === index ? "is-active" : ""}`}
                key={feature.label}
              >
                <h3>
                  <button
                    aria-expanded={active === index}
                    aria-controls={`feature-detail-${index}`}
                    onClick={() => setActive(index)}
                  >
                    <span>{feature.label}</span>
                    {active === index ? (
                      <Minus size={18} />
                    ) : (
                      <Plus size={18} />
                    )}
                  </button>
                </h3>
                <div id={`feature-detail-${index}`} hidden={active !== index}>
                  <h4>{feature.title}</h4>
                  <p>{feature.text}</p>
                </div>
              </div>
            ))}
          </div>
          <figure
            className="hp-analysis-stage"
            aria-label={`${current.label} illustrative preview`}
          >
            <div className="hp-analysis-window">
              <div className="hp-window-bar">
                <span className="flex items-center gap-2">
                  <FileText size={16} /> Resume insights
                </span>
                <span className="hp-status">
                  <span /> Completed
                </span>
              </div>
              <div className="hp-analysis-body">
                <p className="hp-small-label">{current.label}</p>
                <h3>{current.panel}</h3>
                <div className="hp-score-rows">
                  {current.rows.map(([label, score]) => (
                    <div key={label}>
                      <div className="flex justify-between mb-2">
                        <span>{label}</span>
                        <strong>
                          {score}
                          <span className="hp-muted"> / 100</span>
                        </strong>
                      </div>
                      <div className="hp-progress">
                        <span style={{ width: `${score}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="hp-analysis-tip">
                  <Check size={17} />
                  <div>
                    <strong>Your next improvement</strong>
                    <p>{current.note}</p>
                  </div>
                </div>
              </div>
            </div>
            <figcaption>
              Product illustration · Sample scores and feedback
            </figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
}

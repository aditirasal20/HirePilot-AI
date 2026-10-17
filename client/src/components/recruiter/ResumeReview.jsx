import { Panel, Score, Tags, Badge, ExternalLink } from "../workspace/ui";
export default function ResumeReview({ resume = {}, job }) {
  let previewUrl;
  try {
    const parsed = new URL(resume.fileUrl);
    if (["http:", "https:"].includes(parsed.protocol)) previewUrl = parsed.href;
  } catch {
    /* Unavailable resume URL. */
  }
  const complete = resume.analysisStatus === "COMPLETED";
  const required = job?.requiredSkills || [];
  const skills = new Set(
    (resume.extractedSkills || []).map((x) => x.toLowerCase()),
  );
  const aligned = required.filter((x) => skills.has(x.toLowerCase()));
  const gaps = required.filter((x) => !skills.has(x.toLowerCase()));
  return (
    <div className="c-stack">
      <Panel
        title="Resume & screening"
        action={<Badge value={resume.analysisStatus || "IDLE"} />}
      >
        <div className="c-stack">
          <div className="c-actions">
            <span>
              {resume.title || resume.originalFileName || "Submitted resume"}
            </span>
            <ExternalLink href={resume.fileUrl}>Open resume PDF</ExternalLink>
          </div>
          {previewUrl && (
            <details className="r-safe-preview">
              <summary className="c-text-link">
                Preview submitted resume
              </summary>
              <iframe
                className="r-preview"
                title="Submitted resume PDF"
                src={previewUrl}
                loading="lazy"
                sandbox=""
                referrerPolicy="no-referrer"
              />
              <p className="c-muted">
                If the preview is unavailable, use Open resume PDF above.
              </p>
            </details>
          )}
          <p className="r-score-note">
            AI feedback describes the resume, not a hiring recommendation or
            job-specific match. The final assessment is yours.
          </p>
          {complete ? (
            <>
              <div className="c-scores">
                {[
                  ["Resume score", resume.aiScore],
                  ["Grammar", resume.grammarScore],
                  ["Formatting", resume.formatScore],
                  ["Keywords", resume.keywordScore],
                  ["Job readiness", resume.jobReadinessScore],
                ].map(([label, value]) => (
                  <Score label={label} value={value} key={label} />
                ))}
              </div>
              {resume.summary && <p className="c-prose">{resume.summary}</p>}
              <h3>Extracted skills</h3>
              <Tags items={resume.extractedSkills} />
              <div className="c-grid-2">
                {[
                  ["Strengths", resume.strengths],
                  ["Areas to discuss", resume.weaknesses],
                ].map(([title, items]) => (
                  <section key={title}>
                    <h3>{title}</h3>
                    {items?.length ? (
                      <ul className="c-advice">
                        {items.map((x, i) => (
                          <li key={i}>{x}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="c-muted">No feedback provided.</p>
                    )}
                  </section>
                ))}
              </div>
              <div className="c-grid-2">
                <div>
                  <h3>Skills suggested by the audit</h3>
                  <Tags items={resume.recommendedSkills} />
                </div>
                <div>
                  <h3>Skills missing from the resume</h3>
                  <Tags items={resume.missingSkills} />
                </div>
              </div>
              {resume.experienceLevel && (
                <p className="c-muted">
                  Experience assessment: {resume.experienceLevel}
                </p>
              )}
            </>
          ) : (
            <p className="c-muted">
              No completed AI audit is available for this resume. Review the
              submitted PDF directly.
            </p>
          )}
          {complete && required.length > 0 && (
            <div>
              <h3>Role skill coverage</h3>
              <p className="c-muted">
                Exact skill-name comparison with this job's requirements.
                Equivalent skills or experience may need a manual review.
              </p>
              <div className="c-grid-2 r-section-gap">
                <div>
                  <h3>Found in the resume</h3>
                  <Tags items={aligned} />
                </div>
                <div>
                  <h3>Not explicitly listed</h3>
                  <Tags items={gaps} />
                </div>
              </div>
            </div>
          )}
        </div>
      </Panel>
    </div>
  );
}

import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import CandidateLayout from "../../components/candidate/CandidateLayout";
import {
  Panel,
  Button,
  Select,
  Notice,
  QueryState,
  Empty,
  Badge,
  Score,
  Tags,
} from "../../components/candidate/ui";
import {
  useSelectedResume,
  useCandidateMutation,
  inProgress,
  resumeKeys,
} from "../../hooks/useCandidate";
import resumeAIApi from "../../api/resumeAI.api";
import { QUERY_KEYS } from "../../config/constants";
import { formatDateTime } from "../../utils/format";
function Audit({ resume }) {
  const client = useQueryClient();
  const query = useQuery({
    queryKey: [QUERY_KEYS.RESUME_ANALYSIS, resume.id],
    queryFn: () => resumeAIApi.getAnalysis(resume.id),
    refetchInterval: (q) =>
      inProgress(q.state.data?.analysisStatus) ? 3000 : false,
  });
  const report = query.data;
  const mutation = useCandidateMutation(
    () => resumeAIApi.startAnalysis(resume.id),
    [[QUERY_KEYS.RESUME_ANALYSIS, resume.id], ...resumeKeys],
    () =>
      client.setQueryData([QUERY_KEYS.RESUME_ANALYSIS, resume.id], (old) => ({
        ...old,
        analysisStatus: "QUEUED",
      })),
  );
  useEffect(() => {
    if (["COMPLETED", "FAILED"].includes(report?.analysisStatus)) {
      resumeKeys.forEach((key) => client.invalidateQueries({ queryKey: key }));
    }
  }, [report?.analysisStatus, client]);
  const running = inProgress(report?.analysisStatus);
  const complete = report?.analysisStatus === "COMPLETED";
  return (
    <>
      <Panel
        title={resume.title || resume.originalFileName}
        description="A practical review of formatting, grammar, keywords, and job readiness."
        action={
          <Button
            disabled={running || query.isPending || query.isError}
            loading={mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {running
              ? "Analysis in progress"
              : complete
                ? "Run another audit"
                : "Run AI audit"}
          </Button>
        }
      >
        {mutation.error && <Notice>{mutation.error.message}</Notice>}
        <p className="c-muted">
          AI scores are guidance, not a guarantee of how any employer's ATS will
          evaluate your resume.
        </p>
      </Panel>
      <QueryState query={query}>
        {running ? (
          <Panel>
            <div className="c-loading" role="status">
              <span className="hp-spinner" />
              {report.analysisStatus === "QUEUED"
                ? "Your resume is queued for review."
                : "Your resume is being analyzed."}
            </div>
            <p className="c-muted">
              Results update automatically. You can leave this page and come
              back later.
            </p>
          </Panel>
        ) : report?.analysisStatus === "FAILED" ? (
          <Panel>
            <Empty
              title="The audit couldn't finish"
              description="Your resume is still safe. Try running the audit again. If it continues to fail, upload a readable PDF."
            />
          </Panel>
        ) : complete ? (
          <>
            <div className="c-actions">
              <Badge value="COMPLETED" />
              {report.lastAnalyzedAt && (
                <span className="c-muted">
                  Reviewed {formatDateTime(report.lastAnalyzedAt)}
                </span>
              )}
            </div>
            <div className="c-scores">
              {[
                ["ATS score", report.aiScore ?? report.analysisScore],
                ["Grammar", report.grammarScore],
                ["Formatting", report.formatScore],
                ["Keywords", report.keywordScore],
                ["Job readiness", report.jobReadinessScore],
              ].map(([label, value]) => (
                <Score key={label} label={label} value={value} />
              ))}
            </div>
            {report.summary && (
              <Panel title="The overall picture">
                <p className="c-prose">{report.summary}</p>
                {report.experienceLevel && (
                  <p className="c-muted" style={{ marginTop: 16 }}>
                    Experience level: {report.experienceLevel}
                  </p>
                )}
              </Panel>
            )}
            <div className="c-grid-2">
              {[
                ["What is working", report.strengths],
                ["Where to improve", report.weaknesses],
              ].map(([title, items]) => (
                <Panel key={title} title={title}>
                  {items?.length ? (
                    <ul className="c-advice">
                      {items.map((x, i) => (
                        <li key={i}>{x}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="c-muted">
                      No specific feedback was returned in this section.
                    </p>
                  )}
                </Panel>
              ))}
            </div>
            <Panel
              title="Skills to review"
              description="Only add skills you actually have. Use the gaps as a guide for future learning."
            >
              <div className="c-grid-2">
                <div>
                  <h3>Missing from this resume</h3>
                  <Tags items={report.missingSkills} />
                </div>
                <div>
                  <h3>Recommended skills</h3>
                  <Tags items={report.recommendedSkills} />
                </div>
              </div>
            </Panel>
            <section className="c-feature">
              <div>
                <h2>Put the feedback in context.</h2>
                <p>
                  Compare this resume with a specific role to see where your
                  experience aligns.
                </p>
              </div>
              <Button to={"/candidate/job-matching?resumeId=" + resume.id}>
                Compare with a role
              </Button>
            </section>
          </>
        ) : (
          <Panel>
            <Empty
              title="See your resume from a new perspective"
              description="Run an audit to get your first score and practical feedback."
            />
          </Panel>
        )}
      </QueryState>
    </>
  );
}
export default function ResumeAI() {
  const { query, resumes, selected, select } = useSelectedResume();
  return (
    <CandidateLayout
      title="A stronger first impression."
      description="Understand what your resume communicates, and where it can work harder."
      actions={
        <Button variant="outline" to="/candidate/resume-builder">
          Manage resumes
        </Button>
      }
    >
      <QueryState query={query}>
        {selected ? (
          <>
            <Select
              label="Resume to review"
              value={selected.id}
              onChange={(e) => select(e.target.value)}
            >
              {resumes.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.title || r.originalFileName}
                </option>
              ))}
            </Select>
            <Audit key={selected.id} resume={selected} />
          </>
        ) : (
          <Panel>
            <Empty
              title="Start with a resume"
              description="Upload your PDF before running an AI audit."
              to="/candidate/resume-builder"
              action="Upload resume"
            />
          </Panel>
        )}
      </QueryState>
    </CandidateLayout>
  );
}

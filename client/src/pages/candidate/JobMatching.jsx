import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import CandidateLayout from "../../components/candidate/CandidateLayout";
import {
  Panel,
  Button,
  TextField,
  Select,
  Notice,
  QueryState,
  Empty,
  Badge,
  Score,
  Tags,
  Pager,
} from "../../components/candidate/ui";
import {
  usePageParams,
  useResumes,
  useCandidateMutation,
  inProgress,
} from "../../hooks/useCandidate";
import jobMatchingApi from "../../api/jobMatching.api";
import jobApi from "../../api/job.api";
import { QUERY_KEYS } from "../../config/constants";
function MatchCard({ match, resumes }) {
  const [confirm, setConfirm] = useState(false);
  const remove = useCandidateMutation(
    () => jobMatchingApi.deleteMatch(match.id),
    [QUERY_KEYS.MY_MATCHES],
  );
  const retry = useCandidateMutation(
    () =>
      jobMatchingApi.analyzeJob({
        jobId: match.jobId || match.job?.id,
        resumeId: match.resumeId,
        refresh: match.analysisStatus === "COMPLETED",
      }),
    [QUERY_KEYS.MY_MATCHES],
  );
  return (
    <Panel
      title={match.job?.title || "Role unavailable"}
      description={[
        match.job?.company?.name,
        resumes.find((r) => r.id === match.resumeId)?.title,
      ]
        .filter(Boolean)
        .join(" · ")}
      action={<Badge value={match.analysisStatus} />}
    >
      <div className="c-stack">
        {remove.error && <Notice>{remove.error.message}</Notice>}
        {retry.error && <Notice>{retry.error.message}</Notice>}
        {match.analysisStatus === "COMPLETED" ? (
          <>
            <div className="c-grid-2">
              <Score label="Overall match score" value={match.overallScore} />
              <div>
                <Badge value={match.recommendation} />
                <p className="c-prose" style={{ marginTop: 12 }}>
                  {match.summary}
                </p>
              </div>
            </div>
            <div className="c-grid-2">
              <div>
                <h3>Aligned skills</h3>
                <Tags items={match.matchedSkills} />
              </div>
              <div>
                <h3>Skills to highlight or develop</h3>
                <Tags items={match.missingSkills} />
              </div>
            </div>
          </>
        ) : match.analysisStatus === "FAILED" ? (
          <>
            <Notice>
              The match analysis couldn't finish. Try again when you're ready.
            </Notice>
            <div>
              <Button
                variant="outline"
                loading={retry.isPending}
                onClick={() => retry.mutate()}
              >
                Retry analysis
              </Button>
            </div>
          </>
        ) : (
          <p className="c-muted" role="status">
            {inProgress(match.analysisStatus)
              ? "Analysis is in progress. Results update automatically."
              : "Analysis has not started."}
          </p>
        )}
        <div className="c-actions">
          {match.job?.id && (
            <Button variant="outline" to={"/candidate/jobs/" + match.job.id}>
              View role
            </Button>
          )}
          {match.analysisStatus === "COMPLETED" && (
            <Button variant="outline" loading={retry.isPending} onClick={() => retry.mutate()}>
              Refresh report
            </Button>
          )}
          {!inProgress(match.analysisStatus) && (
            <button className="c-text-link" onClick={() => setConfirm(true)}>
              Remove match
            </button>
          )}
        </div>
        {confirm && (
          <div className="c-confirm">
            <p>
              Remove this match report? Your resume and applications will stay
              available.
            </p>
            <div className="c-actions">
              <Button
                loading={remove.isPending}
                onClick={() => remove.mutate()}
              >
                Remove report
              </Button>
              <Button variant="outline" onClick={() => setConfirm(false)}>
                Keep report
              </Button>
            </div>
          </div>
        )}
      </div>
    </Panel>
  );
}
export default function JobMatching() {
  const { params, update } = usePageParams();
  const jobId = params.get("jobId") || "";
  const [search, setSearch] = useState("");
  const [term, setTerm] = useState("");
  const [jobPage, setJobPage] = useState(1);
  const [message, setMessage] = useState("");
  const resumesQuery = useResumes();
  const resumes = resumesQuery.data || [];
  const analyzed = resumes.filter((r) => r.analysisStatus === "COMPLETED");
  const selected =
    analyzed.find((r) => r.id === params.get("resumeId")) ||
    analyzed.find((r) => r.isDefault) ||
    analyzed[0];
  const jobs = useQuery({
    queryKey: [
      ...QUERY_KEYS.PUBLIC_JOBS,
      { search: term, page: jobPage, limit: 20 },
    ],
    queryFn: () =>
      jobApi.getPublicJobs({ search: term, page: jobPage, limit: 20 }),
  });
  const chosen = useQuery({
    queryKey: [QUERY_KEYS.JOB_DETAIL, jobId],
    queryFn: () => jobApi.getJobById(jobId),
    enabled: !!jobId,
  });
  const matches = useQuery({
    queryKey: QUERY_KEYS.MY_MATCHES,
    queryFn: jobMatchingApi.getMyMatches,
    refetchInterval: (q) =>
      q.state.data?.some((m) => inProgress(m.analysisStatus)) ? 5000 : false,
  });
  const analyze = useCandidateMutation(
    jobMatchingApi.analyzeJob,
    [QUERY_KEYS.MY_MATCHES],
    (data) =>
      setMessage(
        data?.cached
          ? "Your existing match report is available below."
          : "Analysis started. Results will appear below.",
      ),
  );
  const choices = jobs.data?.jobs || [];
  const options =
    chosen.data && !choices.some((j) => j.id === jobId)
      ? [chosen.data, ...choices]
      : choices;
  return (
    <CandidateLayout
      title="Find the right fit."
      description="Compare your experience with a role. Understand your strengths before you apply."
    >
      <Panel
        title="A more informed next step"
        description="Choose an open role and a resume with a completed AI audit."
      >
        <QueryState query={resumesQuery}>
          {!analyzed.length ? (
            <Empty
              title="An analyzed resume comes first"
              description={
                resumes.length
                  ? "Run an AI resume audit to unlock role comparisons."
                  : "Upload a resume, then run an AI audit to unlock matching."
              }
              to={
                resumes.length
                  ? "/candidate/ai-resume-audit"
                  : "/candidate/resume-builder"
              }
              action={resumes.length ? "Audit my resume" : "Upload resume"}
            />
          ) : (
            <div className="c-stack">
              <form
                className="c-actions"
                onSubmit={(e) => {
                  e.preventDefault();
                  setTerm(search.trim());
                  setJobPage(1);
                }}
              >
                <div style={{ flex: 1, minWidth: 180 }}>
                  <TextField
                    label="Find a role to compare"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search role keywords"
                  />
                </div>
                <Button
                  type="submit"
                  variant="outline"
                  style={{ alignSelf: "end" }}
                >
                  Search roles
                </Button>
              </form>
              <QueryState query={jobs}>
                <div className="c-grid-2">
                  <Select
                    label="Open role"
                    value={jobId}
                    onChange={(e) => {
                      update({ jobId: e.target.value });
                      setMessage("");
                    }}
                  >
                    <option value="">Choose a role</option>
                    {options.map((j) => (
                      <option key={j.id} value={j.id}>
                        {j.title} · {j.company?.name}
                      </option>
                    ))}
                  </Select>
                  <Select
                    label="Analyzed resume"
                    value={selected?.id || ""}
                    onChange={(e) => {
                      update({ resumeId: e.target.value });
                      setMessage("");
                    }}
                  >
                    {analyzed.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.title || r.originalFileName}
                      </option>
                    ))}
                  </Select>
                </div>
                {jobs.data && (
                  <Pager
                    pagination={jobs.data.pagination}
                    page={jobPage}
                    onChange={setJobPage}
                  />
                )}
              </QueryState>
              {jobId && chosen.isError && (
                <Notice>{chosen.error.message}</Notice>
              )}
              {analyze.error && <Notice>{analyze.error.message}</Notice>}
              {message && <Notice tone="success">{message}</Notice>}
              <div className="c-actions">
                <Button
                  disabled={
                    !selected ||
                    !jobId ||
                    jobs.isError ||
                    chosen.isPending ||
                    chosen.isError ||
                    chosen.data?.status !== "OPEN"
                  }
                  loading={analyze.isPending}
                  onClick={() => {
                    setMessage("");
                    analyze.mutate({ jobId, resumeId: selected.id });
                  }}
                >
                  Compare resume and role
                </Button>
                <span className="c-muted">
                  AI guidance, not a hiring decision.
                </span>
              </div>
            </div>
          )}
        </QueryState>
      </Panel>
      <h2 className="c-section-title">Your match reports</h2>
      <QueryState query={matches}>
        {matches.data?.length ? (
          <div className="c-stack">
            {matches.data.map((m) => (
              <MatchCard key={m.id} match={m} resumes={resumes} />
            ))}
          </div>
        ) : (
          <Panel>
            <Empty
              title="Your comparisons will live here"
              description="Run your first match to see aligned skills, gaps, and a role-specific score."
            />
          </Panel>
        )}
      </QueryState>
    </CandidateLayout>
  );
}

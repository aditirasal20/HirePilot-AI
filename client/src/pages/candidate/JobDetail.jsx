import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import CandidateLayout from "../../components/candidate/CandidateLayout";
import {
  Panel,
  Button,
  Badge,
  Select,
  Notice,
  QueryState,
  Empty,
  Tags,
} from "../../components/candidate/ui";
import {
  useSelectedResume,
  useCandidateMutation,
} from "../../hooks/useCandidate";
import jobApi from "../../api/job.api";
import applicationApi from "../../api/application.api";
import { QUERY_KEYS } from "../../config/constants";
import { formatSalary, formatDate } from "../../utils/format";
export default function JobDetail() {
  const { jobId } = useParams();
  return <JobDetailContent key={jobId} jobId={jobId} />;
}
function JobDetailContent({ jobId }) {
  const {
    query: resumesQuery,
    resumes,
    selected,
    select,
  } = useSelectedResume();
  const [submitted, setSubmitted] = useState(false);
  const query = useQuery({
    queryKey: [QUERY_KEYS.JOB_DETAIL, jobId],
    queryFn: () => jobApi.getJobById(jobId),
  });
  const apply = useCandidateMutation(
    applicationApi.applyToJob,
    [
      QUERY_KEYS.MY_APPLICATIONS,
      QUERY_KEYS.DASHBOARD,
      QUERY_KEYS.NOTIFICATIONS,
      QUERY_KEYS.UNREAD_COUNT,
    ],
    () => setSubmitted(true),
  );
  const job = query.data;
  const duplicate = apply.error?.status === 409;
  const closed = job?.status && job.status !== "OPEN";
  return (
    <CandidateLayout
      title={job?.title || "Role details"}
      description={job?.company?.name}
      actions={
        <Button variant="outline" to="/candidate/jobs">
          All jobs
        </Button>
      }
    >
      <QueryState query={query}>
        {job ? (
          <div className="c-split">
            <Panel title="About the opportunity">
              <div className="c-actions">
                <Badge value={job.employmentType} />
                {closed && <Badge value={job.status} />}
              </div>
              <dl className="c-detail-grid" style={{ margin: "24px 0" }}>
                <div>
                  <dt>Location</dt>
                  <dd>{job.location || "Not specified"}</dd>
                </div>
                <div>
                  <dt>Salary</dt>
                  <dd>{formatSalary(job.salaryMin, job.salaryMax)}</dd>
                </div>
                <div>
                  <dt>Experience required</dt>
                  <dd>
                    {job.yearsOfExperience ?? "Not specified"}
                    {job.yearsOfExperience != null ? " years" : ""}
                  </dd>
                </div>
                <div>
                  <dt>Posted</dt>
                  <dd>{formatDate(job.createdAt)}</dd>
                </div>
              </dl>
              <h3>Job description</h3>
              <p className="c-prose" style={{ margin: "16px 0 28px" }}>
                {job.description}
              </p>
              <h3>Required skills</h3>
              <div style={{ marginTop: 12 }}>
                <Tags items={job.requiredSkills} />
              </div>
            </Panel>
            <div className="c-stack">
              <Panel
                title={
                  submitted || duplicate
                    ? "Application received"
                    : "Make your next move"
                }
                description="Choose the resume you want the hiring team to review."
              >
                {submitted || duplicate ? (
                  <>
                    <Notice tone="success">
                      {duplicate
                        ? "You have already applied for this role."
                        : "Your application has been sent."}
                    </Notice>
                    <Button to="/candidate/applications">
                      Track application
                    </Button>
                  </>
                ) : closed ? (
                  <p className="c-muted">
                    This role is no longer accepting applications.
                  </p>
                ) : (
                  <QueryState query={resumesQuery}>
                    {resumes.length ? (
                      <form
                        className="c-stack"
                        onSubmit={(e) => {
                          e.preventDefault();
                          if (selected && !apply.isPending)
                            apply.mutate({ jobId, resumeId: selected.id });
                        }}
                      >
                        <Select
                          label="Application resume"
                          value={selected?.id || ""}
                          onChange={(e) => select(e.target.value)}
                        >
                          {resumes.map((r) => (
                            <option key={r.id} value={r.id}>
                              {r.title || r.originalFileName}
                              {r.isDefault ? " (default)" : ""}
                            </option>
                          ))}
                        </Select>
                        <p className="c-muted">
                          Submitting shares this resume and your candidate
                          profile with the hiring team.
                        </p>
                        {apply.isError && (
                          <Notice tone="error">{apply.error.message}</Notice>
                        )}
                        <Button type="submit" loading={apply.isPending}>
                          Submit application
                        </Button>
                        <Link
                          className="c-text-link"
                          to="/candidate/resume-builder"
                        >
                          Manage resumes
                        </Link>
                      </form>
                    ) : (
                      <Empty
                        title="Add a resume first"
                        description="Upload a PDF so the hiring team can get to know your experience."
                        to="/candidate/resume-builder"
                        action="Upload resume"
                      />
                    )}
                  </QueryState>
                )}
              </Panel>
              <Panel
                title="How well does it fit?"
                description="Compare an analyzed resume with this role to understand strengths and skill gaps."
              >
                <Button
                  variant="outline"
                  to={
                    "/candidate/job-matching?jobId=" +
                    jobId +
                    (selected ? "&resumeId=" + selected.id : "")
                  }
                >
                  Check my fit
                </Button>
              </Panel>
            </div>
          </div>
        ) : (
          <Panel>
            <Empty
              title="Role unavailable"
              description="This role could not be found."
              to="/candidate/jobs"
              action="Explore jobs"
            />
          </Panel>
        )}
      </QueryState>
    </CandidateLayout>
  );
}

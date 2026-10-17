import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import RecruiterLayout from "../../components/recruiter/RecruiterLayout";
import ApplicantsTable from "../../components/recruiter/ApplicantsTable";
import {
  Panel,
  Button,
  QueryState,
  Empty,
  Badge,
  Notice,
  Tags,
} from "../../components/workspace/ui";
import {
  useJob,
  useWorkspaceMutation,
  hiringKeys,
} from "../../hooks/useRecruiter";
import { useAuth } from "../../contexts/AuthContext";
import jobApi from "../../api/job.api";
import applicationApi from "../../api/application.api";
import { QUERY_KEYS } from "../../config/constants";
import { stages } from "../../utils/recruiter";
import { labelOf } from "../../utils/candidate";
import { formatSalary } from "../../utils/format";
export default function JobOverview() {
  const { jobId } = useParams();
  return <Overview key={jobId} jobId={jobId} />;
}
function Overview({ jobId }) {
  const { user } = useAuth();
  const job = useJob(jobId);
  const [confirm, setConfirm] = useState(false);
  const owner = job.data?.recruiter?.userId === user.id;
  const applications = useQuery({
    queryKey: [...QUERY_KEYS.JOB_APPLICATIONS, jobId, { page: 1, limit: 5 }],
    queryFn: () =>
      applicationApi.getJobApplications(jobId, { page: 1, limit: 5 }),
    enabled: owner,
  });
  const mutation = useWorkspaceMutation(
    (status) => jobApi.updateJobStatus(jobId, status),
    [...hiringKeys, [QUERY_KEYS.JOB_DETAIL, jobId]],
    () => setConfirm(false),
  );
  const j = job.data;
  return (
    <RecruiterLayout
      title={j?.title || "Job overview"}
      description={
        j
          ? j.location + " · " + labelOf(j.employmentType)
          : "Your role, pipeline, and next steps in one place."
      }
      actions={
        <Button variant="outline" to="/recruiter/jobs">
          All jobs
        </Button>
      }
    >
      <QueryState query={job}>
        {owner ? (
          <>
            <section className="c-feature">
              <div>
                <Badge value={j.status} />
                <h2 className="r-section-gap">
                  {j.status === "DRAFT"
                    ? "Ready when you are."
                    : j.status === "OPEN"
                      ? "Keep your hiring moving."
                      : "This role is closed."}
                </h2>
                <p>
                  {j.status === "DRAFT"
                    ? "Review the posting, then publish it to receive applications."
                    : j.status === "OPEN"
                      ? "Review new applicants, compare their experience, and move conversations forward."
                      : "Existing applicants remain available for review. Reopen the role to receive new applications."}
                </p>
              </div>
              <div className="c-actions">
                <Button
                  to={"/recruiter/applicants?jobId=" + jobId + "&view=board"}
                >
                  Open pipeline
                </Button>
                {j.status !== "CLOSED" && (
                  <Button
                    variant="outline"
                    to={"/recruiter/jobs/" + jobId + "/edit"}
                  >
                    Edit job
                  </Button>
                )}
                <Button
                  variant="outline"
                  loading={mutation.isPending}
                  onClick={() => setConfirm(true)}
                >
                  {j.status === "OPEN"
                    ? "Close role"
                    : j.status === "DRAFT"
                      ? "Publish role"
                      : "Reopen role"}
                </Button>
              </div>
            </section>
            {mutation.error && <Notice>{mutation.error.message}</Notice>}
            {confirm && (
              <div className="c-confirm">
                <p>
                  {j.status === "OPEN"
                    ? "Close this role to new applications? You can still review existing applicants."
                    : "Make this role available for candidates to apply?"}
                </p>
                <div className="r-confirm-buttons">
                  <Button
                    loading={mutation.isPending}
                    onClick={() =>
                      mutation.mutate(j.status === "OPEN" ? "CLOSED" : "OPEN")
                    }
                  >
                    Confirm {j.status === "OPEN" ? "close" : "publish"}
                  </Button>
                  <Button
                    variant="outline"
                    disabled={mutation.isPending}
                    onClick={() => setConfirm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
            <QueryState query={applications}>
              <div className="r-stage-counts">
                {stages.map((s) => (
                  <Link
                    className="r-stage-count"
                    key={s}
                    to={"/recruiter/applicants?jobId=" + jobId + "&status=" + s}
                  >
                    <span>{labelOf(s)}</span>
                    <strong>{applications.data?.stageCounts?.[s] ?? 0}</strong>
                  </Link>
                ))}
              </div>
            </QueryState>
            <div className="c-split">
              <Panel
                title="Recent applicants"
                action={
                  <Link
                    className="c-text-link"
                    to={"/recruiter/applicants?jobId=" + jobId}
                  >
                    View all
                  </Link>
                }
              >
                <QueryState query={applications}>
                  <ApplicantsTable
                    applications={applications.data?.applications}
                    jobTitle={j.title}
                  />
                </QueryState>
              </Panel>
              <Panel title="Role essentials">
                <dl className="r-detail-list">
                  <div>
                    <dt>Salary</dt>
                    <dd>{formatSalary(j.salaryMin, j.salaryMax)}</dd>
                  </div>
                  <div>
                    <dt>Experience required</dt>
                    <dd>{j.yearsOfExperience} years</dd>
                  </div>
                  <div>
                    <dt>Required skills</dt>
                    <dd>
                      <Tags items={j.requiredSkills} />
                    </dd>
                  </div>
                </dl>
              </Panel>
            </div>
            <Panel title="Job description">
              <p className="c-prose">{j.description}</p>
            </Panel>
          </>
        ) : (
          <Empty
            title="Job unavailable"
            description="This job doesn't belong to your workspace."
            to="/recruiter/jobs"
            action="Your jobs"
          />
        )}
      </QueryState>
    </RecruiterLayout>
  );
}

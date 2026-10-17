import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import RecruiterLayout from "../../components/recruiter/RecruiterLayout";
import ApplicantsTable from "../../components/recruiter/ApplicantsTable";
import {
  Panel,
  Button,
  QueryState,
  Empty,
  Badge,
} from "../../components/workspace/ui";
import dashboardApi from "../../api/dashboard.api";
import { useCompany } from "../../hooks/useRecruiter";
import { useAuth } from "../../contexts/AuthContext";
import { QUERY_KEYS } from "../../config/constants";
import { formatDateTime } from "../../utils/format";
import { stages } from "../../utils/recruiter";
import { labelOf } from "../../utils/candidate";
export default function Dashboard() {
  const { user } = useAuth();
  const company = useCompany();
  const query = useQuery({
    queryKey: QUERY_KEYS.RECRUITER_DASHBOARD,
    queryFn: dashboardApi.getRecruiterDashboard,
  });
  const d = query.data;
  return (
    <RecruiterLayout
      title={`Good to see you, ${user?.fullName?.split(" ")[0] || "there"}.`}
      description="A clear view of your hiring. A considered next step for every candidate."
      actions={<Button to="/recruiter/jobs/create">Create job</Button>}
    >
      <QueryState query={query}>
        {d && (
          <>
            <div className="c-stats">
              {[
                [
                  "Open roles",
                  d.stats.activeJobs,
                  "/recruiter/jobs?status=OPEN",
                ],
                [
                  "Applications",
                  d.stats.totalApplications,
                  "/recruiter/applicants",
                ],
                [
                  "New applications today",
                  d.stats.applicationsToday,
                  "/recruiter/applicants",
                ],
                [
                  "Interviews today",
                  d.stats.interviewsToday,
                  "/recruiter/interviews",
                ],
              ].map(([label, value, to]) => (
                <Link key={label} className="c-stat" to={to}>
                  <span>{label}</span>
                  <strong>{value ?? 0}</strong>
                </Link>
              ))}
            </div>
            {company.isSuccess && !company.data ? (
              <section className="c-feature">
                <div>
                  <p className="c-eyebrow">Start here</p>
                  <h2>Give your next hire a place to begin.</h2>
                  <p>
                    Create your company profile, then publish your first
                    opportunity.
                  </p>
                </div>
                <Button to="/recruiter/company">Set up company</Button>
              </section>
            ) : (
              <section className="c-feature">
                <div>
                  <p className="c-eyebrow">Your next step</p>
                  <h2>
                    {d.stageCounts?.APPLIED
                      ? "Make room for the next great candidate."
                      : "Keep every opportunity moving."}
                  </h2>
                  <p>
                    {d.stageCounts?.APPLIED
                      ? d.stageCounts.APPLIED +
                        " applications are in the applied stage. Start a review and decide what comes next."
                      : "Open a job pipeline to review candidates, record decisions, and schedule conversations."}
                  </p>
                </div>
                <Button to="/recruiter/applicants?status=APPLIED">
                  Review applicants
                </Button>
              </section>
            )}
            <div className="c-split">
              <div className="c-stack">
                <Panel
                  title="Recent applications"
                  action={
                    <Link className="c-text-link" to="/recruiter/applicants">
                      Review all
                    </Link>
                  }
                >
                  <ApplicantsTable applications={d.recentApplications} />
                </Panel>
                <Panel
                  title="Current pipeline"
                  description="Where applications stand across your jobs."
                >
                  <div className="r-stage-counts">
                    {stages.map((s) => (
                      <Link
                        className="r-stage-count"
                        key={s}
                        to={"/recruiter/applicants?status=" + s}
                      >
                        <span>{labelOf(s)}</span>
                        <strong>{d.stageCounts?.[s] ?? 0}</strong>
                      </Link>
                    ))}
                  </div>
                </Panel>
              </div>
              <div className="c-stack">
                <Panel
                  title="Upcoming conversations"
                  action={
                    <Link className="c-text-link" to="/recruiter/interviews">
                      View schedule
                    </Link>
                  }
                >
                  {d.upcomingInterviews?.length ? (
                    <div className="c-list">
                      {d.upcomingInterviews.map((i) => (
                        <div className="c-list-row" key={i.id}>
                          <div>
                            <h3>{i.application?.candidate?.user?.fullName}</h3>
                            <p className="c-muted">
                              {i.application?.job?.title}
                            </p>
                            <p className="c-muted">
                              {formatDateTime(i.scheduledAt)} (local time)
                            </p>
                            <Link
                              className="c-text-link"
                              to={"/recruiter/interviews?interviewId=" + i.id}
                            >
                              Prepare for interview
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <Empty
                      title="Your next conversation awaits"
                      description="Schedule an interview from a shortlisted applicant's profile."
                      to="/recruiter/applicants"
                      action="Open applicants"
                    />
                  )}
                </Panel>
                <Panel
                  title="Keep the team in context"
                  description="A current company profile and clear job descriptions make a better first impression."
                >
                  <div className="c-actions">
                    <Button variant="outline" to="/recruiter/company">
                      Company profile
                    </Button>
                    <Badge value="OPEN">Hiring workspace</Badge>
                  </div>
                </Panel>
              </div>
            </div>
          </>
        )}
      </QueryState>
    </RecruiterLayout>
  );
}

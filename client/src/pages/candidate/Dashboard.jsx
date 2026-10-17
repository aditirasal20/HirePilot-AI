import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import CandidateLayout from "../../components/candidate/CandidateLayout";
import ApplicationTable from "../../components/candidate/ApplicationTable";
import {
  Panel,
  Button,
  Badge,
  QueryState,
  Empty,
  Score,
} from "../../components/candidate/ui";
import { useAuth } from "../../contexts/AuthContext";
import dashboardApi from "../../api/dashboard.api";
import { QUERY_KEYS } from "../../config/constants";
import { formatDateTime } from "../../utils/format";
export default function Dashboard() {
  const { user } = useAuth();
  const query = useQuery({
    queryKey: QUERY_KEYS.DASHBOARD,
    queryFn: dashboardApi.getCandidateDashboard,
  });
  const d = query.data;
  return (
    <CandidateLayout
      title={`Good to see you, ${user?.fullName?.split(" ")[0] || "there"}.`}
      description="A clear view of your search. A little momentum for what comes next."
      actions={<Button to="/candidate/jobs">Explore jobs</Button>}
    >
      <QueryState query={query}>
        {d && (
          <>
            <div className="c-stats">
              {[
                ["Applications", "applications", ""],
                ["In review", "reviewing", "REVIEWING"],
                ["Shortlisted", "shortlisted", "SHORTLISTED"],
                ["Interviews", "interviewScheduled", "INTERVIEW_SCHEDULED"],
              ].map(([label, key, status]) => (
                <Link
                  className="c-stat"
                  key={key}
                  to={
                    "/candidate/applications" +
                    (status ? "?status=" + status : "")
                  }
                >
                  <span>{label}</span>
                  <strong>{d.stats?.[key] ?? 0}</strong>
                </Link>
              ))}
            </div>
            <section className="c-feature">
              <div>
                <p className="c-eyebrow">Your next step</p>
                <h2>
                  {!d.defaultResume
                    ? "Put your experience to work."
                    : d.defaultResume.analysisStatus !== "COMPLETED"
                      ? "Turn your resume into a plan."
                      : "Find where your strengths fit."}
                </h2>
                <p>
                  {!d.defaultResume
                    ? "Start with your resume. Use it to apply for roles, get AI feedback, and compare your fit."
                    : d.defaultResume.analysisStatus !== "COMPLETED"
                      ? "Get feedback on structure, grammar, keywords, and the skills your resume communicates."
                      : "Compare your analyzed resume with an open role before deciding where to apply."}
                </p>
              </div>
              <Button
                to={
                  !d.defaultResume
                    ? "/candidate/resume-builder"
                    : d.defaultResume.analysisStatus !== "COMPLETED"
                      ? "/candidate/ai-resume-audit"
                      : "/candidate/job-matching"
                }
              >
                {!d.defaultResume
                  ? "Upload resume"
                  : d.defaultResume.analysisStatus !== "COMPLETED"
                    ? "Review my resume"
                    : "Find my fit"}
              </Button>
            </section>
            <div className="c-split">
              <div className="c-stack">
                <Panel
                  title="Recent applications"
                  action={
                    <Link className="c-text-link" to="/candidate/applications">
                      View all
                    </Link>
                  }
                >
                  <ApplicationTable applications={d.recentApplications} />
                </Panel>
                <Panel
                  title="Open roles to explore"
                  description="Recently posted opportunities you haven't applied for."
                  action={
                    <Link className="c-text-link" to="/candidate/jobs">
                      Browse jobs
                    </Link>
                  }
                >
                  {d.recommendedJobs?.length ? (
                    <div className="c-list">
                      {d.recommendedJobs.map((j) => (
                        <div className="c-list-row" key={j.id}>
                          <div>
                            <h3>
                              <Link to={"/candidate/jobs/" + j.id}>
                                {j.title}
                              </Link>
                            </h3>
                            <p className="c-muted">
                              {j.company?.name} ·{" "}
                              {j.location || "Location not specified"}
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            to={"/candidate/jobs/" + j.id}
                          >
                            View role
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <Empty
                      title="No new roles right now"
                      description="Check back for new opportunities as companies post them."
                    />
                  )}
                </Panel>
              </div>
              <div className="c-stack">
                <Panel
                  title="Your resume"
                  action={
                    d.defaultResume && (
                      <Badge value={d.defaultResume.analysisStatus} />
                    )
                  }
                >
                  {d.defaultResume ? (
                    <div className="c-stack">
                      <p>
                        {d.defaultResume.title ||
                          d.defaultResume.originalFileName}
                      </p>
                      <Score
                        label="AI resume score"
                        value={
                          d.defaultResume.analysisStatus === "COMPLETED"
                            ? d.defaultResume.aiScore
                            : null
                        }
                      />
                      <Button
                        variant="outline"
                        to={
                          "/candidate/ai-resume-audit?resumeId=" +
                          d.defaultResume.id
                        }
                      >
                        View resume audit
                      </Button>
                    </div>
                  ) : (
                    <Empty
                      title="Start with your story"
                      description="Add a PDF resume to unlock applications and career tools."
                      to="/candidate/resume-builder"
                      action="Add resume"
                    />
                  )}
                </Panel>
                <Panel title="Upcoming interviews">
                  {d.upcomingInterviews?.length ? (
                    <div className="c-list">
                      {d.upcomingInterviews.map((i) => (
                        <div className="c-list-row" key={i.id}>
                          <div>
                            <h3>
                              {i.application?.job?.title ||
                                i.job?.title ||
                                "Interview"}
                            </h3>
                            <p className="c-muted">
                              {formatDateTime(i.scheduledAt)} (your local time)
                            </p>
                            <Link
                              className="c-text-link"
                              to="/candidate/interviews"
                            >
                              Interview details
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="c-muted">
                      No upcoming interviews. Invitations from hiring teams will
                      appear here.
                    </p>
                  )}
                </Panel>
                <Panel
                  title="Make your profile count"
                  description="Help hiring teams understand your experience, location, and the work you want to do."
                >
                  <Button variant="outline" to="/candidate/profile">
                    Review profile
                  </Button>
                </Panel>
              </div>
            </div>
          </>
        )}
      </QueryState>
    </CandidateLayout>
  );
}

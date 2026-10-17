import { useQuery } from "@tanstack/react-query";
import RecruiterLayout from "../../components/recruiter/RecruiterLayout";
import { Panel, Button, QueryState } from "../../components/workspace/ui";
import dashboardApi from "../../api/dashboard.api";
import { QUERY_KEYS } from "../../config/constants";
import { stages, downloadCsv } from "../../utils/recruiter";
import { labelOf } from "../../utils/candidate";
import { formatDateTime } from "../../utils/format";
export default function Analytics() {
  const query = useQuery({
    queryKey: QUERY_KEYS.RECRUITER_DASHBOARD,
    queryFn: dashboardApi.getRecruiterDashboard,
  });
  const d = query.data;
  const total = Object.values(d?.stageCounts || {}).reduce(
    (sum, value) => sum + value,
    0,
  );
  const stats = d?.stats || {};
  const exportReport = () =>
    downloadCsv(
      [
        ["Metric", "Value"],
        ["Open jobs", stats.activeJobs],
        ["Closed jobs", stats.closedJobs],
        ["Applications", stats.totalApplications],
        ["Applications today", stats.applicationsToday],
        ["Applications in reporting window", stats.applicationsThisWeek],
        ["Interviews today excluding cancelled", stats.interviewsToday],
        [
          "Interviews in reporting window excluding cancelled",
          stats.interviewsThisWeek,
        ],
        ...stages.map((s) => [labelOf(s), d.stageCounts?.[s] ?? 0]),
        ["Window start", d.reporting?.from],
        ["Window end", d.reporting?.through],
        ["Reporting timezone", d.reporting?.timezone],
      ],
      "hirepilot-hiring-snapshot.csv",
    );
  return (
    <RecruiterLayout
      title="Understand where hiring stands."
      description="A grounded view of your open roles, application activity, and current pipeline."
      actions={
        <Button
          variant="outline"
          disabled={!d || query.isError || query.isFetching}
          onClick={exportReport}
        >
          Export snapshot
        </Button>
      }
    >
      <QueryState query={query}>
        {d && (
          <>
            <div className="c-stats">
              {[
                ["Open roles", stats.activeJobs],
                ["Closed roles", stats.closedJobs],
                ["Total applications", stats.totalApplications],
                ["Currently hired", d.stageCounts?.HIRED ?? 0],
              ].map(([label, value]) => (
                <div className="c-stat" key={label}>
                  <span>{label}</span>
                  <strong>{value ?? 0}</strong>
                </div>
              ))}
            </div>
            <div className="c-grid-2">
              <Panel
                title="Application stage distribution"
                description="Current stage counts. This is a snapshot, not a historical conversion funnel."
              >
                <div className="r-chart">
                  {stages.map((s) => {
                    const count = d.stageCounts?.[s] ?? 0;
                    return (
                      <div className="r-chart-row" key={s}>
                        <span>{labelOf(s)}</span>
                        <div className="r-chart-track" aria-hidden="true">
                          <div
                            className="r-chart-fill"
                            style={{
                              width: total ? (count / total) * 100 + "%" : "0%",
                            }}
                          />
                        </div>
                        <strong>{count}</strong>
                      </div>
                    );
                  })}
                </div>
                {!total && (
                  <p className="c-muted">
                    There are no applications to report yet.
                  </p>
                )}
              </Panel>
              <Panel
                title="Recent hiring activity"
                description="The reporting window includes today and the previous six calendar days."
              >
                <dl className="r-detail-list">
                  {[
                    ["Applications received today", stats.applicationsToday],
                    [
                      "Applications in reporting window",
                      stats.applicationsThisWeek,
                    ],
                    ["Interviews scheduled for today", stats.interviewsToday],
                    [
                      "Interviews in reporting window, through now",
                      stats.interviewsThisWeek,
                    ],
                  ].map(([label, value]) => (
                    <div className="c-list-row" key={label}>
                      <dt>{label}</dt>
                      <dd>{value ?? 0}</dd>
                    </div>
                  ))}
                </dl>
                <p className="c-muted r-section-gap">
                  Interview counts exclude cancelled interviews. Today's dates
                  use the reporting server's time zone.
                </p>
                {d.reporting && (
                  <p className="c-muted">
                    Window: {formatDateTime(d.reporting.from)} to{" "}
                    {formatDateTime(d.reporting.through)} (shown in your local
                    time). Reporting zone: {d.reporting.timezone}.
                  </p>
                )}
              </Panel>
            </div>
            <section className="c-feature">
              <div>
                <h2>Bring the numbers back to the role.</h2>
                <p>
                  Open a job overview to review its pipeline and the candidates
                  behind each stage.
                </p>
              </div>
              <Button to="/recruiter/jobs">View your jobs</Button>
            </section>
          </>
        )}
      </QueryState>
    </RecruiterLayout>
  );
}

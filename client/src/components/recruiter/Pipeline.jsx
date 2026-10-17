import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Badge, QueryState, Button } from "../workspace/ui";
import { stages } from "../../utils/recruiter";
import { labelOf } from "../../utils/candidate";
import applicationApi from "../../api/application.api";
import { QUERY_KEYS } from "../../config/constants";
function Column({ jobId, status, filters, total }) {
  const query = useQuery({
    queryKey: [
      ...QUERY_KEYS.JOB_APPLICATIONS,
      jobId,
      { ...filters, status, page: 1, limit: 5 },
    ],
    queryFn: () =>
      applicationApi.getJobApplications(jobId, {
        ...filters,
        status,
        page: 1,
        limit: 5,
      }),
  });
  const count = total ?? query.data?.pagination.totalApplications;
  return (
    <section
      className="r-pipeline-column"
      aria-label={labelOf(status) + " candidates"}
    >
      <header>
        <h3>{labelOf(status)}</h3>
        <span>{count ?? "—"}</span>
      </header>
      <QueryState query={query} label="Loading candidates">
        {query.data?.applications.map((a) => (
          <Link
            className="r-pipeline-card"
            to={"/recruiter/applicants/" + a.id}
            key={a.id}
          >
            <strong>{a.candidate?.user?.fullName || "Candidate"}</strong>
            <small>
              {a.candidate?.currentPosition ||
                a.candidate?.location ||
                "Profile available"}
            </small>
            <div className="c-actions">
              <Badge value={a.resume?.analysisStatus || "IDLE"} />
              {a.resume?.aiScore != null &&
                a.resume?.analysisStatus === "COMPLETED" && (
                  <span className="c-muted">
                    Resume {Math.round(a.resume.aiScore)}/100
                  </span>
                )}
            </div>
          </Link>
        ))}
        {query.data?.applications.length === 0 && (
          <p className="c-muted">No candidates in this stage.</p>
        )}
        {count > 5 && (
          <Button
            variant="outline"
            to={
              "/recruiter/applicants?" +
              new URLSearchParams({ jobId, ...filters, status, view: "list" })
            }
          >
            View all {count}
          </Button>
        )}
      </QueryState>
    </section>
  );
}
export default function Pipeline({ jobId, filters = {}, counts = {} }) {
  return (
    <div
      className="r-pipeline"
      role="region"
      aria-label="Candidate pipeline"
      tabIndex={0}
    >
      {stages.map((stage) => (
        <Column
          key={stage}
          jobId={jobId}
          status={stage}
          filters={filters}
          total={counts[stage]}
        />
      ))}
    </div>
  );
}

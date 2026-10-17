import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import CandidateLayout from "../../components/candidate/CandidateLayout";
import {
  Panel,
  Button,
  Badge,
  QueryState,
  Empty,
  ExternalLink,
} from "../../components/candidate/ui";
import applicationApi from "../../api/application.api";
import { QUERY_KEYS } from "../../config/constants";
import { formatDate } from "../../utils/format";
const guidance = {
  APPLIED:
    "Your application has been submitted. The hiring team will review it.",
  REVIEWING: "The hiring team is reviewing your application.",
  SHORTLISTED:
    "You've been shortlisted. Watch your notifications for the next step.",
  INTERVIEW_SCHEDULED:
    "An interview has been scheduled. Check Interviews for the details.",
  REJECTED:
    "The hiring team has decided not to move forward with this application.",
  HIRED: "The hiring team has marked your application as hired.",
};
export default function ApplicationDetail() {
  const { applicationId } = useParams();
  const query = useQuery({
    queryKey: [QUERY_KEYS.APPLICATION_DETAIL, applicationId],
    queryFn: () => applicationApi.getApplicationById(applicationId),
  });
  const a = query.data;
  return (
    <CandidateLayout
      title={a?.job?.title || "Application details"}
      description={a?.job?.company?.name}
      actions={
        <Button variant="outline" to="/candidate/applications">
          All applications
        </Button>
      }
    >
      <QueryState query={query}>
        {a ? (
          <div className="c-split">
            <Panel title="Application status">
              <Badge value={a.status} />
              <p className="c-prose" style={{ margin: "20px 0" }}>
                {guidance[a.status] ||
                  "Check back for updates from the hiring team."}
              </p>
              <dl className="c-detail-grid">
                <div>
                  <dt>Submitted</dt>
                  <dd>{formatDate(a.appliedAt)}</dd>
                </div>
                <div>
                  <dt>Resume used</dt>
                  <dd>
                    {a.resume?.title ||
                      a.resume?.originalFileName ||
                      "Resume unavailable"}
                  </dd>
                </div>
              </dl>
              <div className="c-actions" style={{ marginTop: 24 }}>
                <ExternalLink href={a.resume?.fileUrl}>
                  View submitted resume
                </ExternalLink>
                <Button variant="outline" to={"/candidate/jobs/" + a.job?.id}>
                  View role
                </Button>
              </div>
            </Panel>
            <Panel
              title="Stay ready"
              description="Interview schedules and application updates are available in your workspace."
            >
              <div className="c-stack">
                <Button variant="outline" to="/candidate/interviews">
                  View interviews
                </Button>
                <Button variant="outline" to="/candidate/notifications">
                  View notifications
                </Button>
              </div>
            </Panel>
          </div>
        ) : (
          <Empty
            title="Application unavailable"
            description="We couldn't find this application."
            to="/candidate/applications"
            action="All applications"
          />
        )}
      </QueryState>
    </CandidateLayout>
  );
}

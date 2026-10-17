import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import RecruiterLayout from "../../components/recruiter/RecruiterLayout";
import ApplicantActions from "../../components/recruiter/ApplicantActions";
import RecruiterNotes from "../../components/recruiter/RecruiterNotes";
import ResumeReview from "../../components/recruiter/ResumeReview";
import InterviewForm from "../../components/recruiter/InterviewForm";
import {
  Panel,
  Button,
  QueryState,
  Empty,
  Badge,
  ExternalLink,
  Notice,
} from "../../components/workspace/ui";
import applicationApi from "../../api/application.api";
import { QUERY_KEYS } from "../../config/constants";
import { formatDate, getInitials, formatDateTime } from "../../utils/format";
export default function ApplicantDetails() {
  const { applicationId } = useParams();
  return <Detail key={applicationId} applicationId={applicationId} />;
}
function Detail({ applicationId }) {
  const query = useQuery({
    queryKey: [QUERY_KEYS.APPLICATION_DETAIL, applicationId],
    queryFn: () => applicationApi.getApplicationById(applicationId),
  });
  const [schedule, setSchedule] = useState(false);
  const [copyMessage, setCopyMessage] = useState("");
  const a = query.data;
  const candidate = a?.candidate;
  const user = candidate?.user;
  return (
    <RecruiterLayout
      title={user?.fullName || "Applicant review"}
      description={a?.job?.title}
      actions={
        <Button
          variant="outline"
          to={
            "/recruiter/applicants" + (a?.job?.id ? "?jobId=" + a.job.id : "")
          }
        >
          Back to applicants
        </Button>
      }
    >
      <QueryState query={query}>
        {a ? (
          <>
            <Panel>
              <div className="r-profile-head">
                <span className="c-avatar">{getInitials(user?.fullName)}</span>
                <div>
                  <h2>{candidate.currentPosition || "Candidate profile"}</h2>
                  <p className="c-muted">
                    {candidate.location || "Location not provided"} · Applied{" "}
                    {formatDate(a.appliedAt)}
                  </p>
                </div>
                <Badge value={a.status} />
              </div>
            </Panel>
            {schedule && a.status === "SHORTLISTED" && !a.interview && (
              <InterviewForm
                applicationId={a.id}
                onSaved={() => setSchedule(false)}
                onCancel={() => setSchedule(false)}
              />
            )}
            <div className="c-split">
              <div className="c-stack">
                <Panel title="Experience & background">
                  <p className="c-prose">
                    {candidate.bio || "No professional summary provided."}
                  </p>
                  <dl className="c-detail-grid r-section-gap">
                    <div>
                      <dt>Experience</dt>
                      <dd>
                        {candidate.yearsOfExperience != null
                          ? candidate.yearsOfExperience + " years"
                          : "Not provided"}
                      </dd>
                    </div>
                    <div>
                      <dt>Expected annual salary (USD)</dt>
                      <dd>
                        {candidate.expectedSalary != null
                          ? candidate.expectedSalary.toLocaleString()
                          : "Not provided"}
                      </dd>
                    </div>
                    <div>
                      <dt>Email</dt>
                      <dd>{user?.email || "Not provided"}</dd>
                    </div>
                    <div>
                      <dt>Phone</dt>
                      <dd>{candidate.phone || "Not provided"}</dd>
                    </div>
                  </dl>
                  <div className="c-actions r-section-gap">
                    <ExternalLink href={candidate.linkedinUrl}>
                      LinkedIn
                    </ExternalLink>
                    <ExternalLink href={candidate.githubUrl}>
                      GitHub
                    </ExternalLink>
                    <ExternalLink href={candidate.portfolioUrl}>
                      Portfolio
                    </ExternalLink>
                    {user?.email && (
                      <Button
                        variant="outline"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(user.email);
                            setCopyMessage("Email copied.");
                          } catch {
                            setCopyMessage(
                              "Couldn't copy. Select the email address above to copy it manually.",
                            );
                          }
                        }}
                      >
                        Copy email
                      </Button>
                    )}
                  </div>
                  {copyMessage && <Notice tone="info">{copyMessage}</Notice>}
                </Panel>
                <ResumeReview resume={a.resume} job={a.job} />
                {a.interview && (
                  <Panel title="Interview">
                    <div className="c-actions">
                      <Badge value={a.interview.status} />
                      <span className="c-muted">
                        {formatDateTime(a.interview.scheduledAt)} (local time)
                      </span>
                    </div>
                    {a.interview.feedback && (
                      <p className="c-prose r-section-gap">
                        {a.interview.feedback}
                      </p>
                    )}
                    <Button
                      variant="outline"
                      to={"/recruiter/interviews?interviewId=" + a.interview.id}
                    >
                      View interview details
                    </Button>
                  </Panel>
                )}
              </div>
              <div className="c-stack">
                <ApplicantActions
                  application={a}
                  onSchedule={() => setSchedule(!schedule)}
                />
                <RecruiterNotes application={a} />
                <Panel title="Hiring for this role">
                  <Button variant="outline" to={"/recruiter/jobs/" + a.job?.id}>
                    Job overview
                  </Button>
                </Panel>
              </div>
            </div>
          </>
        ) : (
          <Empty
            title="Applicant unavailable"
            description="This application may no longer be accessible."
            to="/recruiter/applicants"
            action="View applicants"
          />
        )}
      </QueryState>
    </RecruiterLayout>
  );
}

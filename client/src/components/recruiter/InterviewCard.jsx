import { useState } from "react";
import {
  Panel,
  Button,
  Badge,
  ExternalLink,
  TextField,
  Notice,
} from "../workspace/ui";
import InterviewForm from "./InterviewForm";
import { useWorkspaceMutation, hiringKeys } from "../../hooks/useRecruiter";
import interviewApi from "../../api/interview.api";
import { formatDateTime } from "../../utils/format";
import { downloadInterview, labelOf } from "../../utils/candidate";
export default function InterviewCard({ interview: i }) {
  const [editing, setEditing] = useState(false);
  const [action, setAction] = useState("");
  const mutation = useWorkspaceMutation(
    (payload) => interviewApi.updateInterviewStatus(i.id, payload),
    hiringKeys,
    () => setAction(""),
  );
  const active = ["SCHEDULED", "RESCHEDULED"].includes(i.status);
  const applicant = i.application?.candidate?.user;
  return (
    <Panel
      title={applicant?.fullName || "Interview"}
      description={i.application?.job?.title}
      action={<Badge value={i.status} />}
    >
      <div className="c-stack">
        <dl className="c-detail-grid">
          <div>
            <dt>Scheduled (your local time)</dt>
            <dd>{formatDateTime(i.scheduledAt)}</dd>
          </div>
          <div>
            <dt>Format</dt>
            <dd>
              {labelOf(i.interviewType)} · {i.durationMinutes} minutes
            </dd>
          </div>
        </dl>
        {i.notes && <p className="c-prose">{i.notes}</p>}
        {i.feedback && (
          <div>
            <h3>Private feedback</h3>
            <p className="c-prose">{i.feedback}</p>
          </div>
        )}
        {i.score != null && (
          <p className="c-muted">Interview assessment: {i.score}/100</p>
        )}
        {i.cancelReason && (
          <p className="c-muted">Cancellation reason: {i.cancelReason}</p>
        )}
        <div className="c-actions">
          <Button
            variant="outline"
            to={"/recruiter/applicants/" + i.application?.id}
          >
            View applicant
          </Button>
          {active && (
            <>
              <ExternalLink
                href={i.meetingLink}
                className="hp-button hp-button-dark"
              >
                Open meeting
              </ExternalLink>
              <Button variant="outline" onClick={() => downloadInterview(i)}>
                Add to calendar
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setEditing(!editing);
                  setAction("");
                }}
              >
                Reschedule
              </Button>
            </>
          )}
        </div>
        {active && !editing && (
          <div className="c-actions">
            <Button
              variant="outline"
              disabled={mutation.isPending}
              onClick={() => setAction("COMPLETED")}
            >
              Complete interview
            </Button>
            <Button
              variant="outline"
              disabled={mutation.isPending}
              onClick={() => setAction("NO_SHOW")}
            >
              Mark no-show
            </Button>
            <button
              className="c-text-link"
              disabled={mutation.isPending}
              onClick={() => setAction("CANCELLED")}
            >
              Cancel interview
            </button>
          </div>
        )}
        {mutation.error && <Notice>{mutation.error.message}</Notice>}
        {action && active && (
          <form
            className="c-confirm c-stack"
            onSubmit={(e) => {
              e.preventDefault();
              const data = Object.fromEntries(new FormData(e.currentTarget));
              const payload = { status: action, ...data };
              if (data.score === "") delete payload.score;
              else if (data.score !== undefined)
                payload.score = Number(data.score);
              mutation.mutate(payload);
            }}
          >
            <h3>{labelOf(action)}: confirm outcome</h3>
            <p className="c-muted">
              This outcome is final. It does not automatically change the hiring
              decision.
            </p>
            {action === "COMPLETED" ? (
              <>
                <label className="c-field">
                  <span>Private interview feedback</span>
                  <textarea name="feedback" maxLength={2000} />
                </label>
                <TextField
                  name="score"
                  label="Assessment score (optional)"
                  type="number"
                  min={0}
                  max={100}
                />
              </>
            ) : action === "CANCELLED" ? (
              <TextField
                name="cancelReason"
                label="Cancellation reason (shared with candidate)"
                maxLength={500}
              />
            ) : null}
            <div className="c-actions">
              <Button type="submit" loading={mutation.isPending}>
                Confirm outcome
              </Button>
              <Button
                variant="outline"
                disabled={mutation.isPending}
                onClick={() => setAction("")}
              >
                Keep current status
              </Button>
            </div>
          </form>
        )}
        {editing && active && (
          <InterviewForm
            interview={i}
            onSaved={() => setEditing(false)}
            onCancel={() => setEditing(false)}
          />
        )}
      </div>
    </Panel>
  );
}

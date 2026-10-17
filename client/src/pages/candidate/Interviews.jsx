import { useState } from "react";
import { labelOf } from "../../utils/candidate";
import { useQuery } from "@tanstack/react-query";
import CandidateLayout from "../../components/candidate/CandidateLayout";
import {
  Panel,
  Button,
  Select,
  QueryState,
  Empty,
  Badge,
  Pager,
  ExternalLink,
} from "../../components/candidate/ui";
import { usePageParams } from "../../hooks/useCandidate";
import interviewApi from "../../api/interview.api";
import { QUERY_KEYS } from "../../config/constants";
import { formatDateTime } from "../../utils/format";
import { downloadInterview } from "../../utils/candidate";
const statuses = [
  "SCHEDULED",
  "RESCHEDULED",
  "COMPLETED",
  "CANCELLED",
  "NO_SHOW",
];
function InterviewCard({ interview: i }) {
  const [now] = useState(() => Date.now());
  const job = i.application?.job;
  const active = ["SCHEDULED", "RESCHEDULED"].includes(i.status);
  const validDate = !Number.isNaN(new Date(i.scheduledAt).getTime());
  return (
    <Panel
      title={job?.title || "Interview"}
      description={job?.company?.name}
      action={<Badge value={i.status} />}
    >
      <dl className="c-detail-grid">
        <div>
          <dt>Date & time (your local time)</dt>
          <dd>{formatDateTime(i.scheduledAt)}</dd>
        </div>
        <div>
          <dt>Duration</dt>
          <dd>{i.durationMinutes || 30} minutes</dd>
        </div>
        <div>
          <dt>Interview type</dt>
          <dd>{labelOf(i.interviewType)}</dd>
        </div>
        <div>
          <dt>Organizer's time zone</dt>
          <dd>{i.timezone || "Not specified"}</dd>
        </div>
      </dl>
      {i.notes && (
        <p className="c-prose" style={{ marginTop: 20 }}>
          {i.notes}
        </p>
      )}
      {i.cancelReason && (
        <p className="c-muted" style={{ marginTop: 20 }}>
          Cancellation reason: {i.cancelReason}
        </p>
      )}
      <div className="c-actions" style={{ marginTop: 24 }}>
        {active && (
          <>
            <ExternalLink
              href={i.meetingLink}
              className="hp-button hp-button-dark"
            >
              Open meeting
            </ExternalLink>
            {validDate && (
              <Button variant="outline" onClick={() => downloadInterview(i)}>
                Add to calendar
              </Button>
            )}
          </>
        )}
        {i.application?.id && (
          <Button
            variant="outline"
            to={"/candidate/applications/" + i.application.id}
          >
            View application
          </Button>
        )}
      </div>
      {active &&
        validDate &&
        new Date(i.scheduledAt).getTime() + (i.durationMinutes || 30) * 60000 <
          now && (
          <p className="c-muted" style={{ marginTop: 12 }}>
            The scheduled time has passed. The hiring team has not updated the
            status yet.
          </p>
        )}
    </Panel>
  );
}
export default function Interviews() {
  const { params, page, update } = usePageParams();
  const status = statuses.includes(params.get("status"))
    ? params.get("status")
    : "";
  const selectedId = params.get("interviewId");
  const query = useQuery({
    queryKey: [...QUERY_KEYS.INTERVIEWS, { page, status }],
    queryFn: () =>
      interviewApi.getInterviews({
        page,
        limit: 10,
        ...(status ? { status } : {}),
      }),
  });
  const detail = useQuery({
    queryKey: [...QUERY_KEYS.INTERVIEWS, "detail", selectedId],
    queryFn: () => interviewApi.getInterviewById(selectedId),
    enabled: !!selectedId,
  });
  return (
    <CandidateLayout
      title="Make the conversation count."
      description="Your interview schedule, meeting details, and calendar in one place."
    >
      {selectedId && (
        <Panel
          title="Selected interview"
          action={
            <Button
              variant="outline"
              onClick={() => update({ interviewId: null })}
            >
              Close details
            </Button>
          }
        >
          <QueryState query={detail}>
            {detail.data ? (
              <InterviewCard interview={detail.data} />
            ) : (
              <Empty
                title="Interview unavailable"
                description="This interview could not be found."
              />
            )}
          </QueryState>
        </Panel>
      )}
      <div className="c-actions">
        <Select
          label="Interview status"
          value={status}
          onChange={(e) => update({ status: e.target.value, page: null })}
        >
          <option value="">All interviews</option>
          {statuses.map((x) => (
            <option key={x} value={x}>
              {labelOf(x)}
            </option>
          ))}
        </Select>
        <span className="c-muted">
          All dates are shown in your local time zone.
        </span>
      </div>
      <QueryState query={query}>
        {query.data?.interviews.length ? (
          <div className="c-stack">
            {query.data.interviews.map((i) => (
              <InterviewCard key={i.id} interview={i} />
            ))}
          </div>
        ) : (
          <Panel>
            <Empty
              title={
                status
                  ? "No interviews with this status"
                  : "Your next conversation will appear here"
              }
              description="When a hiring team schedules an interview, you'll find the details here."
              to="/candidate/applications"
              action="View applications"
            />
          </Panel>
        )}
        {query.data && (
          <Pager
            pagination={query.data.pagination}
            page={page}
            onChange={(p) => update({ page: p })}
          />
        )}
      </QueryState>
    </CandidateLayout>
  );
}

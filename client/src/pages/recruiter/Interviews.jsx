import { useQuery } from "@tanstack/react-query";
import RecruiterLayout from "../../components/recruiter/RecruiterLayout";
import InterviewCard from "../../components/recruiter/InterviewCard";
import SchedulePicker from "../../components/recruiter/SchedulePicker";
import {
  Panel,
  Button,
  Select,
  QueryState,
  Empty,
  Pager,
  Notice,
} from "../../components/workspace/ui";
import { usePageParams } from "../../hooks/useRecruiter";
import interviewApi from "../../api/interview.api";
import { QUERY_KEYS } from "../../config/constants";
import { labelOf } from "../../utils/candidate";
const statuses = [
  "SCHEDULED",
  "RESCHEDULED",
  "COMPLETED",
  "CANCELLED",
  "NO_SHOW",
];
export default function Interviews() {
  const { params, page, update } = usePageParams();
  const status = statuses.includes(params.get("status"))
    ? params.get("status")
    : "";
  const interviewId = params.get("interviewId");
  const schedule = params.get("schedule") === "new";
  const query = useQuery({
    queryKey: [...QUERY_KEYS.INTERVIEWS, "recruiter", { status, page }],
    queryFn: () =>
      interviewApi.getInterviews({
        page,
        limit: 10,
        ...(status ? { status } : {}),
      }),
  });
  const selected = useQuery({
    queryKey: [...QUERY_KEYS.INTERVIEWS, "recruiter", interviewId],
    queryFn: () => interviewApi.getInterviewById(interviewId),
    enabled: !!interviewId,
  });
  return (
    <RecruiterLayout
      title="Better conversations, well organized."
      description="Schedule, prepare, and capture outcomes without losing the context of the role."
      actions={
        <Button
          onClick={() =>
            update({ schedule: schedule ? null : "new", saved: null })
          }
        >
          {schedule ? "Close scheduling" : "Schedule interview"}
        </Button>
      }
    >
      {params.get("saved") === "1" && (
        <Notice tone="success">
          Interview scheduled. The candidate's application has moved to the
          interview stage.
        </Notice>
      )}
      {schedule && (
        <SchedulePicker
          onSaved={() =>
            update({ schedule: null, saved: "1", page: null, status: null })
          }
          onCancel={() => update({ schedule: null })}
        />
      )}
      {interviewId && (
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
          <QueryState query={selected}>
            {selected.data ? (
              <InterviewCard key={selected.data.id} interview={selected.data} />
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
          {statuses.map((s) => (
            <option key={s} value={s}>
              {labelOf(s)}
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
              title="No interviews in this view"
              description="Start with a shortlisted candidate to schedule your next conversation."
              to="/recruiter/applicants"
              action="Review candidates"
            />
          </Panel>
        )}
        <Pager
          pagination={query.data?.pagination}
          page={page}
          onChange={(p) => update({ page: p })}
        />
      </QueryState>
    </RecruiterLayout>
  );
}

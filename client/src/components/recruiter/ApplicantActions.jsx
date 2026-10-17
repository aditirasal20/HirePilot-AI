import { useState } from "react";
import { Panel, Button, Select, Notice } from "../workspace/ui";
import { useWorkspaceMutation, hiringKeys } from "../../hooks/useRecruiter";
import { nextStages } from "../../utils/recruiter";
import { labelOf } from "../../utils/candidate";
import applicationApi from "../../api/application.api";
export default function ApplicantActions({ application, onSchedule }) {
  const [target, setTarget] = useState("");
  const [message, setMessage] = useState("");
  const mutation = useWorkspaceMutation(
    (status) => applicationApi.updateApplicationStatus(application.id, status),
    hiringKeys,
    (_, status) => {
      setTarget("");
      setMessage("Application moved to " + labelOf(status).toLowerCase() + ".");
    },
  );
  const allowed = nextStages[application.status] || [];
  return (
    <Panel
      title="Next action"
      description="Keep decisions grounded in the candidate's experience and your review."
    >
      <div className="c-stack">
        {message && <Notice tone="success">{message}</Notice>}
        {mutation.error && <Notice>{mutation.error.message}</Notice>}
        {allowed.length ? (
          <form
            className="c-stack"
            onSubmit={(e) => {
              e.preventDefault();
              if (target) mutation.mutate(target);
            }}
          >
            <Select
              label="Move application to"
              value={target}
              disabled={mutation.isPending}
              onChange={(e) => {
                setTarget(e.target.value);
                setMessage("");
              }}
            >
              <option value="">Choose a stage</option>
              {allowed.map((s) => (
                <option key={s} value={s}>
                  {labelOf(s)}
                </option>
              ))}
            </Select>
            {["HIRED", "REJECTED"].includes(target) && (
              <p className="c-muted">
                This is a final decision and the candidate will receive an
                update. Review carefully before confirming.
              </p>
            )}
            <Button
              type="submit"
              disabled={!target}
              loading={mutation.isPending}
            >
              {["HIRED", "REJECTED"].includes(target)
                ? "Confirm decision"
                : "Update stage"}
            </Button>
          </form>
        ) : (
          <p className="c-muted">
            This application has reached a final decision.
          </p>
        )}
        {application.status === "SHORTLISTED" && !application.interview && (
          <Button variant="outline" onClick={onSchedule}>
            Schedule interview
          </Button>
        )}
        {application.interview && (
          <Button
            variant="outline"
            to={"/recruiter/interviews?interviewId=" + application.interview.id}
          >
            Manage interview
          </Button>
        )}
      </div>
    </Panel>
  );
}

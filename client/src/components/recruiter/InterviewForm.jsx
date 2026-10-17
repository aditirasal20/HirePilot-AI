import { useState } from "react";
import { Panel, Button, TextField, Select, Notice } from "../workspace/ui";
import { useWorkspaceMutation, hiringKeys } from "../../hooks/useRecruiter";
import { localDateTime, interviewPayload } from "../../utils/recruiter";
import interviewApi from "../../api/interview.api";
export default function InterviewForm({
  applicationId,
  interview,
  onSaved,
  onCancel,
}) {
  const [form, setForm] = useState(() => ({
    interviewType: interview?.interviewType || "ONLINE",
    scheduledAt: localDateTime(interview?.scheduledAt),
    durationMinutes: interview?.durationMinutes || 30,
    meetingLink: interview?.meetingLink || "",
    notes: interview?.notes || "",
  }));
  const [error, setError] = useState("");
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  const mutation = useWorkspaceMutation(
    (payload) =>
      interview
        ? interviewApi.updateInterview(interview.id, payload)
        : interviewApi.scheduleInterview({ applicationId, ...payload }),
    hiringKeys,
    onSaved,
  );
  const field = (name, label, props = {}) => (
    <TextField
      label={label}
      value={form[name]}
      disabled={mutation.isPending}
      onChange={(e) => setForm({ ...form, [name]: e.target.value })}
      {...props}
    />
  );
  return (
    <Panel
      title={
        interview ? "Reschedule or update interview" : "Schedule interview"
      }
      description={
        "Enter the time in your local time zone: " +
        timezone +
        ". The candidate sees it in their own local time."
      }
    >
      <form
        className="c-stack"
        onSubmit={(e) => {
          e.preventDefault();
          if (mutation.isPending) return;
          try {
            const payload = interviewPayload(form);
            setError("");
            mutation.mutate(payload);
          } catch (err) {
            setError(err.message);
          }
        }}
      >
        <div className="c-grid-2">
          <Select
            label="Interview type"
            value={form.interviewType}
            disabled={mutation.isPending}
            onChange={(e) =>
              setForm({ ...form, interviewType: e.target.value })
            }
          >
            <option value="ONLINE">Online</option>
            <option value="ONSITE">Onsite</option>
            <option value="PHONE">Phone</option>
          </Select>
          {field("scheduledAt", "Date and time (" + timezone + ")", {
            type: "datetime-local",
            required: true,
          })}
          {field("durationMinutes", "Duration in minutes", {
            type: "number",
            min: 15,
            max: 480,
            step: 1,
            required: true,
          })}
          {field("meetingLink", "Meeting URL", {
            type: "url",
            pattern: "https?://.+",
            placeholder: "https://meet.example.com/...",
          })}
        </div>
        <label className="c-field">
          <span>Instructions for the candidate</span>
          <textarea
            value={form.notes}
            maxLength={1000}
            disabled={mutation.isPending}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="Include interviewer names, onsite address, phone details, or preparation instructions."
          />
        </label>
        {(error || mutation.error) && (
          <Notice>{error || mutation.error.message}</Notice>
        )}
        <div className="c-actions">
          <Button type="submit" loading={mutation.isPending}>
            {interview ? "Save interview" : "Schedule interview"}
          </Button>
          {onCancel && (
            <Button
              variant="outline"
              disabled={mutation.isPending}
              onClick={onCancel}
            >
              Cancel
            </Button>
          )}
        </div>
      </form>
    </Panel>
  );
}

export const stages = [
  "APPLIED",
  "REVIEWING",
  "SHORTLISTED",
  "INTERVIEW_SCHEDULED",
  "HIRED",
  "REJECTED",
];
export const nextStages = {
  APPLIED: ["REVIEWING", "SHORTLISTED", "REJECTED"],
  REVIEWING: ["SHORTLISTED", "REJECTED"],
  SHORTLISTED: ["REJECTED"],
  INTERVIEW_SCHEDULED: ["HIRED", "REJECTED"],
  HIRED: [],
  REJECTED: [],
};
export function recruiterDestination(n) {
  const id = encodeURIComponent(n.entityId || "");
  if (n.entityType === "Job")
    return "/recruiter/applicants" + (id ? "?jobId=" + id : "");
  if (n.entityType === "Application")
    return id ? "/recruiter/applicants/" + id : "/recruiter/applicants";
  if (n.entityType === "Interview")
    return "/recruiter/interviews" + (id ? "?interviewId=" + id : "");
  return null;
}
export function csvText(rows) {
  return (
    "\uFEFF" +
    rows
      .map((row) =>
        row
          .map((cell) => {
            let text = String(cell ?? "");
            if (/^[\s]*[=+@-]/.test(text)) text = "'" + text;
            return '"' + text.replaceAll('"', '""') + '"';
          })
          .join(","),
      )
      .join("\r\n")
  );
}
export function downloadCsv(rows, name) {
  const url = URL.createObjectURL(
    new Blob([csvText(rows)], { type: "text/csv;charset=utf-8" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function localDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const shifted = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return shifted.toISOString().slice(0, 16);
}
export function interviewPayload(form) {
  const date = new Date(form.scheduledAt);
  if (Number.isNaN(date.getTime()) || date <= new Date())
    throw new Error("Choose a valid interview time in the future.");
  const duration = Number(form.durationMinutes);
  if (!Number.isInteger(duration) || duration < 15 || duration > 480)
    throw new Error("Duration must be 15 to 480 minutes.");
  return {
    interviewType: form.interviewType,
    scheduledAt: date.toISOString(),
    durationMinutes: duration,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
    meetingLink: form.meetingLink.trim(),
    notes: form.notes.trim(),
  };
}

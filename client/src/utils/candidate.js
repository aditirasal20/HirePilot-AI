export function notificationDestination(notification) {
  const id = encodeURIComponent(notification.entityId || "");
  switch (notification.entityType) {
    case "Job":
      return id ? "/candidate/jobs/" + id : "/candidate/jobs";
    case "Application":
      return id ? "/candidate/applications/" + id : "/candidate/applications";
    case "Interview":
      return "/candidate/interviews" + (id ? "?interviewId=" + id : "");
    case "Resume":
      return "/candidate/ai-resume-audit" + (id ? "?resumeId=" + id : "");
    default:
      return null;
  }
}
const escapeCalendar = (value) =>
  String(value || "")
    .replaceAll("\\", "\\\\")
    .replaceAll("\n", "\\n")
    .replaceAll("\r", "")
    .replaceAll(";", "\\;")
    .replaceAll(",", "\\,");
const stamp = (value) =>
  new Date(value)
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");
export function interviewCalendar(interview, now = new Date()) {
  const job = interview.application?.job;
  const start = new Date(interview.scheduledAt);
  if (Number.isNaN(start.getTime()))
    throw new Error("This interview has no valid start time.");
  const end = new Date(
    start.getTime() + (interview.durationMinutes || 30) * 60000,
  );
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//HirePilot//Candidate Calendar//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    "UID:" + escapeCalendar(interview.id) + "@hirepilot",
    "DTSTAMP:" + stamp(now),
    "DTSTART:" + stamp(start),
    "DTEND:" + stamp(end),
    "SUMMARY:" +
      escapeCalendar("Interview: " + (job?.title || "Hiring conversation")),
    "DESCRIPTION:" +
      escapeCalendar(
        [job?.company?.name, interview.notes, interview.meetingLink]
          .filter(Boolean)
          .join("\n"),
      ),
    "LOCATION:" + escapeCalendar(interview.meetingLink || job?.location || ""),
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  // Fold long content lines at 75 UTF-8 octets as required by RFC 5545.
  return (
    lines
      .map((line) => {
        let out = "",
          current = "",
          bytes = 0;
        for (const char of line) {
          const size = new TextEncoder().encode(char).length;
          if (bytes + size > 75) {
            out += current + "\r\n";
            current = " ";
            bytes = 1;
          }
          current += char;
          bytes += size;
        }
        return out + current;
      })
      .join("\r\n") + "\r\n"
  );
}
export function downloadInterview(interview) {
  const url = URL.createObjectURL(
    new Blob([interviewCalendar(interview)], {
      type: "text/calendar;charset=utf-8",
    }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = "hirepilot-interview.ics";
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const names = {
  REVIEWING: "In review",
  INTERVIEW_SCHEDULED: "Interview scheduled",
  FULL_TIME: "Full time",
  PART_TIME: "Part time",
  NO_SHOW: "No show",
  IDLE: "Not analyzed",
  HIGH: "Strong fit",
  MEDIUM: "Potential fit",
  LOW: "Lower fit",
};
export const labelOf = (value) =>
  names[value] ||
  String(value || "Not available")
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/^./, (c) => c.toUpperCase());

export function validateResumeFile(file) {
  if (!file) return "Choose a PDF resume.";
  if (
    !file.name.toLowerCase().endsWith(".pdf") ||
    (file.type && file.type !== "application/pdf")
  )
    return "Please upload a PDF file.";
  if (file.size > 5 * 1024 * 1024) return "Your PDF must be 5 MB or smaller.";
  if (!file.size) return "This file is empty. Choose a different PDF.";
  return "";
}

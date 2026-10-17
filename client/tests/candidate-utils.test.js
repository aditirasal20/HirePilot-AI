import { describe, expect, it } from "vitest";
import {
  interviewCalendar,
  notificationDestination,
  validateResumeFile,
} from "../src/utils/candidate";
describe("Candidate utilities", () => {
  it("rejects oversized, empty and non-PDF resumes", () => {
    expect(
      validateResumeFile({
        name: "cv.pdf",
        type: "application/pdf",
        size: 6 * 1024 * 1024,
      }),
    ).toMatch(/5 MB/);
    expect(validateResumeFile({ name: "cv.docx", size: 10 })).toMatch(/PDF/);
    expect(validateResumeFile({ name: "cv.pdf", size: 0 })).toMatch(/empty/);
    expect(
      validateResumeFile({
        name: "cv.pdf",
        type: "application/pdf",
        size: 500,
      }),
    ).toBe("");
  });
  it("exports calendar start and end in UTC and escapes calendar control characters", () => {
    const value = interviewCalendar(
      {
        id: "i1",
        scheduledAt: "2026-09-19T15:00:00+05:30",
        durationMinutes: 45,
        application: {
          job: { title: "Design, research; lead", company: { name: "Test" } },
        },
        notes: "Line one\nLine two",
      },
      "2026-09-18T00:00:00Z",
    );
    expect(value).toContain("DTSTART:20260919T093000Z");
    expect(value).toContain("DTEND:20260919T101500Z");
    expect(value).toContain("Design\\, research\\; lead");
    expect(value).toContain("Line one\\nLine two");
  });
  it("folds long calendar lines safely with Unicode characters", () => {
    const value = interviewCalendar({
      id: "i1",
      scheduledAt: "2026-09-19T10:00:00Z",
      notes: "é".repeat(100),
    });
    for (const line of value.split("\r\n"))
      expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
    expect(value).toContain("\r\n ");
  });
  it("maps notifications only to supported local routes", () => {
    expect(
      notificationDestination({ entityType: "Application", entityId: "a1" }),
    ).toBe("/candidate/applications/a1");
    expect(
      notificationDestination({ entityType: "Interview", entityId: "i1" }),
    ).toBe("/candidate/interviews?interviewId=i1");
    expect(
      notificationDestination({ entityType: "Resume", entityId: "r1" }),
    ).toBe("/candidate/ai-resume-audit?resumeId=r1");
    expect(
      notificationDestination({
        entityType: "External",
        entityId: "https://example.com",
      }),
    ).toBeNull();
  });
});

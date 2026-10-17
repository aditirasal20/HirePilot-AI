import { describe, expect, it } from "vitest";
import {
  csvText,
  interviewPayload,
  recruiterDestination,
  nextStages,
} from "../src/utils/recruiter";
describe("Recruiter workflow utilities", () => {
  it("escapes exported values and neutralizes spreadsheet formulas", () => {
    const text = csvText([
      ["=SUM(1,2)", 'Alex "Candidate"', "@formula", "+12"],
    ]);
    expect(text).toContain('"\'=SUM(1,2)"');
    expect(text).toContain('"Alex ""Candidate"""');
    expect(text).toContain('"\'@formula"');
  });
  it("does not permit skipping a shortlist directly into an unscheduled interview", () => {
    expect(nextStages.SHORTLISTED).not.toContain("INTERVIEW_SCHEDULED");
    expect(nextStages.HIRED).toHaveLength(0);
    expect(nextStages.REJECTED).toHaveLength(0);
  });
  it("validates interview dates and duration before submission", () => {
    const base = {
      scheduledAt: "2030-09-19T10:00",
      durationMinutes: 30,
      interviewType: "ONLINE",
      meetingLink: "",
      notes: "",
    };
    expect(() => interviewPayload({ ...base, scheduledAt: "invalid" })).toThrow(
      /future/,
    );
    expect(() => interviewPayload({ ...base, durationMinutes: 5 })).toThrow(
      /15 to 480/,
    );
    expect(interviewPayload(base).timezone).toBe(
      Intl.DateTimeFormat().resolvedOptions().timeZone,
    );
  });
  it("routes recruiter notifications within the recruiter workspace", () => {
    expect(recruiterDestination({ entityType: "Job", entityId: "j1" })).toBe(
      "/recruiter/applicants?jobId=j1",
    );
    expect(
      recruiterDestination({ entityType: "Interview", entityId: "i1" }),
    ).toBe("/recruiter/interviews?interviewId=i1");
    expect(
      recruiterDestination({ entityType: "Unknown", entityId: "x" }),
    ).toBeNull();
  });
});

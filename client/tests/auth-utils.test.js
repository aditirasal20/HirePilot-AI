import { describe, expect, it } from "vitest";
import {
  getAuthDestination,
  registerSchema,
  loginSchema,
} from "../src/utils/auth";
describe("authentication validation and safe redirects", () => {
  it("normalizes registration without changing the password", () => {
    const parsed = registerSchema.parse({
      fullName: "  Alex Lee  ",
      email: " ALEX@EXAMPLE.COM ",
      password: "  secret value  ",
      role: "RECRUITER",
    });
    expect(parsed).toMatchObject({
      fullName: "Alex Lee",
      email: "alex@example.com",
      password: "  secret value  ",
    });
  });
  it("rejects invalid roles, short names and bcrypt-truncated passwords", () => {
    expect(
      registerSchema.safeParse({
        fullName: "Al",
        email: "bad",
        password: "short",
        role: "ADMIN",
      }).success,
    ).toBe(false);
    expect(
      registerSchema.safeParse({
        fullName: "Alex",
        email: "a@example.com",
        password: "\u00e9".repeat(37),
        role: "CANDIDATE",
      }).success,
    ).toBe(false);
    expect(
      loginSchema.safeParse({ email: "a@example.com", password: "" }).success,
    ).toBe(false);
  });
  it("preserves a same-role return URL including filters and hash", () => {
    expect(
      getAuthDestination("RECRUITER", {
        pathname: "/recruiter/applicants",
        search: "?jobId=123",
        hash: "#notes",
      }),
    ).toBe("/recruiter/applicants?jobId=123#notes");
  });
  it.each([
    "https://evil.test",
    "//evil.test",
    "/recruiter/jobs",
    "/login",
    "/candidate/../admin/dashboard",
    "/candidate/../../evil",
    "/candidate\\evil",
  ])("rejects unsafe or wrong-role redirect %s", (path) => {
    expect(getAuthDestination("CANDIDATE", path)).toBe("/candidate/dashboard");
  });
});

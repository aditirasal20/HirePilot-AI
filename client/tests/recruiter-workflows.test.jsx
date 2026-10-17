import { beforeEach, afterAll, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthContext } from "../src/contexts/AuthContext";
import appRouter from "../src/routes/router";
import jobApi from "../src/api/job.api";
import applicationApi from "../src/api/application.api";
import companyApi from "../src/api/company.api";
import dashboardApi from "../src/api/dashboard.api";
import interviewApi from "../src/api/interview.api";
import notificationApi from "../src/api/notification.api";
vi.mock("../src/api/job.api", () => ({
  default: {
    getMyJobs: vi.fn(),
    getPublicJobs: vi.fn(),
    getJobById: vi.fn(),
    createJob: vi.fn(),
    updateJob: vi.fn(),
    updateJobStatus: vi.fn(),
  },
}));
vi.mock("../src/api/application.api", () => ({
  default: {
    getJobApplications: vi.fn(),
    getApplicationById: vi.fn(),
    updateApplicationStatus: vi.fn(),
    updateApplicationNotes: vi.fn(),
  },
}));
vi.mock("../src/api/company.api", () => ({
  default: {
    getMyCompany: vi.fn(),
    createCompany: vi.fn(),
    updateCompany: vi.fn(),
  },
}));
vi.mock("../src/api/dashboard.api", () => ({
  default: { getRecruiterDashboard: vi.fn() },
}));
vi.mock("../src/api/interview.api", () => ({
  default: {
    getInterviews: vi.fn(),
    getInterviewById: vi.fn(),
    scheduleInterview: vi.fn(),
    updateInterview: vi.fn(),
    updateInterviewStatus: vi.fn(),
  },
}));
vi.mock("../src/api/notification.api", () => ({
  default: {
    getNotifications: vi.fn(),
    getUnreadCount: vi.fn(),
    markAsRead: vi.fn(),
    markAllAsRead: vi.fn(),
  },
}));
const recruiter = {
  id: "r1",
  fullName: "Morgan Lee",
  email: "morgan@example.com",
  role: "RECRUITER",
};
const job = {
  id: "j1",
  title: "Product designer",
  description: "Design useful products with our team.",
  location: "Remote",
  employmentType: "FULL_TIME",
  requiredSkills: ["Research", "Figma"],
  yearsOfExperience: 2,
  salaryMin: 50000,
  salaryMax: 80000,
  status: "OPEN",
  createdAt: "2026-09-19T10:00:00Z",
  recruiter: { userId: "r1" },
  _count: { applications: 1 },
};
const application = {
  id: "a1",
  job,
  status: "APPLIED",
  appliedAt: "2026-09-19T10:00:00Z",
  recruiterNotes: "Review portfolio",
  candidate: {
    user: { id: "c1", fullName: "Alex Candidate", email: "alex@example.com" },
    currentPosition: "Designer",
    location: "Bengaluru",
    yearsOfExperience: 3,
    bio: "I design software.",
  },
  resume: {
    title: "Design resume",
    aiScore: 85,
    analysisStatus: "COMPLETED",
    extractedSkills: ["Research"],
    summary: "Clear resume.",
    strengths: ["Clear experience"],
    weaknesses: [],
    fileUrl: "https://example.com/resume.pdf",
  },
};
const interview = {
  id: "i1",
  application: { ...application },
  scheduledAt: "2030-09-19T10:00:00Z",
  durationMinutes: 30,
  timezone: "UTC",
  interviewType: "ONLINE",
  status: "SCHEDULED",
  meetingLink: "https://example.com/meeting",
  notes: "Bring your portfolio.",
};
const auth = {
  user: recruiter,
  isAuthenticated: true,
  isLoading: false,
  sessionError: null,
  logout: vi.fn(),
  changePassword: vi.fn(),
};
function mount(entry) {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
  const router = createMemoryRouter(appRouter.routes, {
    initialEntries: [entry],
  });
  render(
    <AuthContext.Provider value={auth}>
      <QueryClientProvider client={client}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </AuthContext.Provider>,
  );
  return { router, client };
}
beforeEach(() => {
  for (const api of [
    jobApi,
    applicationApi,
    companyApi,
    dashboardApi,
    interviewApi,
    notificationApi,
  ])
    Object.values(api).forEach((fn) => fn.mockReset());
  auth.logout.mockReset().mockResolvedValue({});
  auth.changePassword.mockReset().mockResolvedValue({});
  localStorage.clear();
  vi.spyOn(window, "scrollTo").mockImplementation(() => {});
  Object.defineProperty(HTMLDialogElement.prototype, "close", {
    configurable: true,
    value: function () {
      this.removeAttribute("open");
    },
  });
  Object.defineProperty(HTMLDialogElement.prototype, "showModal", {
    configurable: true,
    value: function () {
      this.setAttribute("open", "");
    },
  });
  jobApi.getMyJobs.mockResolvedValue({
    jobs: [job],
    pagination: { totalJobs: 1, totalPages: 1 },
  });
  jobApi.getJobById.mockResolvedValue(job);
  jobApi.createJob.mockResolvedValue({ ...job, status: "DRAFT" });
  jobApi.updateJob.mockImplementation(async (id, payload) => ({
    ...job,
    ...payload,
    id,
    status: "DRAFT",
  }));
  jobApi.updateJobStatus.mockResolvedValue(job);
  applicationApi.getJobApplications.mockImplementation(
    async (id, params = {}) => ({
      job,
      applications:
        !params.status || params.status === "APPLIED" ? [application] : [],
      stageCounts: { APPLIED: 1 },
      pagination: {
        totalApplications:
          !params.status || params.status === "APPLIED" ? 1 : 0,
        totalPages: 1,
      },
    }),
  );
  applicationApi.getApplicationById.mockResolvedValue(application);
  applicationApi.updateApplicationStatus.mockResolvedValue({
    ...application,
    status: "REVIEWING",
  });
  applicationApi.updateApplicationNotes.mockResolvedValue(application);
  companyApi.getMyCompany.mockResolvedValue({
    id: "co1",
    name: "Test Company",
    website: "https://example.com",
    companySize: 20,
  });
  companyApi.updateCompany.mockImplementation(async (id, data) => ({
    id,
    ...data,
  }));
  companyApi.createCompany.mockImplementation(async (data) => ({
    id: "co1",
    ...data,
  }));
  dashboardApi.getRecruiterDashboard.mockResolvedValue({
    stats: {
      activeJobs: 1,
      closedJobs: 0,
      totalApplications: 1,
      applicationsToday: 1,
      applicationsThisWeek: 1,
      interviewsToday: 0,
      interviewsThisWeek: 0,
    },
    stageCounts: { APPLIED: 1 },
    recentApplications: [application],
    upcomingInterviews: [interview],
    reporting: {
      from: "2026-09-13T00:00:00Z",
      through: "2026-09-19T10:00:00Z",
      timezone: "UTC",
    },
  });
  interviewApi.getInterviews.mockResolvedValue({
    interviews: [interview],
    pagination: { totalPages: 1, totalInterviews: 1 },
  });
  interviewApi.getInterviewById.mockResolvedValue(interview);
  interviewApi.scheduleInterview.mockResolvedValue(interview);
  interviewApi.updateInterview.mockResolvedValue(interview);
  interviewApi.updateInterviewStatus.mockResolvedValue(interview);
  notificationApi.getNotifications.mockResolvedValue({
    notifications: [
      {
        id: "n1",
        title: "Hiring update",
        message: "New application received",
        isRead: false,
        entityType: "Application",
        entityId: "a1",
        createdAt: "2026-09-19T10:00:00Z",
      },
    ],
    pagination: { totalPages: 1 },
  });
  notificationApi.getUnreadCount.mockResolvedValue(1);
  notificationApi.markAsRead.mockResolvedValue({});
  notificationApi.markAllAsRead.mockResolvedValue({});
});
afterAll(() => appRouter.dispose());
describe("Recruiter route coverage", () => {
  it.each([
    ["/recruiter/dashboard", "Recent applications"],
    ["/recruiter/jobs", "matching jobs"],
    ["/recruiter/jobs/create", "Define the opportunity"],
    ["/recruiter/jobs/j1", "Role essentials"],
    ["/recruiter/jobs/j1/edit", "Edit role details"],
    ["/recruiter/applicants?jobId=j1", "Your review workspace"],
    ["/recruiter/applicants/a1", "Private review notes"],
    ["/recruiter/interviews", "Bring your portfolio."],
    ["/recruiter/analytics", "Application stage distribution"],
    ["/recruiter/company", "Your company profile"],
    ["/recruiter/notifications", "Hiring update"],
    ["/recruiter/settings", "Change password"],
  ])("renders %s inside the shared workspace", async (path, content) => {
    mount(path);
    expect(await screen.findByText(new RegExp(content))).toBeInTheDocument();
    expect(screen.getByRole("main")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Sign out" }),
    ).toBeInTheDocument();
    expect(document.title).toContain("HirePilot AI");
  });
  it("searches jobs from the shared navigation and keeps recruiter destinations", async () => {
    const user = userEvent.setup();
    const { router } = mount("/recruiter/dashboard");
    await screen.findByText("Recent applications");
    await user.type(
      screen.getByRole("searchbox", { name: "Search jobs" }),
      "designer",
    );
    await user.click(
      within(screen.getByRole("search")).getByRole("button", {
        name: "Search",
      }),
    );
    await waitFor(() =>
      expect(
        router.state.location.pathname + router.state.location.search,
      ).toBe("/recruiter/jobs?search=designer"),
    );
    expect(jobApi.getMyJobs).toHaveBeenCalledWith(
      expect.objectContaining({ search: "designer" }),
    );
  });
  it("opens and closes the mobile navigation and exposes sign-out", async () => {
    const user = userEvent.setup();
    mount("/recruiter/settings");
    await user.click(screen.getByRole("button", { name: "Open navigation" }));
    const dialog = screen.getByRole("dialog");
    expect(
      within(dialog).getByRole("button", { name: "Sign out" }),
    ).toBeInTheDocument();
    await user.click(
      within(dialog).getByRole("button", { name: "Close navigation" }),
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Sign out" }));
    expect(auth.logout).toHaveBeenCalledTimes(1);
  });
});
describe("Recruiter product workflows", () => {
  it("requires a company before allowing job creation", async () => {
    companyApi.getMyCompany.mockRejectedValue(
      Object.assign(new Error("No company assigned yet."), { status: 404 }),
    );
    mount("/recruiter/jobs/create");
    expect(
      await screen.findByText("Introduce your company first"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Set up company" }),
    ).toHaveAttribute("href", "/recruiter/company");
  });
  it("preserves a created draft when publishing fails and reuses it on retry", async () => {
    const user = userEvent.setup();
    jobApi.updateJobStatus
      .mockRejectedValueOnce(new Error("Publishing unavailable"))
      .mockResolvedValue(job);
    mount("/recruiter/jobs/create");
    await user.type(
      await screen.findByLabelText("Job title"),
      "Product designer",
    );
    await user.type(screen.getByLabelText("Location"), "Remote");
    await user.type(
      screen.getByLabelText("Job description"),
      "Design useful products with our team.",
    );
    await user.type(
      screen.getByLabelText("Minimum annual salary (USD)"),
      "50000",
    );
    await user.type(
      screen.getByLabelText("Maximum annual salary (USD)"),
      "80000",
    );
    await user.type(
      screen.getByLabelText("Required skills"),
      "Research, Figma",
    );
    await user.click(screen.getByRole("button", { name: "Publish job" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Your draft is saved.",
    );
    await user.click(screen.getByRole("button", { name: "Publish job" }));
    await waitFor(() =>
      expect(jobApi.updateJobStatus).toHaveBeenCalledTimes(2),
    );
    expect(jobApi.createJob).toHaveBeenCalledTimes(1);
    expect(jobApi.updateJob).toHaveBeenCalledTimes(1);
  });
  it("blocks invalid salary ranges before creating a job", async () => {
    const user = userEvent.setup();
    mount("/recruiter/jobs/j1/edit");
    const min = await screen.findByLabelText("Minimum annual salary (USD)");
    await user.clear(min);
    await user.type(min, "90000");
    await user.click(screen.getByRole("button", { name: "Save changes" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Maximum salary must be at least the minimum salary.",
    );
    expect(jobApi.updateJob).not.toHaveBeenCalled();
  });
  it("rejects editing another recruiter's public job", async () => {
    jobApi.getJobById.mockResolvedValue({
      ...job,
      recruiter: { userId: "other" },
    });
    mount("/recruiter/jobs/j1/edit");
    expect(
      await screen.findByText("You can only edit your own job postings."),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText("Job title")).not.toBeInTheDocument();
  });
  it("confirms closing a role before calling the status API", async () => {
    const user = userEvent.setup();
    mount("/recruiter/jobs/j1");
    await user.click(await screen.findByRole("button", { name: "Close role" }));
    expect(jobApi.updateJobStatus).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Confirm close" }));
    await waitFor(() =>
      expect(jobApi.updateJobStatus).toHaveBeenCalledWith("j1", "CLOSED"),
    );
  });
  it("applies candidate search and score filters through the API", async () => {
    const user = userEvent.setup();
    const { router } = mount("/recruiter/applicants?jobId=j1");
    await user.type(
      await screen.findByLabelText("Candidate name or email"),
      "Alex",
    );
    await user.type(screen.getByLabelText("Minimum resume score"), "70");
    await user.click(screen.getByRole("button", { name: "Apply filters" }));
    await waitFor(() =>
      expect(applicationApi.getJobApplications).toHaveBeenCalledWith(
        "j1",
        expect.objectContaining({ search: "Alex", minScore: "70" }),
      ),
    );
    expect(router.state.location.search).toContain("search=Alex");
  });
  it("loads a real per-stage pipeline and does not fabricate candidate cards", async () => {
    mount("/recruiter/applicants?jobId=j1&view=board");
    const region = await screen.findByRole("region", {
      name: "Candidate pipeline",
    });
    expect(
      await within(region).findByRole("link", { name: /Alex Candidate/ }),
    ).toHaveAttribute("href", "/recruiter/applicants/a1");
    expect(
      await within(region).findAllByText("No candidates in this stage."),
    ).toHaveLength(5);
  });
  it("persists and restores a named view scoped to the current recruiter", async () => {
    const user = userEvent.setup();
    const { router } = mount("/recruiter/applicants?jobId=j1&status=APPLIED");
    await user.click(
      await screen.findByRole("button", { name: "Save current view" }),
    );
    await user.type(screen.getByLabelText("View name"), "Needs review");
    await user.click(screen.getByRole("button", { name: "Save view" }));
    expect(
      JSON.parse(localStorage.getItem("hirepilot:recruiter:views:r1"))[0]
        .filters.status,
    ).toBe("APPLIED");
    await user.selectOptions(
      screen.getByLabelText("Application stage"),
      "SHORTLISTED",
    );
    await user.click(screen.getByRole("button", { name: "Needs review" }));
    await waitFor(() =>
      expect(router.state.location.search).toContain("status=APPLIED"),
    );
  });
  it("requires an explicit stage decision and uses supported transitions", async () => {
    const user = userEvent.setup();
    mount("/recruiter/applicants/a1");
    const select = await screen.findByLabelText("Move application to");
    expect(
      within(select).queryByRole("option", { name: "Hired" }),
    ).not.toBeInTheDocument();
    await user.selectOptions(select, "REJECTED");
    expect(applicationApi.updateApplicationStatus).not.toHaveBeenCalled();
    expect(screen.getByText(/This is a final decision/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Confirm decision" }));
    await waitFor(() =>
      expect(applicationApi.updateApplicationStatus).toHaveBeenCalledWith(
        "a1",
        "REJECTED",
      ),
    );
  });
  it("saves private recruiter notes using the existing API", async () => {
    const user = userEvent.setup();
    mount("/recruiter/applicants/a1");
    const notes = await screen.findByLabelText("Notes");
    await user.clear(notes);
    await user.type(notes, "Discuss research process");
    await user.click(screen.getByRole("button", { name: "Save notes" }));
    expect(await screen.findByText("Review notes saved.")).toBeInTheDocument();
    expect(applicationApi.updateApplicationNotes).toHaveBeenCalledWith(
      "a1",
      "Discuss research process",
    );
  });
  it("schedules a shortlisted applicant in the actual local timezone", async () => {
    applicationApi.getApplicationById.mockResolvedValue({
      ...application,
      status: "SHORTLISTED",
    });
    const user = userEvent.setup();
    mount("/recruiter/applicants/a1");
    await user.click(
      await screen.findByRole("button", { name: "Schedule interview" }),
    );
    const datetime = screen.getByLabelText(/Date and time/);
    await user.type(datetime, "2030-09-19T15:00");
    await user.click(
      screen.getAllByRole("button", { name: "Schedule interview" })[0],
    );
    await waitFor(() =>
      expect(interviewApi.scheduleInterview).toHaveBeenCalledWith(
        expect.objectContaining({
          applicationId: "a1",
          scheduledAt: new Date("2030-09-19T15:00").toISOString(),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }),
      ),
    );
  });
  it("records completed interview feedback and score", async () => {
    const user = userEvent.setup();
    mount("/recruiter/interviews");
    await user.click(
      await screen.findByRole("button", { name: "Complete interview" }),
    );
    await user.type(
      screen.getByLabelText("Private interview feedback"),
      "Strong research examples",
    );
    await user.type(screen.getByLabelText("Assessment score (optional)"), "82");
    await user.click(screen.getByRole("button", { name: "Confirm outcome" }));
    await waitFor(() =>
      expect(interviewApi.updateInterviewStatus).toHaveBeenCalledWith("i1", {
        status: "COMPLETED",
        feedback: "Strong research examples",
        score: 82,
      }),
    );
  });
  it("clears company fields rather than silently retaining old values", async () => {
    const user = userEvent.setup();
    mount("/recruiter/company");
    await user.clear(await screen.findByLabelText("Website"));
    await user.click(screen.getByRole("button", { name: "Save company" }));
    expect(
      await screen.findByText("Company details saved."),
    ).toBeInTheDocument();
    expect(companyApi.updateCompany).toHaveBeenCalledWith(
      "co1",
      expect.objectContaining({ website: null }),
    );
  });
  it("uses recruiter destinations for inbox links", async () => {
    mount("/recruiter/notifications");
    expect(
      await screen.findByRole("link", { name: "View details" }),
    ).toHaveAttribute("href", "/recruiter/applicants/a1");
  });
  it("replaces unsupported billing and auto-rejection controls with real security settings", async () => {
    mount("/recruiter/settings");
    expect(screen.getByLabelText("Account type")).toHaveValue("Recruiter");
    expect(screen.queryByText("PRO")).not.toBeInTheDocument();
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Manage company" }),
    ).toHaveAttribute("href", "/recruiter/company");
  });
  it("renders backend errors with recovery instead of invented dashboard statistics", async () => {
    dashboardApi.getRecruiterDashboard.mockRejectedValue(
      new Error("Service unavailable"),
    );
    mount("/recruiter/dashboard");
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Service unavailable",
    );
    expect(
      screen.getByRole("button", { name: "Try again" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Current pipeline")).not.toBeInTheDocument();
  });
});

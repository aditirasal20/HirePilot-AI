import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthContext } from "../src/contexts/AuthContext";
import Dashboard from "../src/pages/candidate/Dashboard";
import Jobs from "../src/pages/candidate/Jobs";
import JobDetail from "../src/pages/candidate/JobDetail";
import Applications from "../src/pages/candidate/Applications";
import ApplicationDetail from "../src/pages/candidate/ApplicationDetail";
import Resume from "../src/pages/candidate/Resume";
import ResumeAI from "../src/pages/candidate/ResumeAI";
import JobMatching from "../src/pages/candidate/JobMatching";
import Interviews from "../src/pages/candidate/Interviews";
import Notifications from "../src/pages/candidate/Notifications";
import Profile from "../src/pages/candidate/Profile";
import Settings from "../src/pages/candidate/Settings";
import CandidateAlias from "../src/routes/CandidateAlias";
import jobApi from "../src/api/job.api";
import applicationApi from "../src/api/application.api";
import resumeApi from "../src/api/resume.api";
import resumeAIApi from "../src/api/resumeAI.api";
import jobMatchingApi from "../src/api/jobMatching.api";
import interviewApi from "../src/api/interview.api";
import notificationApi from "../src/api/notification.api";
import candidateProfileApi from "../src/api/candidateProfile.api";
import dashboardApi from "../src/api/dashboard.api";
vi.mock("../src/api/job.api", () => ({
  default: { getPublicJobs: vi.fn(), getJobById: vi.fn() },
}));
vi.mock("../src/api/application.api", () => ({
  default: {
    getMyApplications: vi.fn(),
    getApplicationById: vi.fn(),
    applyToJob: vi.fn(),
  },
}));
vi.mock("../src/api/resume.api", () => ({
  default: {
    getMyResumes: vi.fn(),
    uploadResume: vi.fn(),
    updateResume: vi.fn(),
    setDefaultResume: vi.fn(),
    deleteResume: vi.fn(),
  },
}));
vi.mock("../src/api/resumeAI.api", () => ({
  default: { getAnalysis: vi.fn(), startAnalysis: vi.fn() },
}));
vi.mock("../src/api/jobMatching.api", () => ({
  default: { getMyMatches: vi.fn(), analyzeJob: vi.fn(), deleteMatch: vi.fn() },
}));
vi.mock("../src/api/interview.api", () => ({
  default: { getInterviews: vi.fn(), getInterviewById: vi.fn() },
}));
vi.mock("../src/api/notification.api", () => ({
  default: {
    getNotifications: vi.fn(),
    getUnreadCount: vi.fn(),
    markAsRead: vi.fn(),
    markAllAsRead: vi.fn(),
  },
}));
vi.mock("../src/api/candidateProfile.api", () => ({
  default: {
    getMyCandidateProfile: vi.fn(),
    updateMyCandidateProfile: vi.fn(),
  },
}));
vi.mock("../src/api/dashboard.api", () => ({
  default: { getCandidateDashboard: vi.fn() },
}));
const job = {
  id: "j1",
  title: "Product designer",
  company: { name: "Test company" },
  description: "Design useful products.",
  status: "OPEN",
  employmentType: "FULL_TIME",
  location: "Remote",
  requiredSkills: ["Research"],
  createdAt: "2026-09-19T10:00:00Z",
};
const resume = {
  id: "r1",
  title: "Design resume",
  isDefault: true,
  analysisStatus: "COMPLETED",
  extractedSkills: ["Research"],
  createdAt: "2026-09-18T10:00:00Z",
};
const auth = {
  user: { fullName: "Alex Lee", email: "alex@example.com", role: "CANDIDATE" },
  changePassword: vi.fn(),
  logout: vi.fn(),
};
function mount(component, entry = "/candidate/test", path = "/candidate/*") {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
  const router = createMemoryRouter(
    [
      { path, element: component },
      { path: "/elsewhere", element: <p>Another page</p> },
    ],
    { initialEntries: [entry] },
  );
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
  vi.clearAllMocks();
  jobApi.getPublicJobs.mockResolvedValue({
    jobs: [job],
    pagination: { totalPages: 1, totalJobs: 1 },
  });
  jobApi.getJobById.mockResolvedValue(job);
  applicationApi.getMyApplications.mockResolvedValue({
    applications: [],
    pagination: { totalPages: 1 },
  });
  applicationApi.getApplicationById.mockResolvedValue({
    id: "a1",
    job,
    resume,
    status: "REVIEWING",
    appliedAt: "2026-09-18T10:00:00Z",
  });
  applicationApi.applyToJob.mockResolvedValue({ application: { id: "a1" } });
  resumeApi.getMyResumes.mockResolvedValue([resume]);
  resumeAIApi.getAnalysis.mockResolvedValue({ analysisStatus: "IDLE" });
  resumeAIApi.startAnalysis.mockResolvedValue({});
  jobMatchingApi.getMyMatches.mockResolvedValue([]);
  jobMatchingApi.analyzeJob.mockResolvedValue({ cached: false });
  interviewApi.getInterviews.mockResolvedValue({
    interviews: [],
    pagination: { totalPages: 1 },
  });
  notificationApi.getNotifications.mockResolvedValue({
    notifications: [],
    pagination: { totalPages: 1 },
  });
  notificationApi.getUnreadCount.mockResolvedValue(0);
  notificationApi.markAllAsRead.mockResolvedValue({});
  candidateProfileApi.getMyCandidateProfile.mockResolvedValue({
    location: "Remote",
    bio: "I design products.",
  });
  candidateProfileApi.updateMyCandidateProfile.mockImplementation(
    async (x) => x,
  );
  dashboardApi.getCandidateDashboard.mockResolvedValue({
    stats: {
      applications: 2,
      reviewing: 1,
      shortlisted: 0,
      interviewScheduled: 0,
    },
    defaultResume: resume,
    recentApplications: [],
    recommendedJobs: [job],
    upcomingInterviews: [],
  });
  auth.changePassword.mockResolvedValue({});
});
describe("Candidate workflows", () => {
  it("uses honest dashboard labels and real counts", async () => {
    mount(<Dashboard />);
    expect(
      await screen.findByText("Open roles to explore"),
    ).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.queryByText(/AI Matches/)).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Find my fit" })).toHaveAttribute(
      "href",
      "/candidate/job-matching",
    );
  });
  it("clears the search and every job filter together", async () => {
    const user = userEvent.setup();
    const { router } = mount(
      <Jobs />,
      "/candidate/jobs?search=design&location=Remote&experience=2",
    );
    await screen.findByRole("heading", { name: job.title });
    await user.click(screen.getByRole("button", { name: "Clear filters" }));
    await waitFor(() => expect(router.state.location.search).toBe(""));
    expect(screen.getByLabelText("Role or keyword")).toHaveValue("");
    expect(screen.getByLabelText("Location")).toHaveValue("");
  });
  it("submits the chosen resume and exposes application tracking", async () => {
    resumeApi.getMyResumes.mockResolvedValue([
      resume,
      { ...resume, id: "r2", title: "Alternate resume", isDefault: false },
    ]);
    const user = userEvent.setup();
    mount(<JobDetail />, "/candidate/jobs/j1", "/candidate/jobs/:jobId");
    await user.selectOptions(
      await screen.findByLabelText("Application resume"),
      "r2",
    );
    await user.click(
      screen.getByRole("button", { name: "Submit application" }),
    );
    await waitFor(() =>
      expect(applicationApi.applyToJob).toHaveBeenCalledWith({
        jobId: "j1",
        resumeId: "r2",
      }),
    );
    expect(
      await screen.findByText("Your application has been sent."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Track application" }),
    ).toHaveAttribute("href", "/candidate/applications");
  });
  it("provides an upload path instead of silently failing without a resume", async () => {
    resumeApi.getMyResumes.mockResolvedValue([]);
    mount(<JobDetail />, "/candidate/jobs/j1", "/candidate/jobs/:jobId");
    expect(await screen.findByText("Add a resume first")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Upload resume" })).toHaveAttribute(
      "href",
      "/candidate/resume-builder",
    );
    expect(applicationApi.applyToJob).not.toHaveBeenCalled();
  });
  it("recovers from a duplicate application with a tracking link", async () => {
    applicationApi.applyToJob.mockRejectedValue(
      Object.assign(new Error("Already applied"), { status: 409 }),
    );
    const user = userEvent.setup();
    mount(<JobDetail />, "/candidate/jobs/j1", "/candidate/jobs/:jobId");
    await user.click(
      await screen.findByRole("button", { name: "Submit application" }),
    );
    expect(
      await screen.findByText("You have already applied for this role."),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Submit application" }),
    ).not.toBeInTheDocument();
  });
  it("prevents applications to closed jobs", async () => {
    jobApi.getJobById.mockResolvedValue({ ...job, status: "CLOSED" });
    mount(<JobDetail />, "/candidate/jobs/j1", "/candidate/jobs/:jobId");
    expect(
      await screen.findByText("This role is no longer accepting applications."),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Submit application" }),
    ).not.toBeInTheDocument();
  });
  it("shows appliedAt from the API and links to application details", async () => {
    applicationApi.getMyApplications.mockResolvedValue({
      applications: [
        {
          id: "a1",
          job,
          status: "REVIEWING",
          appliedAt: "2026-09-18T10:00:00Z",
        },
      ],
      pagination: {},
    });
    mount(<Applications />);
    expect(await screen.findByText("Sep 18, 2026")).toBeInTheDocument();
    expect(
      screen.getByRole("link", {
        name: "View application for Product designer",
      }),
    ).toHaveAttribute("href", "/candidate/applications/a1");
  });
  it("renders candidate application details without private assessment fields", async () => {
    applicationApi.getApplicationById.mockResolvedValue({
      id: "a1",
      job,
      resume,
      status: "SHORTLISTED",
      appliedAt: "2026-09-18T10:00:00Z",
      recruiterNotes: "Private assessment",
    });
    mount(
      <ApplicationDetail />,
      "/candidate/applications/a1",
      "/candidate/applications/:applicationId",
    );
    expect(
      await screen.findByText(/You've been shortlisted/),
    ).toBeInTheDocument();
    expect(screen.queryByText("Private assessment")).not.toBeInTheDocument();
  });
  it("validates the upload before making an API request", async () => {
    const user = userEvent.setup();
    mount(<Resume />);
    await screen.findByText("Your resumes");
    await user.type(
      screen.getByLabelText("Give this version a name"),
      "New resume",
    );
    await user.click(screen.getByRole("button", { name: "Upload resume" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Choose a PDF resume.",
    );
    expect(resumeApi.uploadResume).not.toHaveBeenCalled();
    expect(screen.getByText("Research")).toBeInTheDocument();
  });
  it("shows failed audits as recoverable errors rather than completed reports", async () => {
    resumeAIApi.getAnalysis.mockResolvedValue({
      analysisStatus: "FAILED",
      aiScore: 0,
    });
    mount(<ResumeAI />);
    expect(
      await screen.findByText("The audit couldn't finish"),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Run AI audit" })).toBeEnabled();
    expect(screen.queryByText("ATS score")).not.toBeInTheDocument();
  });
  it("disables audit submission while the request is pending", async () => {
    resumeAIApi.startAnalysis.mockImplementation(() => new Promise(() => {}));
    const user = userEvent.setup();
    mount(<ResumeAI />);
    const button = await screen.findByRole("button", { name: "Run AI audit" });
    await waitFor(() => expect(button).toBeEnabled());
    await user.click(button);
    expect(button).toBeDisabled();
    expect(resumeAIApi.startAnalysis).toHaveBeenCalledTimes(1);
  });
  it("guides candidates without an analyzed resume to the audit workflow", async () => {
    resumeApi.getMyResumes.mockResolvedValue([
      { ...resume, analysisStatus: "IDLE" },
    ]);
    mount(<JobMatching />);
    expect(
      await screen.findByRole("link", { name: "Audit my resume" }),
    ).toHaveAttribute("href", "/candidate/ai-resume-audit");
  });
  it("uses an existing cached match without claiming a new analysis is queued", async () => {
    jobMatchingApi.analyzeJob.mockResolvedValue({
      cached: true,
      status: "COMPLETED",
    });
    const user = userEvent.setup();
    mount(<JobMatching />, "/candidate/job-matching?jobId=j1&resumeId=r1");
    const button = await screen.findByRole("button", {
      name: "Compare resume and role",
    });
    await waitFor(() => expect(button).toBeEnabled());
    await user.click(button);
    expect(
      await screen.findByText("Your existing match report is available below."),
    ).toBeInTheDocument();
  });
  it("allows retrying a failed match with the original job and resume", async () => {
    jobMatchingApi.getMyMatches.mockResolvedValue([
      { id: "m1", job, jobId: "j1", resumeId: "r1", analysisStatus: "FAILED" },
    ]);
    const user = userEvent.setup();
    mount(<JobMatching />);
    await user.click(
      await screen.findByRole("button", { name: "Retry analysis" }),
    );
    await waitFor(() =>
      expect(jobMatchingApi.analyzeJob).toHaveBeenCalledWith({
        jobId: "j1",
        resumeId: "r1",
        refresh: false,
      }),
    );
  });
  it("supports empty interviews without inventing an upcoming schedule", async () => {
    mount(<Interviews />);
    expect(
      await screen.findByText("Your next conversation will appear here"),
    ).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "No show" })).toBeInTheDocument();
  });
  it("marks all notifications read using the global unread count", async () => {
    notificationApi.getUnreadCount.mockResolvedValue(12);
    notificationApi.getNotifications.mockResolvedValue({
      notifications: [
        {
          id: "n1",
          title: "Already read",
          isRead: true,
          message: "Update",
          entityType: "Job",
          entityId: "j1",
          createdAt: "2026-09-19T10:00:00Z",
        },
      ],
      pagination: { totalPages: 2 },
    });
    const user = userEvent.setup();
    mount(<Notifications />);
    expect(
      await screen.findByText("12 unread updates across your workspace."),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Mark all as read" }));
    expect(notificationApi.markAllAsRead).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("link", { name: "View details" })).toHaveAttribute(
      "href",
      "/candidate/jobs/j1",
    );
  });
  it("saves profile fields through the existing API and normalizes empty values", async () => {
    const user = userEvent.setup();
    mount(<Profile />);
    const location = await screen.findByLabelText("Location");
    await user.clear(location);
    await user.type(location, "Bengaluru");
    await user.click(screen.getByRole("button", { name: "Save profile" }));
    expect(
      await screen.findByText("Your profile has been updated."),
    ).toBeInTheDocument();
    expect(candidateProfileApi.updateMyCandidateProfile).toHaveBeenCalledWith(
      expect.objectContaining({
        location: "Bengaluru",
        phone: null,
        yearsOfExperience: null,
      }),
    );
    expect(screen.getByRole("button", { name: "Save profile" })).toBeDisabled();
  });
  it("blocks leaving a dirty profile until changes are discarded", async () => {
    const user = userEvent.setup();
    const { router } = mount(<Profile />);
    await user.type(await screen.findByLabelText("Location"), " changed");
    router.navigate("/elsewhere");
    await user.click(
      await screen.findByRole("button", { name: "Discard and leave" }),
    );
    expect(await screen.findByText("Another page")).toBeInTheDocument();
  });
  it("validates password confirmation and changes the password through auth", async () => {
    const user = userEvent.setup();
    mount(<Settings />);
    await user.type(screen.getByLabelText("Current password"), "old-password");
    await user.type(screen.getByLabelText("New password"), "new-password");
    await user.type(
      screen.getByLabelText("Confirm new password"),
      "different-password",
    );
    await user.click(screen.getByRole("button", { name: "Update password" }));
    expect(screen.getByText("Passwords do not match.")).toBeInTheDocument();
    expect(auth.changePassword).not.toHaveBeenCalled();
    await user.clear(screen.getByLabelText("Confirm new password"));
    await user.type(
      screen.getByLabelText("Confirm new password"),
      "new-password",
    );
    await user.click(screen.getByRole("button", { name: "Update password" }));
    expect(auth.changePassword).toHaveBeenCalledWith({
      currentPassword: "old-password",
      newPassword: "new-password",
    });
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
  });
  it("preserves resume selections when visiting legacy routes", async () => {
    const client = new QueryClient();
    const router = createMemoryRouter(
      [
        {
          path: "/candidate/resume-ai",
          element: <CandidateAlias to="/candidate/ai-resume-audit" />,
        },
        {
          path: "/candidate/ai-resume-audit",
          element: <p>Audit destination</p>,
        },
      ],
      { initialEntries: ["/candidate/resume-ai?resumeId=r2"] },
    );
    render(
      <QueryClientProvider client={client}>
        <RouterProvider router={router} />
      </QueryClientProvider>,
    );
    await screen.findByText("Audit destination");
    expect(router.state.location.search).toBe("?resumeId=r2");
  });
  it("shows a retryable error instead of fake dashboard metrics", async () => {
    dashboardApi.getCandidateDashboard.mockRejectedValue(
      new Error("Service unavailable"),
    );
    mount(<Dashboard />);
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Service unavailable",
    );
    expect(
      screen.getByRole("button", { name: "Try again" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Open roles to explore")).not.toBeInTheDocument();
  });
});

it("refreshes a saved match and shows regeneration errors", async () => {
  jobMatchingApi.getMyMatches.mockResolvedValue([{id:"m1",job,jobId:"j1",resumeId:"r1",analysisStatus:"COMPLETED",overallScore:75,summary:"Your experience aligns with this role.",matchedSkills:["Research"],missingSkills:[]}]);
  jobMatchingApi.analyzeJob.mockRejectedValue(new Error("Please try again later."));
  const user=userEvent.setup();
  mount(<JobMatching />);
  await user.click(await screen.findByRole("button",{name:"Refresh report"}));
  await waitFor(()=>expect(jobMatchingApi.analyzeJob).toHaveBeenCalledWith({jobId:"j1",resumeId:"r1",refresh:true}));
  expect(await screen.findByText("Please try again later.")).toBeInTheDocument();
  expect(screen.getByText("Your experience aligns with this role.")).toBeInTheDocument();
});

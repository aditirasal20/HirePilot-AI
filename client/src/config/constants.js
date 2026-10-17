export const USER_ROLE = {
    CANDIDATE: "CANDIDATE",
    RECRUITER: "RECRUITER",
    ADMIN: "ADMIN",
};

export const THEME = {
    LIGHT: "light",
    DARK: "dark",
    SYSTEM: "system",
};

export const QUERY_KEYS = {
    AUTH_ME: ["auth", "me"],
    DASHBOARD: ["dashboard"],
    RECRUITER_DASHBOARD: ["recruiterDashboard"],
    PUBLIC_JOBS: ["publicJobs"],
    JOB_DETAIL: "jobDetail",
    MY_JOBS: ["myJobs"],
    COMPANY: ["company"],
    MY_APPLICATIONS: ["myApplications"],
    JOB_APPLICATIONS: ["jobApplications"],
    APPLICATION_DETAIL: "applicationDetail",
    RESUMES: ["resumes"],
    RESUME_DETAIL: "resumeDetail",
    RESUME_ANALYSIS: "resumeAnalysis",
    CANDIDATE_PROFILE: ["candidateProfile"],
    MY_MATCHES: ["myMatches"],
    MATCH_REPORT: "matchReport",
    INTERVIEWS: ["interviews"],
    NOTIFICATIONS: ["notifications"],
    UNREAD_COUNT: ["unreadCount"],
};

export const DEFAULT_QUERY_OPTIONS = {
    retry: 1,
    refetchOnWindowFocus: false,
};
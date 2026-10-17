const createStatusMap = (entries) => {
    const map = {};
    entries.forEach(([key, label, className]) => {
        map[key] = { label, className };
    });
    return map;
};

const FALLBACK_STATUS = {
    label: "Unknown",
    className: "bg-gray-500/10 text-gray-400 border-gray-500/20",
};

export const APPLICATION_STATUS = createStatusMap([
    ["APPLIED", "Applied", "bg-gray-500/10 text-gray-400 border-gray-500/20"],
    ["REVIEWING", "In Review", "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"],
    ["SHORTLISTED", "Shortlisted", "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"],
    ["INTERVIEW_SCHEDULED", "Interview Scheduled", "bg-cyan-500/10 text-cyan-400 border-cyan-500/20"],
    ["REJECTED", "Rejected", "bg-red-500/10 text-red-400 border-red-500/20"],
    ["HIRED", "Hired", "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"],
]);

export const getApplicationStatusConfig = (status) =>
    APPLICATION_STATUS[status] || { label: status || FALLBACK_STATUS.label, className: FALLBACK_STATUS.className };

export const INTERVIEW_STATUS = createStatusMap([
    ["SCHEDULED", "Scheduled", "bg-cyan-500/10 text-cyan-400 border-cyan-500/20"],
    ["RESCHEDULED", "Rescheduled", "bg-amber-500/10 text-amber-400 border-amber-500/20"],
    ["COMPLETED", "Completed", "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"],
    ["CANCELLED", "Cancelled", "bg-red-500/10 text-red-400 border-red-500/20"],
    ["NO_SHOW", "No Show", "bg-gray-500/10 text-gray-400 border-gray-500/20"],
]);

export const getInterviewStatusConfig = (status) =>
    INTERVIEW_STATUS[status] || { label: status || FALLBACK_STATUS.label, className: FALLBACK_STATUS.className };

export const ANALYSIS_STATUS = createStatusMap([
    ["IDLE", "Not Analyzed", "bg-gray-500/10 text-gray-400 border-gray-500/20"],
    ["QUEUED", "Queued", "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"],
    ["PROCESSING", "Processing", "bg-cyan-500/10 text-cyan-400 border-cyan-500/20"],
    ["COMPLETED", "Completed", "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"],
    ["FAILED", "Failed", "bg-red-500/10 text-red-400 border-red-500/20"],
]);

export const getAnalysisStatusConfig = (status) =>
    ANALYSIS_STATUS[status] || { label: status || FALLBACK_STATUS.label, className: FALLBACK_STATUS.className };

export const EMPLOYMENT_TYPE = {
    FULL_TIME: "Full-time",
    PART_TIME: "Part-time",
    INTERNSHIP: "Internship",
    CONTRACT: "Contract",
};

export const getEmploymentTypeLabel = (type) =>
    EMPLOYMENT_TYPE[type] || type || "Full-time";

export const JOB_STATUS = createStatusMap([
    ["DRAFT", "Draft", "bg-gray-500/10 text-gray-400 border-gray-500/20"],
    ["OPEN", "Active", "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"],
    ["CLOSED", "Closed", "bg-red-500/10 text-red-400 border-red-500/20"],
]);

export const getJobStatusConfig = (status) =>
    JOB_STATUS[status] || { label: status || FALLBACK_STATUS.label, className: FALLBACK_STATUS.className };

export const APPLICATION_TRANSITIONS = {
    APPLIED: ["REVIEWING", "SHORTLISTED", "REJECTED"],
    REVIEWING: ["SHORTLISTED", "REJECTED"],
    SHORTLISTED: ["INTERVIEW_SCHEDULED", "REJECTED"],
    INTERVIEW_SCHEDULED: ["HIRED", "REJECTED"],
    REJECTED: [],
    HIRED: [],
};

export const getApplicationNextStates = (status) => APPLICATION_TRANSITIONS[status] || [];

export const INTERVIEW_TYPE = {
    ONLINE: "Online",
    ONSITE: "Onsite",
    PHONE: "Phone",
};

export const getInterviewTypeLabel = (type) =>
    INTERVIEW_TYPE[type] || type || "Online";

export const MATCH_RECOMMENDATION = {
    HIGH: { label: "High Match", className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
    MEDIUM: { label: "Medium Match", className: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
    LOW: { label: "Low Match", className: "bg-red-500/10 text-red-400 border-red-500/20" },
};

export const getMatchRecommendationConfig = (recommendation) =>
    MATCH_RECOMMENDATION[recommendation] || { label: "Match", className: "bg-gray-500/10 text-gray-400 border-gray-500/20" };

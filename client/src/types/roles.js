export const ROLES = {
    CANDIDATE: "CANDIDATE",
    RECRUITER: "RECRUITER",
    ADMIN: "ADMIN",
};

export const ROLE_DASHBOARD_PATHS = {
    [ROLES.CANDIDATE]: "/candidate/dashboard",
    [ROLES.RECRUITER]: "/recruiter/dashboard",
    [ROLES.ADMIN]: "/admin/dashboard",
};

export const getDashboardPath = (role) =>
    ROLE_DASHBOARD_PATHS[role] || "/";

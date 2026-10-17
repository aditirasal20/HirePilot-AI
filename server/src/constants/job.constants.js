export const JOB_STATUS_TRANSITIONS = {
    DRAFT: ["OPEN"],
    OPEN: ["CLOSED"],
    CLOSED: [],
};

export const JOB_SORT_OPTIONS = {
    latest: {
        createdAt: "desc",
    },
    oldest: {
        createdAt: "asc",
    },
    salaryAsc: {
        salaryMin: "asc",
    },
    salaryDesc: {
        salaryMax: "desc",
    },
};
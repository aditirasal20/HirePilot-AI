import api from "./axios";
import { getErrorMessage } from "./auth.api";

const extractData = (response) => response?.data?.data ?? response?.data;

const handleError = (error) => {
    const message = getErrorMessage(error);
    const normalized = new Error(message);
    normalized.status = error?.response?.status;
    throw normalized;
};

export async function getPublicJobs(params = {}) {
    try {
        const response = await api.get("/jobs", { params });
        const data = extractData(response);
        return {
            jobs: data?.jobs ?? [],
            pagination: data?.pagination ?? {},
        };
    } catch (error) {
        handleError(error);
    }
}

export async function getJobById(jobId) {
    try {
        const response = await api.get(`/jobs/${jobId}`);
        const data = extractData(response);
        return data?.job ?? null;
    } catch (error) {
        handleError(error);
    }
}

export async function getMyJobs(params = {}) {
    try {
        const response = await api.get("/jobs/me", { params });
        const data = extractData(response);
        return {
            jobs: data?.jobs ?? [],
            pagination: data?.pagination ?? {},
        };
    } catch (error) {
        handleError(error);
    }
}

export async function createJob(payload) {
    try {
        const response = await api.post("/jobs", payload);
        const data = extractData(response);
        return data?.job ?? null;
    } catch (error) {
        handleError(error);
    }
}

export async function updateJob(jobId, payload) {
    try {
        const response = await api.patch(`/jobs/${jobId}`, payload);
        const data = extractData(response);
        return data?.job ?? null;
    } catch (error) {
        handleError(error);
    }
}

export async function updateJobStatus(jobId, status) {
    try {
        const response = await api.patch(`/jobs/${jobId}/status`, { status });
        const data = extractData(response);
        return data?.job ?? null;
    } catch (error) {
        handleError(error);
    }
}

export default { getPublicJobs, getJobById, getMyJobs, createJob, updateJob, updateJobStatus };

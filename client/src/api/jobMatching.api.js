import api from "./axios";
import { getErrorMessage } from "./auth.api";

const extractData = (response) => response?.data?.data ?? response?.data;

const handleError = (error) => {
    const message = getErrorMessage(error);
    const normalized = new Error(message);
    normalized.status = error?.response?.status;
    throw normalized;
};

export async function analyzeJob({ jobId, resumeId, refresh = false }) {
    try {
        const response = await api.post(`/job-matching/${jobId}/analyze`, {
            resumeId,
            refresh,
        });
        return extractData(response);
    } catch (error) {
        handleError(error);
    }
}

export async function getJobMatchReport({ jobId, resumeId }) {
    try {
        const response = await api.get(`/job-matching/${jobId}/report`, {
            params: { resumeId },
        });
        return extractData(response);
    } catch (error) {
        handleError(error);
    }
}

export async function getMyMatches() {
    try {
        const response = await api.get("/job-matching/");
        const data = extractData(response);
        return Array.isArray(data) ? data : [];
    } catch (error) {
        handleError(error);
    }
}

export async function deleteMatch(matchId) {
    try {
        const response = await api.delete(`/job-matching/${matchId}`);
        return extractData(response);
    } catch (error) {
        handleError(error);
    }
}

export default { analyzeJob, getJobMatchReport, getMyMatches, deleteMatch };

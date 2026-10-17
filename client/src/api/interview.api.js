import api from "./axios";
import { getErrorMessage } from "./auth.api";

const extractData = (response) => response?.data?.data ?? response?.data;

const handleError = (error) => {
    const message = getErrorMessage(error);
    const normalized = new Error(message);
    normalized.status = error?.response?.status;
    throw normalized;
};

export async function getInterviews(params = {}) {
    try {
        const response = await api.get("/interviews", { params });
        const data = extractData(response);
        return {
            interviews: data?.interviews ?? [],
            pagination: data?.pagination ?? {},
        };
    } catch (error) {
        handleError(error);
    }
}

export async function getInterviewById(interviewId) {
    try {
        const response = await api.get(`/interviews/${interviewId}`);
        const data = extractData(response);
        return data?.interview ?? null;
    } catch (error) {
        handleError(error);
    }
}

export async function scheduleInterview(payload) {
    try {
        const response = await api.post("/interviews", payload);
        const data = extractData(response);
        return data?.interview ?? null;
    } catch (error) {
        handleError(error);
    }
}

export async function updateInterview(interviewId, payload) {
    try {
        const response = await api.patch(`/interviews/${interviewId}`, payload);
        const data = extractData(response);
        return data?.interview ?? null;
    } catch (error) {
        handleError(error);
    }
}

export async function updateInterviewStatus(interviewId, payload) {
    try {
        const response = await api.patch(`/interviews/${interviewId}/status`, payload);
        const data = extractData(response);
        return data?.interview ?? null;
    } catch (error) {
        handleError(error);
    }
}

export async function cancelInterview(interviewId, cancelReason = "") {
    try {
        const response = await api.delete(`/interviews/${interviewId}`, {
            data: { cancelReason },
        });
        const data = extractData(response);
        return data?.interview ?? null;
    } catch (error) {
        handleError(error);
    }
}

export default { getInterviews, getInterviewById, scheduleInterview, updateInterview, updateInterviewStatus, cancelInterview };

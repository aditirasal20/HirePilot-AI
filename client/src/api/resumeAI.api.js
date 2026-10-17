import api from "./axios";
import { getErrorMessage } from "./auth.api";

const extractData = (response) => response?.data?.data ?? response?.data;

const handleError = (error) => {
    const message = getErrorMessage(error);
    const normalized = new Error(message);
    normalized.status = error?.response?.status;
    throw normalized;
};

export async function startAnalysis(resumeId) {
    try {
        const response = await api.post(`/resume-ai/${resumeId}/analyze`);
        return extractData(response);
    } catch (error) {
        handleError(error);
    }
}

export async function getAnalysis(resumeId) {
    try {
        const response = await api.get(`/resume-ai/${resumeId}/analysis`);
        return extractData(response);
    } catch (error) {
        handleError(error);
    }
}

export default { startAnalysis, getAnalysis };

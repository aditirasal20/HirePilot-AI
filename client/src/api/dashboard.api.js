import api from "./axios";
import { getErrorMessage } from "./auth.api";

const extractData = (response) => response?.data?.data ?? response?.data;

const handleError = (error) => {
    const message = getErrorMessage(error);
    const normalized = new Error(message);
    normalized.status = error?.response?.status;
    throw normalized;
};

export async function getCandidateDashboard() {
    try {
        const response = await api.get("/dashboard/candidate");
        return extractData(response);
    } catch (error) {
        handleError(error);
    }
}

export async function getRecruiterDashboard() {
    try {
        const response = await api.get("/dashboard/recruiter");
        return extractData(response);
    } catch (error) {
        handleError(error);
    }
}

export default { getCandidateDashboard, getRecruiterDashboard };

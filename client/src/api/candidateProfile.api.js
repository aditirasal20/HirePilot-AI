import api from "./axios";
import { getErrorMessage } from "./auth.api";

const extractData = (response) => response?.data?.data ?? response?.data;

const handleError = (error) => {
    const message = getErrorMessage(error);
    const normalized = new Error(message);
    normalized.status = error?.response?.status;
    throw normalized;
};

export async function getMyCandidateProfile() {
    try {
        const response = await api.get("/candidate/profile");
        const data = extractData(response);
        return data?.profile ?? null;
    } catch (error) {
        handleError(error);
    }
}

export async function updateMyCandidateProfile(payload) {
    try {
        const response = await api.patch("/candidate/profile", payload);
        const data = extractData(response);
        return data?.profile ?? null;
    } catch (error) {
        handleError(error);
    }
}

export default { getMyCandidateProfile, updateMyCandidateProfile };

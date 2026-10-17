import api from "./axios";
import { getErrorMessage } from "./auth.api";

const extractData = (response) => response?.data?.data ?? response?.data;

const handleError = (error) => {
    const message = getErrorMessage(error);
    const normalized = new Error(message);
    normalized.status = error?.response?.status;
    throw normalized;
};

export async function getMyCompany() {
    try {
        const response = await api.get("/companies/me");
        const data = extractData(response);
        return data?.company ?? null;
    } catch (error) {
        handleError(error);
    }
}

export async function createCompany(payload) {
    try {
        const response = await api.post("/companies", payload);
        const data = extractData(response);
        return data?.company ?? null;
    } catch (error) {
        handleError(error);
    }
}

export async function updateCompany(companyId, payload) {
    try {
        const response = await api.patch(`/companies/${companyId}`, payload);
        const data = extractData(response);
        return data?.company ?? null;
    } catch (error) {
        handleError(error);
    }
}

export default { getMyCompany, createCompany, updateCompany };

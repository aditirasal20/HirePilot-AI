import api from "./axios";
import { getErrorMessage } from "./auth.api";

const extractData = (response) => response?.data?.data ?? response?.data;

const handleError = (error) => {
    const message = getErrorMessage(error);
    const normalized = new Error(message);
    normalized.status = error?.response?.status;
    throw normalized;
};

export async function uploadResume({ file, title }) {
    try {
        const formData = new FormData();
        formData.append("file", file);
        if (title) {
            formData.append("title", title);
        }

        const response = await api.post("/resumes", formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
        const data = extractData(response);
        return data?.resume ?? null;
    } catch (error) {
        handleError(error);
    }
}

export async function getMyResumes() {
    try {
        const response = await api.get("/resumes");
        const data = extractData(response);
        return data?.resumes ?? [];
    } catch (error) {
        handleError(error);
    }
}

export async function getResumeById(resumeId) {
    try {
        const response = await api.get(`/resumes/${resumeId}`);
        const data = extractData(response);
        return data?.resume ?? null;
    } catch (error) {
        handleError(error);
    }
}

export async function updateResume(resumeId, { title }) {
    try {
        const response = await api.patch(`/resumes/${resumeId}`, { title });
        const data = extractData(response);
        return data?.resume ?? null;
    } catch (error) {
        handleError(error);
    }
}

export async function setDefaultResume(resumeId) {
    try {
        const response = await api.patch(`/resumes/${resumeId}/default`);
        const data = extractData(response);
        return data?.resume ?? null;
    } catch (error) {
        handleError(error);
    }
}

export async function deleteResume(resumeId) {
    try {
        const response = await api.delete(`/resumes/${resumeId}`);
        return extractData(response);
    } catch (error) {
        handleError(error);
    }
}

export default {
    uploadResume,
    getMyResumes,
    getResumeById,
    updateResume,
    setDefaultResume,
    deleteResume,
};

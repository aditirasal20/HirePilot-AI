import api, { refreshSession } from "./axios";

const extractData = (response) => response?.data?.data ?? response?.data;

const getErrorMessage = (error) =>
  error?.response?.data?.message ||
  (error?.code === "ECONNABORTED"
    ? "The request timed out. Please try again."
    : !error?.response
      ? "We couldn't reach HirePilot. Check your connection and try again."
      : error?.message) ||
  "Something went wrong";

const handleError = (error) => {
  const message = getErrorMessage(error);
  const normalized = new Error(message);
  normalized.status = error?.response?.status;
  normalized.code = error?.code;
  normalized.fields = error?.response?.data?.errors || [];
  throw normalized;
};

export async function login({ email, password }) {
  try {
    const response = await api.post("/auth/login", { email, password });
    return extractData(response);
  } catch (error) {
    handleError(error);
  }
}

export async function register({ fullName, email, password, role }) {
  try {
    const response = await api.post("/auth/register", {
      fullName,
      email,
      password,
      role,
    });
    return extractData(response);
  } catch (error) {
    handleError(error);
  }
}

export async function logout() {
  try {
    const response = await api.post("/auth/logout");
    return extractData(response);
  } catch (error) {
    handleError(error);
  }
}

export async function getCurrentUser() {
  try {
    const response = await api.get("/auth/me");
    const payload = extractData(response);
    return payload?.user ?? payload;
  } catch (error) {
    handleError(error);
  }
}

export async function refreshToken() {
  try {
    return await refreshSession();
  } catch (error) {
    handleError(error);
  }
}

export async function changePassword({ currentPassword, newPassword }) {
  try {
    const response = await api.patch("/auth/change-password", {
      currentPassword,
      newPassword,
    });
    return extractData(response);
  } catch (error) {
    handleError(error);
  }
}

export async function forgotPassword({ email }) {
  try {
    const response = await api.post("/auth/forgot-password", { email });
    return extractData(response);
  } catch (error) {
    handleError(error);
  }
}

export async function resetPassword({ token, password, confirmPassword }) {
  try {
    const response = await api.post("/auth/reset-password", {
      token,
      password,
      confirmPassword,
    });
    return extractData(response);
  } catch (error) {
    handleError(error);
  }
}

export async function verifyEmail({ token }) {
  try {
    const response = await api.post("/auth/verify-email", { token });
    return extractData(response);
  } catch (error) {
    handleError(error);
  }
}

export async function resendVerification({ email }) {
  try {
    const response = await api.post("/auth/resend-verification", { email });
    return extractData(response);
  } catch (error) {
    handleError(error);
  }
}

export { getErrorMessage };

export default {
  login,
  register,
  logout,
  getCurrentUser,
  refreshToken,
  changePassword,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification,
};

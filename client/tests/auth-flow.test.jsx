import { StrictMode } from "react";
import { beforeEach, describe, expect, it } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route, useLocation } from "react-router-dom";
import { AxiosError, AxiosHeaders } from "axios";
import api, { resetSession, getAccessToken } from "../src/api/axios";
import AuthProvider from "../src/providers/AuthProvider";
import { useAuth } from "../src/contexts/AuthContext";
import Login from "../src/pages/auth/Login";
import Register from "../src/pages/auth/Register";
import ForgotPassword from "../src/components/auth/ForgotPassword";
import ProtectedRoute from "../src/routes/ProtectedRoute";
import PublicRoute from "../src/routes/PublicRoute";
import { AUTH_EVENT_KEY } from "../src/services/storage.service";

const candidate = {
  id: "candidate-1",
  fullName: "Alex Lee",
  email: "alex@example.com",
  role: "CANDIDATE",
};
const recruiter = {
  ...candidate,
  id: "recruiter-1",
  role: "RECRUITER",
  email: "recruiter@example.com",
};
let remoteUser, calls, overrides, users;
function response(config, data, status = 200) {
  const result = {
    config,
    status,
    statusText: "",
    headers: new AxiosHeaders(),
    data,
  };
  if (status >= 400)
    throw new AxiosError(data.message, "ERR_BAD_REQUEST", config, null, result);
  return result;
}
function Workspace() {
  const { user, logout } = useAuth();
  const location = useLocation();
  return (
    <>
      <h1>{user.role} workspace</h1>
      <p data-testid="location">
        {location.pathname + location.search + location.hash}
      </p>
      <button onClick={logout}>Sign out</button>
    </>
  );
}
function App({ entry = "/login" }) {
  return (
    <StrictMode>
      <AuthProvider>
        <MemoryRouter initialEntries={[entry]}>
          <Routes>
            <Route element={<PublicRoute />}>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
            </Route>
            <Route element={<ProtectedRoute />}>
              <Route path="/candidate/*" element={<Workspace />} />
              <Route path="/recruiter/*" element={<Workspace />} />
              <Route path="/admin/*" element={<Workspace />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    </StrictMode>
  );
}
beforeEach(() => {
  resetSession();
  localStorage.clear();
  sessionStorage.clear();
  calls = [];
  overrides = {};
  remoteUser = null;
  users = [candidate, recruiter];
  api.defaults.adapter = async (config) => {
    calls.push(config);
    if (overrides[config.url]) return overrides[config.url](config);
    const body = config.data ? JSON.parse(config.data) : {};
    if (config.url === "/auth/refresh")
      return remoteUser
        ? response(config, {
            data: { accessToken: "restored-token", user: remoteUser },
          })
        : response(config, { message: "No session" }, 401);
    if (config.url === "/auth/login") {
      const user = users.find((item) => item.email === body.email);
      if (!user || body.password !== "password123")
        return response(config, { message: "Invalid email or password." }, 401);
      remoteUser = user;
      return response(config, { data: { user, accessToken: "login-token" } });
    }
    if (config.url === "/auth/register") {
      if (users.some((item) => item.email === body.email))
        return response(
          config,
          {
            message:
              "An account with this email already exists. Please log in.",
          },
          409,
        );
      const user = { id: "new-user", ...body };
      users.push(user);
      return response(
        config,
        { data: { user, requiresEmailVerification: false } },
        201,
      );
    }
    if (config.url === "/auth/logout") {
      remoteUser = null;
      return response(config, { data: {} });
    }
    throw new Error("Unexpected request: " + config.url);
  };
});
async function fillLogin(email = "alex@example.com", password = "password123") {
  const user = userEvent.setup();
  await screen.findByRole("heading", { name: "Welcome back." });
  const emailInput = screen.getByLabelText("Email address");
  await user.clear(emailInput);
  await user.type(emailInput, email);
  await user.type(screen.getByLabelText("Password", { exact: true }), password);
  await user.click(screen.getByRole("button", { name: "Log in" }));
  return user;
}
describe("real forms, provider, API client, and route guards", () => {
  it.each([
    ["alex@example.com", "CANDIDATE"],
    ["recruiter@example.com", "RECRUITER"],
  ])("logs in %s and redirects by role", async (email, role) => {
    render(<App />);
    await fillLogin(email);
    expect(
      await screen.findByRole("heading", { name: role + " workspace" }),
    ).toBeVisible();
    expect(localStorage.getItem("hirepilot.auth.accessToken")).toBeNull();
  });
  it("preserves an intended protected page after login", async () => {
    render(<App entry="/candidate/jobs?search=react#results" />);
    await fillLogin();
    expect(await screen.findByTestId("location")).toHaveTextContent(
      "/candidate/jobs?search=react#results",
    );
  });
  it("prevents wrong-role access", async () => {
    remoteUser = recruiter;
    render(<App entry="/candidate/jobs" />);
    expect(await screen.findByTestId("location")).toHaveTextContent(
      "/recruiter/dashboard",
    );
  });
  it("restores the cookie session once under StrictMode and after remount", async () => {
    remoteUser = candidate;
    const view = render(<App entry="/candidate/jobs" />);
    await screen.findByRole("heading", { name: "CANDIDATE workspace" });
    expect(calls.filter((c) => c.url === "/auth/refresh")).toHaveLength(1);
    view.unmount();
    resetSession();
    render(<App entry="/candidate/jobs" />);
    expect(
      await screen.findByRole("heading", { name: "CANDIDATE workspace" }),
    ).toBeVisible();
    expect(calls.filter((c) => c.url === "/auth/refresh")).toHaveLength(2);
  });
  it.each(["Candidate", "Recruiter"])(
    "registers a %s then allows login without verification",
    async (label) => {
      render(<App entry="/register" />);
      await screen.findByRole("heading", { name: "Make your next move." });
      const user = userEvent.setup();
      await user.type(screen.getByLabelText("Full name"), "  Taylor Reed  ");
      await user.type(
        screen.getByLabelText("Email address"),
        "NEW@EXAMPLE.COM",
      );
      await user.type(
        screen.getByLabelText("Password", { exact: true }),
        "password123",
      );
      await user.click(screen.getByRole("radio", { name: new RegExp(label) }));
      await user.click(screen.getByRole("button", { name: "Create account" }));
      expect(
        await screen.findByRole("heading", { name: "Welcome back." }),
      ).toBeVisible();
      expect(screen.getByRole("status")).toHaveTextContent(
        "Your account is ready",
      );
      expect(screen.getByLabelText("Email address")).toHaveValue(
        "new@example.com",
      );
      expect(getAccessToken()).toBeNull();
      await user.type(
        screen.getByLabelText("Password", { exact: true }),
        "password123",
      );
      await user.click(screen.getByRole("button", { name: "Log in" }));
      expect(
        await screen.findByRole("heading", {
          name: label.toUpperCase() + " workspace",
        }),
      ).toBeVisible();
      const body = JSON.parse(
        calls.find((c) => c.url === "/auth/register").data,
      );
      expect(body.fullName).toBe("Taylor Reed");
    },
  );
  it("shows field errors and focuses the first invalid field without requesting the API", async () => {
    render(<App entry="/register" />);
    await screen.findByRole("heading", { name: "Make your next move." });
    await userEvent.click(
      screen.getByRole("button", { name: "Create account" }),
    );
    expect(screen.getByLabelText("Full name")).toHaveFocus();
    expect(screen.getByText("Enter at least 3 characters.")).toBeVisible();
    expect(screen.getByLabelText("Email address")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    expect(calls.some((c) => c.url === "/auth/register")).toBe(false);
  });
  it("handles invalid credentials without refreshing or redirecting", async () => {
    render(<App />);
    await fillLogin("alex@example.com", "wrong-password");
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Invalid email or password",
    );
    expect(screen.getByRole("alert")).toHaveFocus();
    expect(calls.filter((c) => c.url === "/auth/refresh")).toHaveLength(1);
    expect(screen.getByRole("button", { name: "Log in" })).toBeEnabled();
  });
  it("offers a retry after a transient restore error", async () => {
    remoteUser = candidate;
    overrides["/auth/refresh"] = (config) =>
      response(config, { message: "Unavailable" }, 503);
    render(<App entry="/candidate/jobs" />);
    expect(
      await screen.findByRole("heading", { name: "Let's reconnect." }),
    ).toBeVisible();
    delete overrides["/auth/refresh"];
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(
      await screen.findByRole("heading", { name: "CANDIDATE workspace" }),
    ).toBeVisible();
  });
  it("logs out locally even when the server is unreachable and prevents restoration", async () => {
    remoteUser = candidate;
    overrides["/auth/logout"] = () =>
      Promise.reject(new AxiosError("Network Error", "ERR_NETWORK"));
    const view = render(<App entry="/candidate/jobs" />);
    await screen.findByRole("heading", { name: "CANDIDATE workspace" });
    await userEvent.click(screen.getByRole("button", { name: "Sign out" }));
    await screen.findByRole("heading", { name: "Welcome back." });
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(
        "server couldn't be reached",
      ),
    );
    expect(getAccessToken()).toBeNull();
    view.unmount();
    render(<App entry="/candidate/jobs" />);
    expect(
      await screen.findByRole("heading", { name: "Welcome back." }),
    ).toBeVisible();
    expect(calls.filter((c) => c.url === "/auth/refresh")).toHaveLength(1);
  });
  it("responds to logout in another tab", async () => {
    remoteUser = candidate;
    render(<App entry="/candidate/jobs" />);
    await screen.findByRole("heading", { name: "CANDIDATE workspace" });
    act(() =>
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: AUTH_EVENT_KEY,
          newValue: JSON.stringify({ type: "logout" }),
        }),
      ),
    );
    expect(
      await screen.findByRole("heading", { name: "Welcome back." }),
    ).toBeVisible();
  });
  it("toggles password visibility accessibly", async () => {
    render(<App />);
    await screen.findByRole("heading", { name: "Welcome back." });
    await userEvent.click(
      screen.getByRole("button", { name: "Show password" }),
    );
    expect(screen.getByLabelText("Password", { exact: true })).toHaveAttribute(
      "type",
      "text",
    );
    expect(
      screen.getByRole("button", { name: "Hide password" }),
    ).toHaveAttribute("aria-pressed", "true");
  });
  it("shows recovery service errors instead of pretending email was sent", async () => {
    overrides["/auth/forgot-password"] = (config) =>
      response(
        config,
        {
          message:
            "Email delivery is not configured. Please contact the app administrator.",
        },
        503,
      );
    render(<App entry="/forgot-password" />);
    await screen.findByRole("heading", { name: "A fresh start." });
    await userEvent.type(
      screen.getByLabelText("Email address"),
      "alex@example.com",
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Send reset link" }),
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Email delivery is not configured",
    );
  });
});

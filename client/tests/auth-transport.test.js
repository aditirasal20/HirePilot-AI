import { beforeEach, expect, it, vi } from "vitest";
import { AxiosError, AxiosHeaders } from "axios";
import api, {
  getAccessToken,
  setAccessToken,
  resetSession,
  refreshSession,
  onAuthFailure,
} from "../src/api/axios";
import { setLoggedOutMarker } from "../src/services/storage.service";

function reply(config, data, status = 200) {
  const response = {
    config,
    data,
    status,
    statusText: "",
    headers: new AxiosHeaders(),
  };
  if (status >= 400)
    throw new AxiosError(
      "Request failed",
      "ERR_BAD_REQUEST",
      config,
      null,
      response,
    );
  return response;
}
beforeEach(() => {
  resetSession();
  localStorage.clear();
  sessionStorage.clear();
  onAuthFailure(null);
});
it("shares one refresh across concurrent 401s and retries both requests once", async () => {
  setAccessToken("old");
  let refreshCount = 0;
  const attempts = {};
  api.defaults.adapter = async (config) => {
    if (config.url === "/auth/refresh") {
      refreshCount++;
      await new Promise((resolve) => setTimeout(resolve, 10));
      return reply(config, { data: { accessToken: "new" } });
    }
    attempts[config.url] = (attempts[config.url] || 0) + 1;
    return reply(
      config,
      {},
      config.headers.Authorization === "Bearer new" ? 200 : 401,
    );
  };
  await Promise.all([api.get("/jobs"), api.get("/applications")]);
  expect(refreshCount).toBe(1);
  expect(attempts).toEqual({ "/jobs": 2, "/applications": 2 });
});
it("does not refresh indefinitely when retried requests are unauthorized", async () => {
  setAccessToken("old");
  const failure = vi.fn();
  onAuthFailure(failure);
  let refreshes = 0;
  api.defaults.adapter = async (config) => {
    if (config.url === "/auth/refresh") {
      refreshes++;
      return reply(config, { data: { accessToken: "new" } });
    }
    return reply(config, {}, 401);
  };
  await expect(api.get("/private")).rejects.toBeDefined();
  expect(refreshes).toBe(1);
  expect(failure).toHaveBeenCalledOnce();
  expect(getAccessToken()).toBeNull();
});
it("preserves the session on transient refresh failure", async () => {
  setAccessToken("old");
  const failure = vi.fn();
  onAuthFailure(failure);
  api.defaults.adapter = async (config) =>
    reply(config, {}, config.url === "/auth/refresh" ? 503 : 401);
  await expect(api.get("/private")).rejects.toBeDefined();
  expect(getAccessToken()).toBe("old");
  expect(failure).not.toHaveBeenCalled();
});
it("cannot restore a late refresh response after logout", async () => {
  let release;
  let started;
  const pending = new Promise((resolve) => {
    started = resolve;
  });
  api.defaults.adapter = (config) =>
    new Promise((resolve) => {
      release = () =>
        resolve(reply(config, { data: { accessToken: "late-token" } }));
      started();
    });
  const refreshing = refreshSession();
  const rejected = expect(refreshing).rejects.toMatchObject({
    code: "ERR_CANCELED",
  });
  await pending;
  setLoggedOutMarker();
  resetSession();
  release();
  await rejected;
  expect(getAccessToken()).toBeNull();
});
it("discards an old account's pending response after the session changes", async () => {
  setAccessToken("old-account");
  let release, started;
  const pending = new Promise((resolve) => {
    started = resolve;
  });
  api.defaults.adapter = (config) =>
    new Promise((resolve) => {
      release = () => resolve(reply(config, { private: "old account" }));
      started();
    });
  const request = api.get("/private");
  const rejected = expect(request).rejects.toMatchObject({
    code: "ERR_CANCELED",
  });
  await pending;
  resetSession();
  setAccessToken("new-account");
  release();
  await rejected;
  expect(getAccessToken()).toBe("new-account");
});

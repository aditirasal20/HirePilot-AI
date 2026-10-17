import "./env.js";
import { after, before, beforeEach, mock, test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import express from "express";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import authRouter from "../src/modules/auth/auth.routes.js";
import authRepository from "../src/modules/auth/auth.repository.js";
import authService from "../src/modules/auth/auth.service.js";
import errorHandler from "../src/middleware/error.middleware.js";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  hashRefreshToken,
} from "../src/utils/jwt.js";
import {
  generatePasswordResetToken,
  generateEmailVerificationToken,
} from "../src/utils/authTokens.js";
import { env } from "../src/config/env.js";
import ApiError from "../src/utils/ApiError.js";
import prisma from "../src/lib/prisma.js";

env.ACCESS_TOKEN_SECRET = randomUUID();
env.REFRESH_TOKEN_SECRET = randomUUID();
process.env.REQUIRE_EMAIL_VERIFICATION = "false";
let users, server, base;
const safe = (user) => {
  if (!user) return null;
  const result = { ...user };
  delete result.password;
  delete result.refreshTokenHash;
  delete result.refreshTokenExpiresAt;
  return result;
};
before(async () => {
  mock.method(
    authRepository,
    "findUserByEmail",
    async (email) => [...users.values()].find((u) => u.email === email) || null,
  );
  mock.method(
    authRepository,
    "findUserWithPassword",
    async (email) => [...users.values()].find((u) => u.email === email) || null,
  );
  mock.method(authRepository, "findUserById", async (id) =>
    safe(users.get(id)),
  );
  mock.method(authRepository, "findUserByIdWithAuth", async (id) =>
    users.has(id) ? { ...users.get(id) } : null,
  );
  mock.method(authRepository, "registerUser", async (data) => {
    const user = { ...data, id: randomUUID(), isEmailVerified: false };
    users.set(user.id, user);
    return safe(user);
  });
  mock.method(
    authRepository,
    "updateRefreshToken",
    async (id, refreshTokenHash, refreshTokenExpiresAt) =>
      Object.assign(users.get(id), { refreshTokenHash, refreshTokenExpiresAt }),
  );
  mock.method(
    authRepository,
    "rotateRefreshToken",
    async (id, previousHash, refreshTokenHash, refreshTokenExpiresAt) => {
      const user = users.get(id);
      if (user.refreshTokenHash !== previousHash) return { count: 0 };
      Object.assign(user, { refreshTokenHash, refreshTokenExpiresAt });
      return { count: 1 };
    },
  );
  mock.method(authRepository, "clearRefreshToken", async (id) =>
    Object.assign(users.get(id), {
      refreshTokenHash: null,
      refreshTokenExpiresAt: null,
    }),
  );
  mock.method(authRepository, "markEmailVerified", async (id) =>
    Object.assign(users.get(id), { isEmailVerified: true }),
  );
  mock.method(authRepository, "updatePassword", async (id, password) =>
    Object.assign(users.get(id), {
      password,
      refreshTokenHash: null,
      refreshTokenExpiresAt: null,
    }),
  );
  mock.method(
    authRepository,
    "updatePasswordIfCurrent",
    async (id, previous, password) => {
      const user = users.get(id);
      if (user.password !== previous) return { count: 0 };
      Object.assign(user, {
        password,
        refreshTokenHash: null,
        refreshTokenExpiresAt: null,
      });
      return { count: 1 };
    },
  );
  const app = express();
  app.use(express.json(), cookieParser());
  app.use("/api/v1/auth", authRouter);
  app.use(errorHandler);
  server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  base = "http://127.0.0.1:" + server.address().port + "/api/v1/auth";
});
beforeEach(() => {
  users = new Map();
  process.env.REQUIRE_EMAIL_VERIFICATION = "false";
});
after(async () => {
  mock.restoreAll();
  await new Promise((resolve) => server.close(resolve));
  await prisma.$disconnect();
});
async function request(path, { body, cookie, token, method = "POST" } = {}) {
  const res = await fetch(base + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(cookie ? { Cookie: cookie } : {}),
      ...(token ? { Authorization: "Bearer " + token } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return {
    status: res.status,
    body: await res.json(),
    cookie: res.headers.get("set-cookie"),
  };
}
const details = (role = "CANDIDATE") => ({
  fullName: "  Alex Lee  ",
  email: "ALEX@example.com",
  password: "password123",
  role,
});
async function account(role) {
  const registered = await request("/register", { body: details(role) });
  const login = await request("/login", { body: details(role) });
  return {
    registered,
    login,
    cookie: login.cookie.split(";")[0],
    token: login.body.data.accessToken,
  };
}
test("registration normalizes fields, rejects invalid roles, and never issues a session", async () => {
  const bad = await request("/register", { body: details("ADMIN") });
  assert.equal(bad.status, 400);
  const result = await request("/register", { body: details() });
  assert.equal(result.status, 201);
  assert.equal(result.body.data.user.fullName, "Alex Lee");
  assert.equal(result.body.data.user.email, "alex@example.com");
  assert.equal(result.body.data.requiresEmailVerification, false);
  assert.equal(result.body.data.verificationToken, undefined);
  assert.equal(result.body.data.accessToken, undefined);
  assert.equal(result.body.data.user.password, undefined);
  assert.equal(result.cookie, null);
  assert.equal((await request("/register", { body: details() })).status, 409);
});
test("login works without verification and sets a scoped HttpOnly cookie", async () => {
  const { login, token } = await account();
  assert.equal(login.status, 200);
  assert.match(login.cookie, /HttpOnly/);
  assert.match(login.cookie, /Path=\/api\/v1\/auth/);
  assert.match(login.cookie, /SameSite=Lax/);
  assert.equal(login.body.data.user.refreshTokenHash, undefined);
  assert.equal((await request("/me", { method: "GET", token })).status, 200);
  assert.equal((await request("/me", { method: "GET" })).status, 401);
});
test("wrong passwords return 401 without a cookie", async () => {
  await request("/register", { body: details() });
  const result = await request("/login", {
    body: { email: "alex@example.com", password: "wrong" },
  });
  assert.equal(result.status, 401);
  assert.equal(result.cookie, null);
});
test("server enforces recruiter authorization", async () => {
  const candidate = await account("CANDIDATE");
  assert.equal(
    (
      await request("/recruiter-only", {
        method: "GET",
        token: candidate.token,
      })
    ).status,
    403,
  );
  users.clear();
  const recruiter = await account("RECRUITER");
  assert.equal(
    (
      await request("/recruiter-only", {
        method: "GET",
        token: recruiter.token,
      })
    ).status,
    200,
  );
});
test("refresh rotates tokens and rejects replay", async () => {
  const { cookie } = await account();
  const refreshed = await request("/refresh", { cookie });
  assert.equal(refreshed.status, 200);
  assert.notEqual(refreshed.cookie.split(";")[0], cookie);
  assert.equal((await request("/refresh", { cookie })).status, 401);
  assert.equal(
    (await request("/refresh", { cookie: refreshed.cookie.split(";")[0] }))
      .status,
    200,
  );
});
test("concurrent refresh accepts only one use of a token", async () => {
  const { cookie } = await account();
  const results = await Promise.all([
    request("/refresh", { cookie }),
    request("/refresh", { cookie }),
  ]);
  assert.deepEqual(results.map((r) => r.status).sort(), [200, 401]);
});
test("logout revokes refresh even with an expired access token", async () => {
  const { cookie } = await account();
  const result = await request("/logout", { cookie, token: "expired" });
  assert.equal(result.status, 200);
  assert.match(result.cookie, /Expires=Thu, 01 Jan 1970/);
  assert.equal((await request("/refresh", { cookie })).status, 401);
});
test("transient refresh failure does not erase a recoverable cookie", async (t) => {
  t.mock.method(authService, "refresh", async () => {
    throw new ApiError(503, "Temporarily unavailable");
  });
  const result = await request("/refresh", { cookie: "refreshToken=example" });
  assert.equal(result.status, 503);
  assert.equal(result.cookie, null);
});
test("recovery endpoints never return bearer reset or verification tokens", async () => {
  const smtpHost = process.env.SMTP_HOST;
  delete process.env.SMTP_HOST;
  try {
    for (const path of ["/forgot-password", "/resend-verification"]) {
      const result = await request(path, {
        body: { email: "alex@example.com" },
      });
      assert.equal(result.status, 503);
      assert.equal(result.body.resetToken, undefined);
      assert.equal(result.body.verificationToken, undefined);
    }
  } finally {
    if (smtpHost) process.env.SMTP_HOST = smtpHost;
  }
});
test("JWT purpose separation rejects reset and verification tokens as access tokens", () => {
  assert.throws(() =>
    verifyAccessToken(
      jwt.sign(
        { userId: "user", purpose: "password-reset" },
        env.ACCESS_TOKEN_SECRET,
      ),
    ),
  );
  assert.throws(() =>
    verifyAccessToken(generatePasswordResetToken({ userId: "user" })),
  );
  assert.throws(() =>
    verifyAccessToken(generateEmailVerificationToken({ userId: "user" })),
  );
  assert.throws(() =>
    verifyRefreshToken(generateAccessToken({ userId: "user" })),
  );
});
test("same-second refresh tokens are unique and expired tokens are rejected", () => {
  assert.notEqual(
    generateRefreshToken({ userId: "user" }),
    generateRefreshToken({ userId: "user" }),
  );
  assert.throws(() =>
    verifyAccessToken(
      jwt.sign({ userId: "user", purpose: "access" }, env.ACCESS_TOKEN_SECRET, {
        expiresIn: -1,
      }),
    ),
  );
});
test("registration rejects passwords above bcrypt's UTF-8 byte limit", async () => {
  const result = await request("/register", {
    body: { ...details(), password: "\u00e9".repeat(37) },
  });
  assert.equal(result.status, 400);
});

test("password reset is single-use and revokes the refresh session", async () => {
  const { cookie } = await account();
  const user = [...users.values()][0];
  const token = generatePasswordResetToken({
    userId: user.id,
    email: user.email,
    passwordVersion: hashRefreshToken(user.password),
  });
  const body = {
    token,
    password: "new-password123",
    confirmPassword: "new-password123",
  };
  assert.equal((await request("/reset-password", { body })).status, 200);
  assert.equal((await request("/reset-password", { body })).status, 400);
  assert.equal((await request("/refresh", { cookie })).status, 401);
  assert.equal(
    (
      await request("/login", {
        body: { email: user.email, password: "new-password123" },
      })
    ).status,
    200,
  );
});
test("optional verification policy blocks login only when explicitly enabled", async () => {
  const created = await request("/register", { body: details() });
  process.env.REQUIRE_EMAIL_VERIFICATION = "true";
  assert.equal((await request("/login", { body: details() })).status, 403);
  const user = created.body.data.user;
  const token = generateEmailVerificationToken({
    userId: user.id,
    email: user.email,
  });
  assert.equal(
    (await request("/verify-email", { body: { token } })).status,
    200,
  );
  assert.equal((await request("/login", { body: details() })).status, 200);
});

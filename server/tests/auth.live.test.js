import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import express from "express";
import cookieParser from "cookie-parser";
import authRouter from "../src/modules/auth/auth.routes.js";
import errorHandler from "../src/middleware/error.middleware.js";
import prisma from "../src/lib/prisma.js";
import { isProduction } from "../src/config/env.js";

test(
  "live database: candidate and recruiter registration, login, session, authorization, and logout",
  {
    skip: process.env.AUTH_LIVE_TEST !== "true",
    timeout: 60000,
  },
  async () => {
    assert.equal(
      isProduction,
      false,
      "Use a development database for this test.",
    );
    assert.notEqual(
      process.env.REQUIRE_EMAIL_VERIFICATION,
      "true",
      "This test expects optional verification.",
    );
    const emails = ["CANDIDATE", "RECRUITER"].map(
      (role) =>
        "auth-smoke-" +
        role.toLowerCase() +
        "-" +
        randomUUID() +
        "@example.invalid",
    );
    const app = express();
    app.use(express.json(), cookieParser());
    app.use("/api/v1/auth", authRouter);
    app.use(errorHandler);
    const server = app.listen(0, "127.0.0.1");
    await new Promise((resolve) => server.once("listening", resolve));
    const base = "http://127.0.0.1:" + server.address().port + "/api/v1/auth";
    async function request(
      path,
      { body, method = "POST", token, cookie } = {},
    ) {
      const res = await fetch(base + path, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: "Bearer " + token } : {}),
          ...(cookie ? { Cookie: cookie } : {}),
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
      return {
        status: res.status,
        body: await res.json(),
        cookie: res.headers.get("set-cookie"),
      };
    }
    try {
      for (const [index, role] of ["CANDIDATE", "RECRUITER"].entries()) {
        const body = {
          fullName: "Auth Smoke Test",
          email: emails[index],
          password: "AuthSmoke-" + randomUUID(),
          role,
        };
        const created = await request("/register", { body });
        assert.equal(created.status, 201);
        assert.equal(created.body.data.requiresEmailVerification, false);
        const id = created.body.data.user.id;
        const profile =
          role === "CANDIDATE"
            ? await prisma.candidateProfile.findUnique({
                where: { userId: id },
              })
            : await prisma.recruiterProfile.findUnique({
                where: { userId: id },
              });
        assert.ok(profile, role + " profile created transactionally");
        assert.equal((await request("/register", { body })).status, 409);
        const login = await request("/login", {
          body: { email: body.email.toUpperCase(), password: body.password },
        });
        assert.equal(login.status, 200);
        assert.equal(login.body.data.user.role, role);
        assert.match(login.cookie, /HttpOnly/);
        let token = login.body.data.accessToken;
        let cookie = login.cookie.split(";")[0];
        const me = await request("/me", { method: "GET", token });
        assert.equal(me.status, 200);
        assert.equal(me.body.user.id, id);
        assert.equal(me.body.user.password, undefined);
        assert.equal(
          (await request("/recruiter-only", { method: "GET", token })).status,
          role === "RECRUITER" ? 200 : 403,
        );
        const refresh = await request("/refresh", { cookie });
        assert.equal(refresh.status, 200);
        assert.notEqual(refresh.cookie.split(";")[0], cookie);
        cookie = refresh.cookie.split(";")[0];
        token = refresh.body.data.accessToken;
        assert.equal((await request("/logout", { token, cookie })).status, 200);
        assert.equal((await request("/refresh", { cookie })).status, 401);
        const again = await request("/login", { body });
        assert.equal(again.status, 200);
        assert.equal(
          (
            await request("/logout", {
              token: again.body.data.accessToken,
              cookie: again.cookie.split(";")[0],
            })
          ).status,
          200,
        );
        console.log(
          role +
            ": register, profile, duplicate handling, login, /me, role guard, refresh, logout, and re-login passed",
        );
      }
    } finally {
      await new Promise((resolve) => server.close(resolve));
      try {
        await prisma.user.deleteMany({ where: { email: { in: emails } } });
        assert.equal(
          await prisma.user.count({ where: { email: { in: emails } } }),
          0,
        );
        console.log("Temporary verification accounts removed");
      } finally {
        await prisma.$disconnect();
      }
    }
  },
);

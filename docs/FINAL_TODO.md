# HirePilot AI Backend — Final TODO List

Date: 2026-07-31. Status of the hardening pass: **complete**.
Remaining items are optional/cleanup or external-dependency steps.

## A. Verified / Done (no action)
- [x] ESM-only codebase (`server` boots, no CJS remnants)
- [x] Zod v4 validation middleware, params/query/body redefinition
- [x] Prisma error mapping + Multer error mapping in global error handler
- [x] Auth rate limiting (register/login) + API rate limiting
- [x] Email normalization, P2002→409, no password leak in responses
- [x] resume-ai + job-matching ESM rewrites, atomic claims, dedupe, FAILED lifecycle
- [x] cover-letter + resume-rewrite workers with stored templates
- [x] Gemini model getter; default `gemini-2.5-flash` (free-tier friendly)
- [x] Prisma schema fixes + migration `20260731081958_consistency_fixes` applied
- [x] Application/interview notifications, dashboard empty-`notIn` guard, last-7-day week
- [x] Socket.IO JWT auth + `initNotificationSocket(io)` contract
- [x] End-to-end AI run: analyze → 202 → worker → Gemini → COMPLETED + notifications
- [x] Postman collection (`docs/HirePilot-AI.postman_collection.json`)
- [x] Readiness report (`docs/READINESS_REPORT.md`)

## B. Optional code cleanup (small)
- [ ] Remove duplicate `router.use("/resumes", resumeRoutes)` lines in `src/routes/index.js`
- [ ] Mount `cover-letter.routes.js` in `src/routes/index.js` if the route is intended for public use
- [ ] Move per-request secret-heavy env reads to `config/env.js` central validation (optional)

## C. Pre-production / external (owner action required)
- [ ] Provision a paid or higher-quota Gemini key, or confirm free-tier limits suffice;
      set `GEMINI_MODEL` (`.env`)
- [ ] Replace simulated in-process AI queue with real BullMQ (Redis) producer/worker when
      scaling to multiple instances (`ai.queue.js` / `notification.queue.js` swap point)
- [ ] Provide real Cloudinary, SMTP, and (if needed) SMS credentials; verify actual
      outbound delivery
- [ ] Switch rate-limit + socket adapter to Redis-backed store in multi-instance deploys
- [ ] Run full Postman collection in CI/staging (`newman run docs/HirePilot-AI.postman_collection.json`)
- [ ] Add integration test suite for the 5 critical flows (auth, resume upload+analyze,
      apply, interview schedule, notifications) before cutover

## D. Suggested rollout
1. Deploy to staging behind the existing reverse proxy.
2. Execute Postman collection against staging; fix any env-specific failures.
3. Load-test the AI endpoints to confirm Gemini quota budget.
4. Ship. Keep the in-process queue until a Redis-backed queue is introduced.

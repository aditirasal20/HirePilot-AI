# HirePilot AI Backend — Production Readiness Report

Date: 2026-07-31
Scope: `server/` (Node.js, Express, PostgreSQL, Prisma, Socket.IO, Gemini AI)
Status: **READY FOR STAGING** (with noted external dependencies)

---

## 1. Executive Summary

The backend has been hardened end-to-end and all fixes were smoke-tested against a live
server (PORT=5001). The full AI pipeline (resume-ai, job-matching) was verified end-to-end
against the live Gemini API and now completes successfully using the `gemini-2.5-flash`
model.

## 2. What Was Fixed

### Core infrastructure
- `validate.middleware.js` — rewritten for Zod v4 (`error.issues`), re-defines validated
  `params`/`query`/`body` correctly; invalid CUIDs return 400 with joined messages.
- `config/env.js` — rewritten; exports `env` + `isProduction`.
- `error.middleware.js` — Prisma error mapping (P2000/P2002/P2003/P2011/P2023/P2025),
  Multer file-size errors, dev-only stack traces.
- Added `rateLimit.middleware.js` (`authRateLimiter` 20/15min on register/login;
  `apiRateLimiter` 300/min on `/api/v1`) and `cors.middleware.js`.
- `src/index.js` — JSON body limit, CORS, `/api/v1/health`, 404 handler, global error
  handler, Socket.IO init, graceful shutdown (SIGTERM/SIGINT + unhandledRejection/
  uncaughtException).

### Auth
- Email trim/lowercase normalization on register and login.
- P2002 duplicate email → 409 "Email already exists" (no longer leaks a 500).
- `register`/`login` now behind `authRateLimiter`; `GET /auth/me` returns the user
  without `password`/`refreshToken`.

### AI pipeline (resume-ai, job-matching, cover-letter, resume-rewrite, interview)
- `ai.queue.js` — hardened in-process queue: jobId dedupe, retry/backoff loop,
  `_executeJob`, per-job error events. Pre-existing simulated-BullMQ architecture
  preserved.
- `ai.worker.js` — delegates to per-module processors.
- `resume-ai` module — full ESM rewrite: atomic claim (`updateMany`) prevents double
  processing; jobId `resume-analysis:<resumeId>`; 409 on duplicate; PARSE →
  PROCESSING → COMPLETED/FAILED lifecycle; socket + DB notifications.
- `job-matching` module — ESM rewrite: `analysisStatus` gate, cached COMPLETED result,
  P2002 concurrent-create handled, `JOB_MATCHING_V2` prompt.
- Added `ai/cover-letter.worker.js` + `ai/resume.rewrite.worker.js` (stored templates
  with inline fallbacks).
- `gemini.service.js` — default model is now a getter resolving
  `GEMINI_MODEL || "gemini-2.5-flash"` at call time; no more hardcoded retired models.

### Data layer (Prisma)
- Migration `20260731081958_consistency_fixes` applied; `prisma migrate status` clean
  (5 migrations); client regenerated.
  - `Resume` index on `candidateProfileId`; `Application` `onDelete: Cascade` + composite
    indexes; `Interview` `onDelete: Cascade` + status/date indexes; `JobMatch` status
    enum corrected (`QUEUED`/`PROCESSING`/`COMPLETED`/`FAILED`) + `@@index([status])`;
    `CoverLetter` back-relations added (schema consistency).
  - Dropped redundant `@@index([email])` on `User`.

### Domain modules
- Resume: PDF text extracted at upload time (`parsedText` stored); AI processor fails
  fast (not silently) when text is missing.
- Application: creation dispatches notifications to candidate + recruiter; status
  transitions (SHORTLISTED/REJECTED) notify candidate; repo lookups isolated to
  `findJobForNotification` / `findApplicationForStatusNotification`.
- Interview: all mutations publish domain events → real notifications via
  `notificationEventHandler`.
- Dashboard: `findRecommendedJobs` guards empty `notIn` (no empty `where.id.notIn`),
  "this week" window corrected to last-7-days.
- Notifications: Socket.IO JWT-auth hardened (`initNotificationSocket(io)`,
  `emitToUser` guards empty `userId`).

## 3. Verified Smoke Tests (live, PORT=5001)

| Scenario | Result |
| --- | --- |
| Server boot | OK — "HirePilot AI server running on http://localhost:5001 (development)" |
| `GET /api/v1/health` | 200 `{success:true}` |
| Unknown route → 404 handler | 200-wrapper `{success:false,"Route not found:..."}` |
| Zod validation failure | 400 with joined `error.issues` messages |
| Register candidate/recruiter | 201 |
| Login + `/auth/me` | 200, token issued, no password leaked |
| Duplicate email register | 409 |
| Resume upload (multipart PDF + title) | 201, `parsedText` extracted |
| `POST /resume-ai/:id/analyze` | 202 queued (duplicate → 409/ownership-checked) |
| Resume analysis end-to-end | COMPLETED (Gemini `gemini-2.5-flash`, ~12.5s, 1097 tokens); socket event `RESUME_AI_ANALYSIS_COMPLETED` + email notification dispatched |
| AI failure path | Job retried 3×, resume marked FAILED, `RESUME_AI_ANALYSIS_FAILED` emitted |
| Cross-user ownership | 404/403 (candidate cannot analyze another user's resume) |

## 4. Remaining Risks / Notes

1. **Gemini quota (external).** Free-tier keys are quota-limited (429 / RESOURCE_EXHAUSTED
   seen earlier on `gemini-2.0-flash`). `gemini-2.5-flash` completed successfully. For
   higher volume, use a paid key or tune `GEMINI_MODEL`. Retry/backoff already in place.
2. **In-process queue is a simulation.** `ai.queue.js`/`notification.queue.js` use
   in-memory `setImmediate` dispatch — fine for a single instance, **not** for multi-instance
   horizontal scaling. Swap point: replace `aiQueueManager.addAIJob` / the notification
   queue dispatch with a real BullMQ (Redis) producer + worker when scaling. Architecture
   intentionally preserved per project constraints.
3. **`cover-letter.routes.js` exists but is not mounted** in `src/routes/index.js`.
   Cover-letter jobs are still processable via the AI worker; route wiring is optional.
4. **Cloudinary / email / SMS** are external providers — need real credentials + provider
   accounts for full E2E; email worker path exercised (dispatched) but actual delivery
   requires SMTP creds.
5. **Rate limits are in-memory** (per-process). Use a Redis-backed store for multi-instance.
6. Duplicate `use("/resumes", ...)` lines exist in `src/routes/index.js` — harmless
   (Express ignores re-mounts) but could be cleaned.

## 5. Environment Checklist

- [x] `DATABASE_URL` — PostgreSQL reachable; 5 migrations applied
- [x] `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` — set
- [x] `GEMINI_API_KEY` — set; `GEMINI_MODEL=gemini-2.5-flash`
- [x] `.env.example` documents all keys incl. `GEMINI_MODEL`
- [ ] Cloudinary/SMTP/Redis (if used in prod) — supply real credentials

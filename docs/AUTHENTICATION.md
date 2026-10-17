# Authentication

## Behavior

- Registration creates a candidate/recruiter account and its profile, then sends the user to Login with their email and a success message. Email verification is optional and disabled locally.
- Login returns `{ user, accessToken }`. The client restores only a same-role protected destination or falls back to that role's dashboard.
- Access tokens stay in memory. Reloading restores the session from the HttpOnly refresh cookie. Legacy access tokens are removed from browser storage.
- Refresh is single-flight within a tab. Web Locks serialize cookie operations across supporting tabs; the local queue also serializes refresh/login/logout within each tab.
- Logout clears React state and React Query data immediately, broadcasts to other tabs, and revokes the refresh token on the server. A persistent logout marker prevents unwanted restoration if the server was unavailable.
- A network/server failure during session restoration shows retry/sign-in options. It does not delete the refresh cookie. Invalid sessions go to Login.
- JWT purposes are separated. Refresh tokens have unique IDs and rotate using a database compare-and-swap; stale token replay is rejected.
- Access tokens remain short-lived stateless credentials until their expiry (default 15 minutes). Logout revokes refresh and removes local access immediately.
- Only one refresh session per user is stored in the current database model. A login on a separate browser replaces the previous browser's refresh session. Supporting multiple devices independently would require a sessions table.

## Local setup

The ignored `server/.env` needs `DATABASE_URL`, `ACCESS_TOKEN_SECRET`, and `REFRESH_TOKEN_SECRET`. Missing local signing secrets were generated without printing their values. Keep `REQUIRE_EMAIL_VERIFICATION=false` for the current workflow.

Restart a running backend after environment changes. Run `npm run dev` in both `server` and `client`. The client defaults to `http://localhost:5000/api/v1`. Keep frontend and backend on the same hostname in development (both localhost, rather than mixing localhost and 127.0.0.1).

Cookies default to SameSite=Lax and are Secure in production. For an HTTPS cross-site deployment, configure `AUTH_COOKIE_SAME_SITE=none` and an exact `CLIENT_ORIGIN`; browser third-party-cookie restrictions still apply. Prefer a same-site deployment.

## Recovery and optional verification

Reset/verification tokens are never returned by public APIs. Configure SMTP to enable emailed links:

```dotenv
SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM=
AUTH_APP_URL=http://localhost:5173
```

Recovery returns an explicit unavailable error without SMTP instead of claiming an email was sent. Verification requests say that an email was requested; only a successful token verification says the address is verified. Reset links are invalidated after a password change and cannot be reused. No verification or recovery email is sent during the automated tests.

## Verification

From `client`: `npm test` and `npm run build`.
From `server`: `npm test`.

The client suite exercises actual auth forms, provider, API interceptors, and route guards using a simulated API. The backend suite makes HTTP requests to the actual Express auth router with an isolated in-memory repository.

For the optional live database smoke test in PowerShell:

```powershell
$env:AUTH_LIVE_TEST = 'true'
npm run test:auth:live
Remove-Item Env:AUTH_LIVE_TEST
```

It uses randomly named temporary accounts, exercises both roles through real database operations, and removes those exact accounts in a finally block. Never run it against production.

Visual browser checks require a connected browser. Automated DOM tests do not verify screenshots, responsive rendering, real browser cookie policy, or actual SMTP delivery.

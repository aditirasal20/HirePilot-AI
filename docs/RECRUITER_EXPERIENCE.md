# Recruiter experience

## Scope and audit
Ten existing Recruiter screens were inspected before implementation: dashboard, jobs, job creation, applicants, applicant details, interviews, analytics, company, notifications and settings. API schemas, service ownership checks, status transitions and data projections were checked alongside the UI.

The old experience used a separate dark/purple shell, truncated job discovery at 100 records, lost filters on navigation, exposed unsupported AI draft generation, presented resume-quality scores as job matches, duplicated scheduling forms with incorrect UTC labels, and included fake billing/automation controls.

## Shared product design
Candidate and Recruiter now use the same implementation in components/workspace:
- Workspace: responsive navigation, functional role-specific job search, unread indicator, account identity and sidebar sign-out.
- Page and ui: typography, headings, cards, buttons, fields, badges, query/empty/error states, pagination and scores.
- AccountSettings: real authenticated password changes and account links.
- Notifications: the existing inbox workflow, with destinations appropriate to each role.

Candidate compatibility wrappers preserve existing imports and behavior. Shared styling and tokens remain in styles/design-system.css and styles/candidate.css; styles/recruiter.css adds only recruiter-specific structures, including pipeline columns and stage distributions.

## Route coverage
| Route | Experience |
| --- | --- |
| /recruiter/dashboard | Real activity, current stage counts, recent applicants and upcoming interviews |
| /recruiter/jobs | Server-side search/status filtering and pagination across all owned jobs |
| /recruiter/jobs/create | Company prerequisite, validated draft/publish workflow |
| /recruiter/jobs/:jobId | New role overview with actual stage totals and publish/close/reopen actions |
| /recruiter/jobs/:jobId/edit | New edit workflow with ownership and closed-role handling |
| /recruiter/applicants | Search, score/stage filters, list/pipeline views and saved views |
| /recruiter/applicants/:applicationId | Profile, submitted resume, audit, skill comparison, private notes and decisions |
| /recruiter/interviews | Scheduling, rescheduling, outcome/feedback capture, calendar export and deep links |
| /recruiter/analytics | Actual stage distribution, activity windows and CSV snapshot |
| /recruiter/company | Company creation/editing, clearing optional fields and unsaved-change protection |
| /recruiter/notifications | Global unread count, filters and recruiter-specific destinations |
| /recruiter/settings | Real password/account settings; no invented billing or automation controls |

Existing route names and role guards remain intact.

## Workflow improvements
- Pipeline columns fetch actual candidates for each stage (first five per column) and link to the full paginated stage when there are more.
- Candidate search and minimum resume-score filtering happen in the database, within the authorized job. Stage totals use the same search/score filters across all stages.
- Saved views store filter criteria per user in this browser, with a visible local-storage explanation. They are accessible from the Applicants entry page and can be removed. They are not represented as organization-wide or server-synchronized.
- Applications move only through supported stages. Hiring/rejection require an explicit confirmation action; interview stage entry uses the existing scheduling transaction.
- Resume audits are labeled as resume-quality guidance, not job-fit predictions. Role skill coverage is explicitly an exact skill-name comparison, not a new AI model.
- Publishing failures retain the newly created draft ID, so retrying updates that draft rather than creating another job.
- Scheduling uses the browser's actual local time zone and converts to an ISO instant. Candidate instructions remain separate from private feedback and review notes.
- CSV exports state their scope. Applicant export covers the visible page; analytics export covers the snapshot. Spreadsheet formula-leading text is escaped.
- Optional company fields can actually be cleared; previous omission-based updates silently retained old values.
- The reporting window now starts six days before today. Stage distributions are current snapshots, not fabricated historical funnels or conversion rates.

The existing backend already updates application stage atomically when scheduling and emits notifications for supported events. No pretend automation rules, automatic hiring/rejection, AI draft generators or new billing system were introduced.

## Research references
Workflow inspiration came from job-specific pipeline visibility and saved filtering patterns documented by [Ashby](https://docs.ashbyhq.com/analytics-jobs-list-and-dashboard) and candidate filtering described by [Greenhouse](https://support.greenhouse.io/hc/en-us/articles/360043184152-Candidate-and-prospect-filters). HirePilot retains its own supported stages, data and permissions.

## Verification
- Frontend route tests render all twelve Recruiter routes through the actual route tree and shared shell.
- Interaction tests cover search, saved views, pipeline stages, private notes, job creation recovery, ownership handling, company prerequisites, interview scheduling/outcomes, notifications, settings and sidebar sign-out.
- Existing Candidate and authentication regression suites are retained.
- Backend tests cover ownership enforcement, recruiter-scoped query filters, stage aggregates, pagination, schema validation and optional company-field clearing.
- Read-only Prisma queries were executed against the configured database using a nonexistent scope. Job filtering, applicant filtering/sorting and aggregate stage queries succeeded without accessing user records or changing data.
- Responsive source review covers 320/768/1024/1440 layouts: navigation drawer below 900px, stacked forms and cards on small screens, horizontally scrollable applicant tables/pipeline, wrapped profile headers and stage labels.
- No browser was connected. The user elected to perform the visual browser review. Automated DOM tests do not establish pixel-level responsive correctness.
- Cloud resume-preview rendering and external meeting/notification delivery are not end-to-end verified here.

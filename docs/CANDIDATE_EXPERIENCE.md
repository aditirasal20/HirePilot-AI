# Candidate workspace

## Scope and design
All ten existing Candidate screens share the landing/auth Geist typography, off-white surfaces, green/lime accents, thin borders, rounded controls, and shared buttons and fields. The persistent workspace adds grouped navigation, functional job search, global unread indicators, a skip link, route focus management, and a native modal navigation drawer on narrow screens. No recruiter pages were redesigned.

## Audit findings and changes
- Jobs had truncated descriptions with no detail destination, transient filters, and a silent apply failure without a resume. Search/filter/page state now lives in the URL. Full role details lead to explicit resume selection and submission with duplicate/error handling and cache refresh.
- Dashboard recommendations were recent open jobs, not AI matches. They are now accurately described. Unsupported claims about parsing and keywords were removed.
- Applications had no detail destination. Candidates can now open the existing detail API, see the resume used and current status, and reach interviews or notifications. The API's actual appliedAt field is used.
- Resume Builder only managed PDFs. It is labeled My resumes in navigation and explains its actual functionality. Uploads validate PDF extension/MIME, empty files and the existing 5 MB limit. Naming, default selection, viewing and explicit deletion confirmation remain available.
- Resume audit used the first character of its query-key string, enabled duplicate submissions, and rendered failed jobs as results. The query key is corrected; pending/running controls are disabled and failed results offer a retry. Scores remain nullable and are not represented as ATS pass probabilities.
- Matching was limited to the first 50 roles and treated failed jobs as perpetually processing. Role search and pagination now support the full catalog, job/resume context transfers via URLs, and cached, pending, complete, failed and retry states are distinct.
- Interviews now distinguish local display time from the organizer's timezone, support every existing status, accept notification deep links, and export actual schedule details as UTF-8-safe ICS calendar files.
- Notification mark-all previously depended on unread items on the visible page. It now uses the global count; unread filtering, mutation errors and related-record navigation are supported.
- Profile moved from an inaccessible oversized modal to a labeled inline form with field constraints, save/discard feedback, navigation blocking and a before-unload guard.
- Settings had unsaved fake preferences and a broken password-reset link. It now uses the authenticated change-password API, current/new/confirmation validation, real account links, and sign-out.
- Candidate application/interview detail responses exposed private recruiter notes/feedback/scores. Candidate-only projections remove those fields; recruiter responses are unchanged.

## Routes
| Route | Purpose |
| --- | --- |
| /candidate/dashboard | Overview and next steps |
| /candidate/jobs | Search/filter open roles |
| /candidate/jobs/:jobId | Role details and resume-based application |
| /candidate/applications | Application tracking |
| /candidate/applications/:applicationId | Application details |
| /candidate/resume-builder | PDF resume library |
| /candidate/ai-resume-audit | Resume feedback and scores |
| /candidate/job-matching | Role-specific comparisons |
| /candidate/interviews | Schedule, meeting details and calendar export |
| /candidate/notifications | Updates and related records |
| /candidate/profile | Candidate profile editing |
| /candidate/settings | Account security and sign-out |

Existing /candidate/resume and /candidate/resume-ai links redirect to their canonical names while retaining query parameters. Existing authentication and role guards remain in place.

## Shared components
- components/candidate/Workspace.jsx: persistent app shell and navigation.
- components/candidate/CandidateLayout.jsx: page heading, description, actions and content.
- components/candidate/ui.jsx: panels, query states, empty states, status badges, selectors, pagination, skill tags, scores and safe external links.
- components/ui/: original shared Brand, Button, TextField, PasswordField and FormNotice.
- styles/design-system.css: application-wide semantic tokens.
- styles/candidate.css: scoped workspace and responsive layouts; recruiter styles are unaffected.
- hooks/useCandidate.js: resume selection, URL parameters and mutation invalidation.
- utils/candidate.js: status labels, validation, local notification destinations and calendar generation.

## Verification
Automated tests cover all Candidate page families, selected-resume submissions, duplicate/closed/no-resume paths, filters, correct dates, upload validation, failed/pending AI states, cached match results, global notification counts, profile saving/navigation blocking, password confirmation and route aliases. Existing auth regressions remain included. Server tests cover Candidate response privacy and ownership.

Browser runtime discovery returned no available browser in this session. Desktop/tablet/mobile breakpoints are implemented but visual browser verification remains outstanding. AI worker/cloud upload integrations were not exercised end-to-end; the pages use the existing API contracts without simulated production results.

Final checks: 54 frontend tests and 19 server tests passed; targeted Candidate ESLint and production build passed. Git whitespace check passed. Vite retains a non-blocking large-bundle advisory (approximately 634 kB JavaScript before gzip).

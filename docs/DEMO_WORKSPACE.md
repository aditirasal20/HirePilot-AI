# Demo hiring workspace

Created for local product testing. These accounts, vacancies, resumes, applications, and interview outcomes are fictional. Company names and logos identify the inspiration, not an affiliation. Company records are explicitly marked Demo and are not verified.

## Included
- Five recruiter accounts, each with two OPEN jobs.
- Five candidate accounts, each with a readable PDF resume and completed profile basics.
- Thirty applications: five each in APPLIED, REVIEWING, SHORTLISTED, REJECTED, INTERVIEW_SCHEDULED, and HIRED.
- Five future onsite sample interviews in Asia/Kolkata and five completed interview records supporting the hired outcomes.
- Thirty-five in-app notifications. No email invitations or real meetings are sent.
- AI scores are unset; resume analysis remains IDLE until the actual AI workflow is run.

## Access
Log in at http://localhost:5174/login using the email and password in the local, Git-ignored file `server/.demo-output/accounts.json`. Passwords are bcrypt-hashed in the database. The email addresses use the reserved `.example` domain.

## Scripts
Run from `server`:
- `node prisma/seed-demo-workspace.js`: additive seed; stops if the credential manifest already exists and rejects reserved email collisions. Disabled when NODE_ENV is production. Never resets existing users.
- `node prisma/verify-demo-workspace.js`: checks all ten logins, role dashboards, linked detail endpoints, assets, and application/interview consistency. Test sessions are logged out afterward.

Resumes and downloaded company logos are served from `client/public/demo/hiring`. Resume URLs target localhost:5174; update the five demo resume URLs if changing the frontend origin.
The optional resume generator requires ReportLab and PyMuPDF in `server/.demo-tools`; invoke `python server/prisma/create-demo-assets.py` from the project root. Generated PDF previews and credentials remain in the ignored output folder.

## Company overview sources
Descriptions are short paraphrases; job descriptions and compensation are original illustrative examples, not scraped vacancies.
- Google: https://about.google/company-info/philosophy/
- Razorpay: https://razorpay.com/about/
- BrowserStack: https://www.browserstack.com/company
- Atlassian: https://www.atlassian.com/company
- Freshworks: https://www.freshworks.com/company/about/

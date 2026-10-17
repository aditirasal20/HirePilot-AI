# HirePilot design system

The landing page, authentication, Candidate and Recruiter workspaces share the same opt-in theme. Admin pages retain their existing styling.

## Foundations

Import `src/styles/design-system.css` once (already done in `main.jsx`). Wrap new surfaces in `hp-theme`; the landing page uses `hp-landing`.

- Typography: Geist with Arial/system fallback.
- Colors: `--hp-canvas`, `--hp-surface`, `--hp-surface-soft`, `--hp-ink`, `--hp-muted`, `--hp-line`.
- Actions: `--hp-action`, `--hp-action-hover`, `--hp-lime`, `--hp-focus`.
- Feedback: `--hp-green`, `--hp-error`, `--hp-error-surface`.
- Radius: `--hp-radius-sm/md/lg/xl` (6/10/16/24 px).
- Spacing: `--hp-space-1/2/3/4/6/8` (4/8/12/16/24/32 px).
- Elevation: `--hp-shadow`.

Use CSS variables for surface styling and Tailwind for layout. Tokens are scoped, so importing them does not recolor other app pages. The theme is deliberately light regardless of the dashboard's current theme preference.

## Components

From `src/components/ui`:

- `Brand`: home link and shared wordmark.
- `Button`: button or router link via `to`; variants `dark`, `outline`, `lime`; supports `loading`, `disabled`, and native button props. Use `hp-button-full` for form actions.
- `TextField`: connected label, generated or supplied ID, hint, field error, native input props, and optional end adornment.
- `PasswordField`: TextField with an accessible show/hide toggle. Supply `autoComplete="current-password"` or `"new-password"`.
- `FormNotice`: `error`, `success`, or `info` tone. Errors receive focus; status messages are announced.

Authentication composes these through `AuthCard`, `RoleSelector`, and `useAuthForm`. The form hook validates on blur/submit, prevents duplicate submission, focuses the first invalid field, and renders server errors.

## Example

```jsx
<div className="hp-theme">
  <TextField
    label="Email address"
    name="email"
    type="email"
    autoComplete="email"
  />
  <Button type="submit" loading={pending}>
    Continue
  </Button>
</div>
```

Keep visible focus styles, sufficient contrast, label associations, reduced-motion handling, and mobile touch targets when adopting these components elsewhere. Font loading uses Google Fonts with a fallback; self-host Geist if offline or network-independent typography is required.

## Candidate workspace adoption

The Candidate shell and every Candidate route use the shared theme. Reusable panels, loading/error/empty states, status badges, selectors, pagination, score displays and safe external links are in src/components/candidate/ui.jsx. Workspace styles are scoped in src/styles/candidate.css. See [Candidate experience](CANDIDATE_EXPERIENCE.md) for route coverage, workflows and verification limits.

## Recruiter workspace adoption

Candidate and Recruiter now compose the same shell and primitives in src/components/workspace. Candidate imports remain compatible through wrapper exports. Recruiter-specific pipeline and reporting styles live in src/styles/recruiter.css. See [Recruiter experience](RECRUITER_EXPERIENCE.md) for supported workflows, route coverage and verification.

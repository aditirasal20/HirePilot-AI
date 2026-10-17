import { labelOf } from "../../utils/candidate";
import { useId } from "react";
import Button from "../ui/Button";
export { default as Button } from "../ui/Button";
export { default as TextField } from "../ui/TextField";
export { default as Notice } from "../ui/FormNotice";
export function Panel({
  title,
  description,
  action,
  children,
  className = "",
}) {
  return (
    <section className={"c-panel " + className}>
      {(title || action) && (
        <header className="c-panel-heading">
          <div>
            {title && <h2>{title}</h2>}
            {description && <p>{description}</p>}
          </div>
          {action}
        </header>
      )}
      {children}
    </section>
  );
}
export function Empty({ title, description, to, action }) {
  return (
    <div className="c-empty">
      <div className="c-empty-mark" aria-hidden="true" />
      <h3>{title}</h3>
      <p>{description}</p>
      {to && (
        <Button to={to} variant="outline">
          {action}
        </Button>
      )}
    </div>
  );
}
export function QueryState({
  query,
  children,
  label = "Loading your workspace",
}) {
  if (query.isPending && query.fetchStatus !== "idle")
    return (
      <div className="c-loading" role="status">
        <span className="hp-spinner" />
        {label}
      </div>
    );
  if (query.isError)
    return (
      <div className="c-error" role="alert">
        <h3>We couldn't load this information.</h3>
        <p>{query.error?.message || "Please try again."}</p>
        <Button variant="outline" onClick={() => query.refetch()}>
          Try again
        </Button>
      </div>
    );
  return children;
}
export function Badge({ value, children }) {
  const tone = ["COMPLETED", "HIRED", "SHORTLISTED", "HIGH", "OPEN"].includes(
    value,
  )
    ? "positive"
    : ["FAILED", "REJECTED", "CANCELLED", "NO_SHOW"].includes(value)
      ? "negative"
      : [
            "PROCESSING",
            "QUEUED",
            "REVIEWING",
            "INTERVIEW_SCHEDULED",
            "SCHEDULED",
            "RESCHEDULED",
          ].includes(value)
        ? "pending"
        : "neutral";
  return (
    <span className={"c-badge c-badge-" + tone}>
      {children || labelOf(value)}
    </span>
  );
}
export function Select({ label, children, id, ...props }) {
  const auto = useId();
  return (
    <label className="c-field" htmlFor={id || auto}>
      <span>{label}</span>
      <select id={id || auto} {...props}>
        {children}
      </select>
    </label>
  );
}
export function Pager({ pagination = {}, page = 1, onChange }) {
  const pages = pagination.totalPages || 1;
  return pages > 1 || page > 1 ? (
    <nav className="c-pager" aria-label="Pagination">
      <span>
        Page {page} of {pages}
      </span>
      <div className="c-actions">
        <Button
          variant="outline"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          disabled={page >= pages}
          onClick={() => onChange(page + 1)}
        >
          Next
        </Button>
      </div>
    </nav>
  ) : null;
}
export function Tags({ items = [], empty = "None reported" }) {
  return items.length ? (
    <div className="c-tags">
      {items.map((x, i) => (
        <span key={i}>{x}</span>
      ))}
    </div>
  ) : (
    <p className="c-muted">{empty}</p>
  );
}
export function Score({ value, label }) {
  return (
    <div className="c-score">
      <span>{label}</span>
      <strong>
        {value == null ? "Not scored" : Math.round(value)}
        {value != null && <small>/100</small>}
      </strong>
      {value != null && (
        <meter min="0" max="100" value={value} aria-label={label} />
      )}
    </div>
  );
}
export function ExternalLink({ href, children, className = "c-text-link" }) {
  let valid = false;
  try {
    valid = ["http:", "https:"].includes(new URL(href).protocol);
  } catch {
    /* invalid URLs are not made interactive */
  }
  return valid ? (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
    >
      {children}
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  ) : null;
}

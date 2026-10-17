import { Link } from "react-router-dom";
export default function Button({
  to,
  variant = "dark",
  className = "",
  children,
  loading = false,
  disabled = false,
  type = "button",
  ...props
}) {
  const classes = `hp-button hp-button-${variant} ${className}`;
  if (to)
    return (
      <Link to={to} className={classes} {...props}>
        {children}
      </Link>
    );
  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <span className="hp-spinner" aria-hidden="true" />}
      {children}
    </button>
  );
}

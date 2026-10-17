import { useId } from "react";
export default function TextField({
  label,
  error,
  hint,
  id,
  endAdornment,
  className = "",
  ...props
}) {
  const generatedId = useId();
  const fieldId = id || generatedId;
  const message = typeof error === "string" ? error : error?.message;
  return (
    <div className="hp-field">
      <label htmlFor={fieldId}>{label}</label>
      <div className="hp-input-wrap">
        <input
          id={fieldId}
          className={`hp-input ${endAdornment ? "hp-input-adorned" : ""} ${className}`}
          aria-invalid={!!message}
          aria-describedby={
            [hint && `${fieldId}-hint`, message && `${fieldId}-error`]
              .filter(Boolean)
              .join(" ") || undefined
          }
          {...props}
        />
        {endAdornment}
      </div>
      {hint && (
        <p id={`${fieldId}-hint`} className="hp-field-hint">
          {hint}
        </p>
      )}
      {message && (
        <p id={`${fieldId}-error`} className="hp-field-error">
          {message}
        </p>
      )}
    </div>
  );
}

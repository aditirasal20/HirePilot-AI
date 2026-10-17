import { UserRound, Building2, Check } from "lucide-react";
import { ROLES } from "../../types/roles";
const options = [
  {
    value: ROLES.CANDIDATE,
    label: "Candidate",
    detail: "Find my next role",
    icon: UserRound,
  },
  {
    value: ROLES.RECRUITER,
    label: "Recruiter",
    detail: "Find my next hire",
    icon: Building2,
  },
];
export default function RoleSelector({ value, onChange, disabled, error }) {
  return (
    <fieldset
      className="hp-role-field"
      disabled={disabled}
      aria-describedby={error ? "role-error" : undefined}
    >
      <legend>I want to join as</legend>
      <div className="hp-role-options">
        {options.map(({ value: role, label, detail, icon: Icon }) => (
          <label key={role} className="hp-role-option">
            <input
              type="radio"
              name="role"
              value={role}
              checked={value === role}
              onChange={() => onChange(role)}
            />
            <span className="hp-role-surface">
              <Icon size={19} strokeWidth={1.5} />
              <strong>{label}</strong>
              <span>{detail}</span>
              <Check className="hp-role-check" size={14} />
            </span>
          </label>
        ))}
      </div>
      {error && (
        <p className="hp-field-error" id="role-error">
          {error}
        </p>
      )}
    </fieldset>
  );
}

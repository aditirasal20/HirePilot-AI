import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import TextField from "./TextField";
export default function PasswordField({
  label = "Password",
  disabled,
  ...props
}) {
  const [visible, setVisible] = useState(false);
  return (
    <TextField
      {...props}
      label={label}
      disabled={disabled}
      type={visible ? "text" : "password"}
      endAdornment={
        <button
          type="button"
          className="hp-password-toggle"
          disabled={disabled}
          aria-label={`${visible ? "Hide" : "Show"} ${label.toLowerCase()}`}
          aria-pressed={visible}
          onClick={() => setVisible(!visible)}
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      }
    />
  );
}

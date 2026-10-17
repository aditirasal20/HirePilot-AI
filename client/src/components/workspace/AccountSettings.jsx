import { useState } from "react";
import Page from "./Page";
import {
  Panel,
  Button,
  TextField,
  Notice,
} from "../../components/candidate/ui";
import PasswordField from "../../components/ui/PasswordField";
import { useAuth } from "../../contexts/AuthContext";
export default function AccountSettings({ role = "candidate" }) {
  const { user, changePassword } = useAuth();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [values, setValues] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    const next = {};
    if (!values.currentPassword)
      next.currentPassword = "Enter your current password.";
    if (values.newPassword.length < 8)
      next.newPassword = "Use at least 8 characters.";
    else if (new TextEncoder().encode(values.newPassword).length > 72)
      next.newPassword = "Use 72 bytes or fewer.";
    else if (values.newPassword === values.currentPassword)
      next.newPassword = "Choose a different password.";
    if (values.newPassword !== values.confirmPassword)
      next.confirmPassword = "Passwords do not match.";
    setErrors(next);
    if (Object.keys(next).length) {
      e.currentTarget.elements.namedItem(Object.keys(next)[0])?.focus();
      return;
    }
    setError("");
    setBusy(true);
    try {
      await changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
    } catch (err) {
      setError(err.message || "Could not update your password.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <Page
      eyebrow={
        role === "recruiter" ? "Your hiring workspace" : "Your career workspace"
      }
      title="Make yourself at home."
      description="Manage your account and keep your sign-in secure."
    >
      <div className="c-split">
        <Panel
          title="Change password"
          description="Choose a password you don't use elsewhere. You'll sign in again after updating it."
        >
          <form className="c-stack" onSubmit={submit} noValidate>
            {[
              ["currentPassword", "Current password", "current-password"],
              ["newPassword", "New password", "new-password"],
              ["confirmPassword", "Confirm new password", "new-password"],
            ].map(([name, label, autoComplete]) => (
              <PasswordField
                key={name}
                name={name}
                label={label}
                autoComplete={autoComplete}
                value={values[name]}
                error={errors[name]}
                hint={
                  name === "newPassword" ? "At least 8 characters." : undefined
                }
                onChange={(e) => {
                  setValues({ ...values, [name]: e.target.value });
                  setErrors({ ...errors, [name]: "" });
                }}
                required
              />
            ))}
            {error && <Notice>{error}</Notice>}
            <div>
              <Button type="submit" loading={busy}>
                Update password
              </Button>
            </div>
          </form>
        </Panel>
        <div className="c-stack">
          <Panel title="Account details">
            <div className="c-stack">
              <TextField label="Email" value={user?.email || ""} readOnly />
              <TextField
                label="Account type"
                value={role === "recruiter" ? "Recruiter" : "Candidate"}
                readOnly
              />
              <Button
                variant="outline"
                to={
                  role === "recruiter"
                    ? "/recruiter/company"
                    : "/candidate/profile"
                }
              >
                {role === "recruiter" ? "Manage company" : "Edit profile"}
              </Button>
            </div>
          </Panel>
        </div>
      </div>
    </Page>
  );
}

import { Link, useNavigate, useSearchParams } from "react-router-dom";
import AuthCard from "./AuthCard";
import Button from "../ui/Button";
import PasswordField from "../ui/PasswordField";
import FormNotice from "../ui/FormNotice";
import useAuthForm from "../../hooks/useAuthForm";
import { resetSchema } from "../../utils/auth";
import authApi from "../../api/auth.api";
export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get("token");
  const navigate = useNavigate();
  const form = useAuthForm({
    schema: resetSchema,
    initialValues: { password: "", confirmPassword: "" },
    onSubmit: async (data) => {
      if (!token) throw new Error("Request a new reset link first.");
      await authApi.resetPassword({ token, ...data });
      navigate("/login", {
        replace: true,
        state: {
          message: "Your password was updated. Log in with your new password.",
        },
      });
    },
  });
  return (
    <AuthCard
      title="Set a new password."
      subtitle="Choose a unique password to keep your account secure."
    >
      {!token ? (
        <>
          <FormNotice>
            This link is incomplete. Please request a new password reset link.
          </FormNotice>
          <Button to="/forgot-password" className="hp-button-full">
            Request a new link
          </Button>
        </>
      ) : (
        <form noValidate onSubmit={form.handleSubmit} className="hp-auth-form">
          <PasswordField
            label="New password"
            autoComplete="new-password"
            hint="At least 8 characters."
            required
            {...form.field("password")}
          />
          <PasswordField
            label="Confirm password"
            autoComplete="new-password"
            required
            {...form.field("confirmPassword")}
          />
          <FormNotice>{form.submitError}</FormNotice>
          <Button
            type="submit"
            loading={form.pending}
            className="hp-button-full"
          >
            {form.pending ? "Updating..." : "Update password"}
          </Button>
        </form>
      )}
      <p className="hp-auth-alternative">
        <Link to="/login">Back to login</Link>
      </p>
    </AuthCard>
  );
}

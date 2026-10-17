import { Link, useLocation, useNavigate } from "react-router-dom";
import AuthCard from "../../components/auth/AuthCard";
import RoleSelector from "../../components/auth/RoleSelector";
import Button from "../../components/ui/Button";
import TextField from "../../components/ui/TextField";
import PasswordField from "../../components/ui/PasswordField";
import FormNotice from "../../components/ui/FormNotice";
import { useAuth } from "../../contexts/AuthContext";
import { ROLES } from "../../types/roles";
import useAuthForm from "../../hooks/useAuthForm";
import { registerSchema } from "../../utils/auth";
export default function Register() {
  const navigate = useNavigate();
  const location = useLocation();
  const { register } = useAuth();
  const form = useAuthForm({
    schema: registerSchema,
    initialValues: {
      fullName: "",
      email: "",
      password: "",
      role: ROLES.CANDIDATE,
    },
    onSubmit: async (data) => {
      const result = await register(data);
      if (result.requiresEmailVerification) {
        navigate(`/verify-email?email=${encodeURIComponent(data.email)}`, {
          replace: true,
          state: {
            message: result.emailDeliveryFailed
              ? "Your account was created, but we couldn't send the verification email. Request a new one below."
              : "Your account was created. Check your email for the verification link.",
          },
        });
      } else {
        navigate("/login", {
          replace: true,
          state: {
            email: data.email,
            from: location.state?.from,
            message: "Your account is ready. Log in to get started.",
          },
        });
      }
    },
  });
  return (
    <AuthCard
      mode="register"
      title="Make your next move."
      subtitle="Create your account. Find your opportunity or your next great hire."
    >
      <form
        noValidate
        onSubmit={form.handleSubmit}
        className="hp-auth-form"
        aria-busy={form.pending}
      >
        <TextField
          label="Full name"
          autoComplete="name"
          placeholder="Your full name"
          required
          {...form.field("fullName")}
        />
        <TextField
          label="Email address"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          required
          {...form.field("email")}
        />
        <PasswordField
          autoComplete="new-password"
          placeholder="Create a password"
          hint="At least 8 characters. Use a unique password."
          required
          {...form.field("password")}
        />
        <RoleSelector
          value={form.values.role}
          onChange={(role) => form.setField("role", role)}
          disabled={form.pending}
          error={form.errors.role}
        />
        <FormNotice>{form.submitError}</FormNotice>
        <Button type="submit" loading={form.pending} className="hp-button-full">
          {form.pending ? "Creating your account..." : "Create account"}
        </Button>
      </form>
      <p className="hp-auth-alternative">
        Already have an account?{" "}
        <Link to="/login" state={{ from: location.state?.from }}>
          Log in
        </Link>
      </p>
    </AuthCard>
  );
}

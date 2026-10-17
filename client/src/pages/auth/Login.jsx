import { Link, useLocation, useNavigate } from "react-router-dom";
import AuthCard from "../../components/auth/AuthCard";
import Button from "../../components/ui/Button";
import TextField from "../../components/ui/TextField";
import PasswordField from "../../components/ui/PasswordField";
import FormNotice from "../../components/ui/FormNotice";
import { useAuth } from "../../contexts/AuthContext";
import useAuthForm from "../../hooks/useAuthForm";
import { loginSchema, getAuthDestination } from "../../utils/auth";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, sessionNotice } = useAuth();
  const form = useAuthForm({
    schema: loginSchema,
    initialValues: { email: location.state?.email || "", password: "" },
    onSubmit: async (credentials) => {
      const { user } = await login(credentials);
      navigate(getAuthDestination(user.role, location.state?.from), {
        replace: true,
      });
    },
  });
  return (
    <AuthCard
      title="Welcome back."
      subtitle="Your next great fit is waiting. Let's pick up where you left off."
    >
      <FormNotice tone="success">
        {location.state?.message || sessionNotice}
      </FormNotice>
      <form
        noValidate
        onSubmit={form.handleSubmit}
        className="hp-auth-form"
        aria-busy={form.pending}
      >
        <TextField
          label="Email address"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          required
          {...form.field("email")}
        />
        <div>
          <PasswordField
            autoComplete="current-password"
            placeholder="Enter your password"
            required
            {...form.field("password")}
          />
          <div className="hp-forgot-link">
            <Link to="/forgot-password">Forgot password?</Link>
          </div>
        </div>
        <FormNotice>{form.submitError}</FormNotice>
        {form.submitError.toLowerCase().includes("verify your email") && (
          <Link
            className="hp-text-link"
            to={`/verify-email?email=${encodeURIComponent(form.values.email)}`}
          >
            Request a verification email
          </Link>
        )}
        <Button type="submit" loading={form.pending} className="hp-button-full">
          {form.pending ? "Logging in..." : "Log in"}
        </Button>
      </form>
      <p className="hp-auth-alternative">
        New to HirePilot?{" "}
        <Link to="/register" state={{ from: location.state?.from }}>
          Create an account
        </Link>
      </p>
    </AuthCard>
  );
}

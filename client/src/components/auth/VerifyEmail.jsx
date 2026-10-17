import { useEffect, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import AuthCard from "./AuthCard";
import Button from "../ui/Button";
import TextField from "../ui/TextField";
import FormNotice from "../ui/FormNotice";
import useAuthForm from "../../hooks/useAuthForm";
import { emailSchema } from "../../utils/auth";
import authApi from "../../api/auth.api";
export default function VerifyEmail() {
  const [params] = useSearchParams();
  const token = params.get("token");
  const location = useLocation();
  const [result, setResult] = useState({
    status: token ? "loading" : "idle",
    message: "",
  });
  useEffect(() => {
    if (!token) return;
    let active = true;
    authApi.verifyEmail({ token }).then(
      () => {
        if (active)
          setResult({
            status: "success",
            message: "Your email is verified. You can now log in.",
          });
      },
      (error) => {
        if (active) setResult({ status: "error", message: error.message });
      },
    );
    return () => {
      active = false;
    };
  }, [token]);
  const form = useAuthForm({
    schema: emailSchema,
    initialValues: { email: params.get("email") || "" },
    onSubmit: async (data) => {
      const response = await authApi.resendVerification(data);
      setResult({ status: "sent", message: response.message });
    },
  });
  return (
    <AuthCard
      title={
        result.status === "success" ? "Email verified." : "Verify your email."
      }
      subtitle="One more step to connect your email to your account."
    >
      <FormNotice tone="info">{location.state?.message}</FormNotice>
      {result.status === "loading" ? (
        <p role="status">Verifying your email...</p>
      ) : result.status === "success" ? (
        <>
          <FormNotice tone="success">{result.message}</FormNotice>
          <Button to="/login" className="hp-button-full">
            Continue to login
          </Button>
        </>
      ) : (
        <form noValidate onSubmit={form.handleSubmit} className="hp-auth-form">
          <FormNotice tone={result.status === "error" ? "error" : "success"}>
            {result.message}
          </FormNotice>
          <TextField
            label="Email address"
            type="email"
            autoComplete="email"
            required
            {...form.field("email")}
          />
          <FormNotice>{form.submitError}</FormNotice>
          <Button
            type="submit"
            loading={form.pending}
            className="hp-button-full"
          >
            {form.pending ? "Sending..." : "Send verification email"}
          </Button>
        </form>
      )}
      <p className="hp-auth-alternative">
        <Link to="/login">Back to login</Link>
      </p>
    </AuthCard>
  );
}

import { useState } from "react";
import { Link } from "react-router-dom";
import AuthCard from "./AuthCard";
import Button from "../ui/Button";
import TextField from "../ui/TextField";
import FormNotice from "../ui/FormNotice";
import useAuthForm from "../../hooks/useAuthForm";
import { emailSchema } from "../../utils/auth";
import authApi from "../../api/auth.api";
export default function ForgotPassword() {
  const [message, setMessage] = useState("");
  const form = useAuthForm({
    schema: emailSchema,
    initialValues: { email: "" },
    onSubmit: async (data) => {
      const result = await authApi.forgotPassword(data);
      setMessage(result.message);
    },
  });
  return (
    <AuthCard
      title="A fresh start."
      subtitle="Enter your account email to request a password reset link."
    >
      {message ? (
        <>
          <FormNotice tone="success">{message}</FormNotice>
          <Button to="/login" className="hp-button-full">
            Return to login
          </Button>
        </>
      ) : (
        <form noValidate onSubmit={form.handleSubmit} className="hp-auth-form">
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
            {form.pending ? "Sending..." : "Send reset link"}
          </Button>
        </form>
      )}
      <p className="hp-auth-alternative">
        <Link to="/login">Back to login</Link>
      </p>
    </AuthCard>
  );
}

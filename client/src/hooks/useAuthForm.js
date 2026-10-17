import { useRef, useState } from "react";
import { getFieldErrors } from "../utils/auth";
export default function useAuthForm({ schema, initialValues, onSubmit }) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [pending, setPending] = useState(false);
  const submitting = useRef(false);
  const setField = (name, value) => {
    setValues((previous) => ({ ...previous, [name]: value }));
    setErrors((previous) => ({ ...previous, [name]: undefined }));
    setSubmitError("");
  };
  const field = (name) => ({
    name,
    value: values[name],
    disabled: pending,
    error: errors[name],
    onChange: (event) => setField(name, event.target.value),
    onBlur: () =>
      setErrors((previous) => ({
        ...previous,
        [name]: getFieldErrors(schema.safeParse(values))[name],
      })),
  });
  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting.current) return;
    const form = event.currentTarget;
    const result = schema.safeParse(values);
    const nextErrors = getFieldErrors(result);
    setErrors(nextErrors);
    setSubmitError("");
    if (!result.success) {
      form.elements.namedItem(Object.keys(nextErrors)[0])?.focus();
      return;
    }
    submitting.current = true;
    setPending(true);
    try {
      await onSubmit(result.data);
    } catch (error) {
      setSubmitError(
        error?.message || "Something went wrong. Please try again.",
      );
    } finally {
      submitting.current = false;
      setPending(false);
    }
  };
  return {
    values,
    errors,
    field,
    setField,
    handleSubmit,
    pending,
    submitError,
  };
}

import { useEffect, useState } from "react";
import { useBlocker } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import CandidateLayout from "../../components/candidate/CandidateLayout";
import {
  Panel,
  Button,
  TextField,
  Notice,
  QueryState,
} from "../../components/candidate/ui";
import { useCandidateMutation } from "../../hooks/useCandidate";
import candidateProfileApi from "../../api/candidateProfile.api";
import { useAuth } from "../../contexts/AuthContext";
import { QUERY_KEYS } from "../../config/constants";
const fields = [
  "phone",
  "bio",
  "location",
  "currentPosition",
  "yearsOfExperience",
  "expectedSalary",
  "githubUrl",
  "linkedinUrl",
  "portfolioUrl",
];
const toForm = (p) =>
  Object.fromEntries(
    fields.map((k) => [k, p?.[k] == null ? "" : String(p[k])]),
  );
function ProfileForm({ profile }) {
  const { user } = useAuth();
  const [initial, setInitial] = useState(() => toForm(profile));
  const [form, setForm] = useState(initial);
  const [saved, setSaved] = useState(false);
  const dirty = JSON.stringify(initial) !== JSON.stringify(form);
  const mutation = useCandidateMutation(
    candidateProfileApi.updateMyCandidateProfile,
    [QUERY_KEYS.CANDIDATE_PROFILE, QUERY_KEYS.DASHBOARD],
    (data, values) => {
      const next = toForm(data || values);
      setInitial(next);
      setForm(next);
      setSaved(true);
    },
  );
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      dirty &&
      !mutation.isSuccess &&
      currentLocation.pathname !== nextLocation.pathname,
  );
  useEffect(() => {
    if (!dirty) return;
    const warn = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  const field = (name, label, extra = {}) => (
    <TextField
      label={label}
      name={name}
      disabled={mutation.isPending}
      value={form[name]}
      onChange={(e) => {
        setForm({ ...form, [name]: e.target.value });
        setSaved(false);
        mutation.reset();
      }}
      {...extra}
    />
  );
  const submit = (e) => {
    e.preventDefault();
    const payload = Object.fromEntries(
      fields.map((k) => [
        k,
        form[k].trim() === ""
          ? null
          : ["yearsOfExperience", "expectedSalary"].includes(k)
            ? Number(form[k])
            : form[k].trim(),
      ]),
    );
    if (!mutation.isPending) mutation.mutate(payload);
  };
  return (
    <Panel>
      <form onSubmit={submit}>
        <section className="c-form-section">
          <div>
            <h2>Your identity</h2>
            <p>This is the account attached to your applications.</p>
          </div>
          <div className="c-grid-2">
            <TextField
              label="Full name"
              value={user?.fullName || ""}
              readOnly
            />
            <TextField
              label="Email address"
              value={user?.email || ""}
              readOnly
            />
          </div>
        </section>
        <section className="c-form-section">
          <div>
            <h2>The essentials</h2>
            <p>Give hiring teams a clear picture of you and your experience.</p>
          </div>
          <div className="c-stack">
            <div className="c-grid-2">
              {field("currentPosition", "Current role", {
                maxLength: 100,
                placeholder: "e.g. Frontend developer",
              })}
              {field("location", "Location", {
                maxLength: 100,
                autoComplete: "address-level2",
              })}
              {field("phone", "Phone number", {
                type: "tel",
                maxLength: 20,
                autoComplete: "tel",
              })}
              {field("yearsOfExperience", "Years of experience", {
                type: "number",
                min: 0,
                step: 1,
              })}
            </div>
            <label className="c-field">
              <span>About you</span>
              <textarea
                disabled={mutation.isPending}
                name="bio"
                value={form.bio}
                maxLength={1000}
                onChange={(e) => {
                  setForm({ ...form, bio: e.target.value });
                  setSaved(false);
                  mutation.reset();
                }}
                placeholder="What you do, what you've built, and what you're looking for."
              />
              <span className="c-muted">{form.bio.length}/1000 characters</span>
            </label>
            {field("expectedSalary", "Expected annual salary (USD)", {
              type: "number",
              min: 0,
              step: 1,
            })}
          </div>
        </section>
        <section className="c-form-section">
          <div>
            <h2>Your work, online</h2>
            <p>Connect the work and profiles that tell your story.</p>
          </div>
          <div className="c-stack">
            {field("linkedinUrl", "LinkedIn URL", {
              type: "url",
              pattern: "https?://.+",
              placeholder: "https://linkedin.com/in/your-name",
            })}
            {field("githubUrl", "GitHub URL", {
              type: "url",
              pattern: "https?://.+",
              placeholder: "https://github.com/your-name",
            })}
            {field("portfolioUrl", "Portfolio URL", {
              type: "url",
              pattern: "https?://.+",
              placeholder: "https://your-website.com",
            })}
          </div>
        </section>
        {mutation.error && <Notice>{mutation.error.message}</Notice>}
        {saved && (
          <Notice tone="success">Your profile has been updated.</Notice>
        )}
        <div className="c-savebar">
          <p className="c-muted">
            {dirty
              ? "You have unsaved changes."
              : "Your profile is up to date."}
          </p>
          <div className="c-actions">
            <Button
              variant="outline"
              disabled={!dirty || mutation.isPending}
              onClick={() => {
                setForm(initial);
                mutation.reset();
              }}
            >
              Discard changes
            </Button>
            <Button
              type="submit"
              disabled={!dirty}
              loading={mutation.isPending}
            >
              Save profile
            </Button>
          </div>
        </div>
      </form>
      {blocker.state === "blocked" && (
        <div className="c-confirm" role="alert" style={{ marginTop: 20 }}>
          <p>
            You have unsaved changes. Save your profile or discard them before
            leaving.
          </p>
          <div className="c-actions">
            <Button onClick={() => blocker.reset()}>Keep editing</Button>
            <Button variant="outline" onClick={() => blocker.proceed()}>
              Discard and leave
            </Button>
          </div>
        </div>
      )}
    </Panel>
  );
}
export default function Profile() {
  const query = useQuery({
    queryKey: QUERY_KEYS.CANDIDATE_PROFILE,
    queryFn: candidateProfileApi.getMyCandidateProfile,
  });
  return (
    <CandidateLayout
      title="Tell your story."
      description="A thoughtful profile helps the right hiring teams see your potential."
    >
      <QueryState query={query}>
        {query.isSuccess && <ProfileForm profile={query.data} />}
      </QueryState>
    </CandidateLayout>
  );
}

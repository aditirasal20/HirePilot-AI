import { useEffect, useState } from "react";
import { useBlocker } from "react-router-dom";
import RecruiterLayout from "../../components/recruiter/RecruiterLayout";
import {
  Panel,
  Button,
  TextField,
  Notice,
  QueryState,
} from "../../components/workspace/ui";
import {
  useCompany,
  useWorkspaceMutation,
  hiringKeys,
} from "../../hooks/useRecruiter";
import companyApi from "../../api/company.api";
import { QUERY_KEYS } from "../../config/constants";
const names = [
  "name",
  "description",
  "website",
  "logo",
  "industry",
  "companySize",
  "location",
];
const shape = (value) =>
  Object.fromEntries(names.map((k) => [k, String(value?.[k] ?? "")]));
function CompanyForm({ company }) {
  const [form, setForm] = useState(() => shape(company));
  const [baseline, setBaseline] = useState(() => shape(company));
  const [saved, setSaved] = useState(false);
  const dirty = JSON.stringify(form) !== JSON.stringify(baseline);
  const mutation = useWorkspaceMutation(
    (payload) =>
      company
        ? companyApi.updateCompany(company.id, payload)
        : companyApi.createCompany(payload),
    [QUERY_KEYS.COMPANY, ...hiringKeys],
    (data) => {
      const next = shape(data);
      setForm(next);
      setBaseline(next);
      setSaved(true);
    },
  );
  const blocker = useBlocker(dirty && !mutation.isPending);
  useEffect(() => {
    if (!dirty) return;
    const warn = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  const field = (name, label, props = {}) => (
    <TextField
      label={label}
      value={form[name]}
      disabled={mutation.isPending}
      onChange={(e) => {
        setForm({ ...form, [name]: e.target.value });
        setSaved(false);
      }}
      {...props}
    />
  );
  return (
    <Panel
      title={company ? "Your company profile" : "Introduce your company"}
      description="These details help candidates understand who's behind the opportunity."
    >
      <form
        className="c-stack"
        onSubmit={(e) => {
          e.preventDefault();
          if (mutation.isPending) return;
          const payload = Object.fromEntries(
            names.map((k) => [
              k,
              form[k].trim() === ""
                ? company
                  ? null
                  : undefined
                : k === "companySize"
                  ? Number(form[k])
                  : form[k].trim(),
            ]),
          );
          mutation.mutate(payload);
        }}
      >
        <section className="c-form-section">
          <div>
            <h2>The essentials</h2>
            <p>Set the context for every role you publish.</p>
          </div>
          <div className="c-stack">
            {field("name", "Company name", {
              required: true,
              minLength: 2,
              maxLength: 100,
            })}
            <div className="c-grid-2">
              {field("industry", "Industry", { maxLength: 100 })}
              {field("companySize", "Number of employees", {
                type: "number",
                min: 1,
                step: 1,
              })}
            </div>
            {field("location", "Company location", { maxLength: 100 })}
          </div>
        </section>
        <section className="c-form-section">
          <div>
            <h2>Your presence</h2>
            <p>
              Share your website, brand, and what makes your organization
              distinctive.
            </p>
          </div>
          <div className="c-stack">
            {field("website", "Website", {
              type: "url",
              pattern: "https?://.+",
              placeholder: "https://yourcompany.com",
            })}
            {field("logo", "Logo URL", {
              type: "url",
              pattern: "https?://.+",
              hint: "Use a publicly accessible image URL.",
            })}
            <label className="c-field">
              <span>About the company</span>
              <textarea
                value={form.description}
                maxLength={1000}
                disabled={mutation.isPending}
                onChange={(e) => {
                  setForm({ ...form, description: e.target.value });
                  setSaved(false);
                }}
              />
            </label>
          </div>
        </section>
        {mutation.error && <Notice>{mutation.error.message}</Notice>}
        {saved && <Notice tone="success">Company details saved.</Notice>}
        <div className="c-savebar">
          <p className="c-muted">
            {dirty
              ? "You have unsaved changes."
              : "Your company details are up to date."}
          </p>
          <div className="c-actions">
            <Button
              variant="outline"
              disabled={!dirty || mutation.isPending}
              onClick={() => setForm(baseline)}
            >
              Discard changes
            </Button>
            <Button
              type="submit"
              loading={mutation.isPending}
              disabled={!dirty}
            >
              {company ? "Save company" : "Create company"}
            </Button>
          </div>
        </div>
      </form>
      {blocker.state === "blocked" && (
        <div className="c-confirm">
          <p>Leave without saving your company changes?</p>
          <div className="r-confirm-buttons">
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
export default function Company() {
  const query = useCompany();
  return (
    <RecruiterLayout
      title="Put your company in perspective."
      description="Help candidates understand your organization before the first conversation."
      actions={
        query.data && (
          <Button variant="outline" to="/recruiter/jobs/create">
            Create a job
          </Button>
        )
      }
    >
      <QueryState query={query}>
        {query.isSuccess && (
          <CompanyForm key={query.data?.id || "new"} company={query.data} />
        )}
      </QueryState>
    </RecruiterLayout>
  );
}

import { useEffect, useState } from "react";
import { useBlocker, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Panel, Button, TextField, Select, Notice } from "../workspace/ui";
import jobApi from "../../api/job.api";
import { hiringKeys } from "../../hooks/useRecruiter";
import { QUERY_KEYS } from "../../config/constants";
const initial = (j) => ({
  title: j?.title || "",
  description: j?.description || "",
  location: j?.location || "",
  salaryMin: j?.salaryMin ?? "",
  salaryMax: j?.salaryMax ?? "",
  yearsOfExperience: j?.yearsOfExperience ?? "0",
  employmentType: j?.employmentType || "FULL_TIME",
  requiredSkills: j?.requiredSkills?.join(", ") || "",
});
export default function JobForm({ job }) {
  const navigate = useNavigate();
  const client = useQueryClient();
  const [form, setForm] = useState(() => initial(job));
  const [baseline, setBaseline] = useState(() => initial(job));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [savedId, setSavedId] = useState(job?.id || "");
  const dirty = JSON.stringify(form) !== JSON.stringify(baseline);
  const blocker = useBlocker(dirty && !busy);
  useEffect(() => {
    if (!dirty) return;
    const handler = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);
  const field = (name, label, props = {}) => (
    <TextField
      label={label}
      name={name}
      value={form[name]}
      disabled={busy}
      onChange={(e) => setForm({ ...form, [name]: e.target.value })}
      {...props}
    />
  );
  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    const publish = e.nativeEvent.submitter?.value === "publish";
    const payload = {
      ...form,
      title: form.title.trim(),
      location: form.location.trim(),
      description: form.description.trim(),
      salaryMin: Number(form.salaryMin),
      salaryMax: Number(form.salaryMax),
      yearsOfExperience: Number(form.yearsOfExperience),
      requiredSkills: [
        ...new Set(
          form.requiredSkills
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
        ),
      ],
    };
    if (
      payload.title.length < 3 ||
      payload.description.length < 20 ||
      payload.location.length < 2
    ) {
      setError(
        "Provide a title of at least 3 characters, a location of at least 2 characters, and a description of at least 20 characters.",
      );
      return;
    }
    if (!payload.requiredSkills.length) {
      setError("Add at least one required skill.");
      return;
    }
    if (payload.salaryMax < payload.salaryMin) {
      setError("Maximum salary must be at least the minimum salary.");
      return;
    }
    setError("");
    setBusy(true);
    let id = savedId;
    try {
      const result = id
        ? await jobApi.updateJob(id, payload)
        : await jobApi.createJob(payload);
      id = result.id;
      setSavedId(id);
      setBaseline({ ...form });
      if (publish) await jobApi.updateJobStatus(id, "OPEN");
      hiringKeys.forEach((key) => client.invalidateQueries({ queryKey: key }));
      client.invalidateQueries({ queryKey: [QUERY_KEYS.JOB_DETAIL, id] });
      navigate("/recruiter/jobs/" + id, { replace: !job });
    } catch (err) {
      setError(
        id && !job
          ? "Your draft is saved. " +
              err.message +
              " You can retry publishing or open the saved draft."
          : err.message,
      );
      hiringKeys.forEach((key) => client.invalidateQueries({ queryKey: key }));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Panel
      title={job ? "Edit role details" : "Define the opportunity"}
      description="Clear expectations help the right candidates recognize a good fit."
    >
      <form className="c-stack r-editor" onSubmit={submit}>
        <div className="c-grid-2">
          {field("title", "Job title", {
            required: true,
            minLength: 3,
            maxLength: 100,
            placeholder: "e.g. Senior product designer",
          })}
          {field("location", "Location", {
            required: true,
            minLength: 2,
            placeholder: "e.g. Remote · India",
          })}
          <Select
            label="Employment type"
            value={form.employmentType}
            disabled={busy}
            onChange={(e) =>
              setForm({ ...form, employmentType: e.target.value })
            }
          >
            {["FULL_TIME", "PART_TIME", "INTERNSHIP", "CONTRACT"].map((s) => (
              <option key={s} value={s}>
                {s.toLowerCase().replace("_", " ")}
              </option>
            ))}
          </Select>
          {field("yearsOfExperience", "Minimum years of experience", {
            required: true,
            type: "number",
            min: 0,
            step: 1,
          })}
          {field("salaryMin", "Minimum annual salary (USD)", {
            required: true,
            type: "number",
            min: 0,
          })}
          {field("salaryMax", "Maximum annual salary (USD)", {
            required: true,
            type: "number",
            min: 0,
          })}
        </div>
        <label className="c-field">
          <span>Job description</span>
          <textarea
            required
            minLength={20}
            disabled={busy}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Describe the role, responsibilities, and what success looks like."
          />
        </label>
        {field("requiredSkills", "Required skills", {
          required: true,
          placeholder: "e.g. Research, Figma, Prototyping",
          hint: "Separate skills with commas.",
        })}
        {error && <Notice>{error}</Notice>}
        <div className="r-form-footer">
          {!job ? (
            <>
              <Button type="submit" value="publish" loading={busy}>
                Publish job
              </Button>
              <Button
                type="submit"
                value="draft"
                variant="outline"
                disabled={busy}
              >
                Save draft
              </Button>
              {savedId && (
                <Button variant="outline" to={"/recruiter/jobs/" + savedId}>
                  Open saved draft
                </Button>
              )}
            </>
          ) : (
            <Button type="submit" value="save" loading={busy}>
              Save changes
            </Button>
          )}
          <Button
            variant="outline"
            to={job ? "/recruiter/jobs/" + job.id : "/recruiter/jobs"}
          >
            Cancel
          </Button>
        </div>
        <p className="c-muted">
          Publishing makes this role available to candidates. Drafts remain
          private to your workspace.
        </p>
      </form>
      {blocker.state === "blocked" && (
        <div className="c-confirm">
          <p>You have unsaved job details.</p>
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

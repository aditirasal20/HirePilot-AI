import { validateResumeFile } from "../../utils/candidate";
import { useRef, useState } from "react";
import CandidateLayout from "../../components/candidate/CandidateLayout";
import {
  Panel,
  Button,
  TextField,
  Notice,
  QueryState,
  Empty,
  Badge,
  ExternalLink,
  Tags,
} from "../../components/candidate/ui";
import {
  useSelectedResume,
  useCandidateMutation,
  resumeKeys,
} from "../../hooks/useCandidate";
import resumeApi from "../../api/resume.api";
import { formatDate } from "../../utils/format";
function ResumeDetail({ resume, onDeleted }) {
  const [confirm, setConfirm] = useState(false);
  const [saved, setSaved] = useState("");
  const rename = useCandidateMutation(
    (title) => resumeApi.updateResume(resume.id, { title }),
    resumeKeys,
    () => setSaved("Resume title updated."),
  );
  const makeDefault = useCandidateMutation(
    () => resumeApi.setDefaultResume(resume.id),
    resumeKeys,
    () => setSaved("Default resume updated."),
  );
  const remove = useCandidateMutation(
    () => resumeApi.deleteResume(resume.id),
    resumeKeys,
    onDeleted,
  );
  const busy = rename.isPending || makeDefault.isPending || remove.isPending;
  const error = rename.error || makeDefault.error || remove.error;
  return (
    <Panel
      title="Resume details"
      action={<Badge value={resume.analysisStatus} />}
    >
      <div className="c-stack">
        {saved && <Notice tone="success">{saved}</Notice>}
        {error && <Notice>{error.message}</Notice>}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const title = new FormData(e.currentTarget).get("title").trim();
            if (title.length >= 3 && !busy) rename.mutate(title);
          }}
          className="c-stack"
        >
          <TextField
            label="Resume title"
            name="title"
            defaultValue={resume.title || resume.originalFileName}
            minLength={3}
            maxLength={100}
            required
          />
          <div className="c-actions">
            <Button
              type="submit"
              variant="outline"
              loading={rename.isPending}
              disabled={busy}
            >
              Save title
            </Button>
            <ExternalLink href={resume.fileUrl}>View PDF</ExternalLink>
          </div>
        </form>
        <div>
          <h3>Extracted skills</h3>
          <div style={{ marginTop: 12 }}>
            <Tags
              items={resume.extractedSkills}
              empty="Run an AI audit to extract skills from your resume."
            />
          </div>
        </div>
        <div className="c-actions">
          <Button to={"/candidate/ai-resume-audit?resumeId=" + resume.id}>
            Review with AI
          </Button>
          {!resume.isDefault && (
            <Button
              variant="outline"
              onClick={() => makeDefault.mutate()}
              disabled={busy}
            >
              Set as default
            </Button>
          )}
        </div>
        <p className="c-muted">
          Your default resume is preselected when applying. You can choose a
          different version for each role.
        </p>
        {confirm ? (
          <div className="c-confirm">
            <p>
              Delete this resume? This cannot be undone. Resumes attached to
              applications may not be removable.
            </p>
            <div className="c-actions">
              <Button
                loading={remove.isPending}
                disabled={busy}
                onClick={() => remove.mutate()}
              >
                Delete resume
              </Button>
              <Button
                variant="outline"
                disabled={busy}
                onClick={() => setConfirm(false)}
              >
                Keep resume
              </Button>
            </div>
          </div>
        ) : (
          <button
            className="c-text-link"
            style={{ textAlign: "left", color: "var(--hp-error)" }}
            onClick={() => setConfirm(true)}
          >
            Delete resume
          </button>
        )}
      </div>
    </Panel>
  );
}
export default function Resume() {
  const { query, resumes, selected, select } = useSelectedResume();
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const form = useRef(null);
  const upload = useCandidateMutation(
    resumeApi.uploadResume,
    resumeKeys,
    (r) => {
      setMessage(
        "Resume uploaded. You can now review it with AI or apply for a role.",
      );
      setFile(null);
      form.current?.reset();
      if (r?.id) select(r.id);
    },
  );
  return (
    <CandidateLayout
      title="Your experience, on file."
      description="Keep your resume versions organized. Choose the right one for every opportunity."
    >
      <Panel
        title="Add a resume"
        description="Upload an existing PDF. Resume editing is not currently available in HirePilot."
      >
        <form
          ref={form}
          className="c-grid-2"
          onSubmit={(e) => {
            e.preventDefault();
            const problem = validateResumeFile(file);
            const title = new FormData(e.currentTarget).get("title").trim();
            if (problem) {
              setError(problem);
              return;
            }
            if (title.length < 3) {
              setError("Use at least 3 characters for the title.");
              return;
            }
            setError("");
            setMessage("");
            if (!upload.isPending) upload.mutate({ file, title });
          }}
        >
          <label className="c-upload">
            <strong>Choose your PDF resume</strong>
            <p className="c-muted">PDF format · Up to 5 MB</p>
            <input
              type="file"
              accept=".pdf,application/pdf"
              aria-label="Resume PDF"
              disabled={upload.isPending}
              onChange={(e) => {
                const next = e.target.files?.[0];
                setFile(next);
                setError(next ? validateResumeFile(next) : "");
              }}
            />
          </label>
          <div className="c-stack">
            <TextField
              label="Give this version a name"
              name="title"
              placeholder="e.g. Product designer resume"
              required
              minLength={3}
              maxLength={100}
            />
            <div className="c-actions">
              <Button type="submit" loading={upload.isPending}>
                Upload resume
              </Button>
            </div>
          </div>
        </form>
        {(error || upload.error) && (
          <Notice>{error || upload.error.message}</Notice>
        )}
        {message && <Notice tone="success">{message}</Notice>}
      </Panel>
      <QueryState query={query}>
        {resumes.length ? (
          <div className="c-split">
            <Panel
              title="Your resumes"
              description={
                resumes.length +
                " resume" +
                (resumes.length === 1 ? "" : "s") +
                " in your library"
              }
            >
              <div className="c-resume-list">
                {resumes.map((r) => (
                  <button
                    key={r.id}
                    className="c-resume-item"
                    aria-pressed={selected?.id === r.id}
                    onClick={() => select(r.id)}
                  >
                    <strong>{r.title || r.originalFileName}</strong>
                    <small>Uploaded {formatDate(r.createdAt)}</small>
                    <div className="c-actions">
                      {r.isDefault && (
                        <Badge value="COMPLETED">Default resume</Badge>
                      )}
                      <Badge value={r.analysisStatus} />
                    </div>
                  </button>
                ))}
              </div>
            </Panel>
            {selected && (
              <ResumeDetail
                key={selected.id}
                resume={selected}
                onDeleted={() => {
                  select("");
                  setMessage("Resume deleted.");
                }}
              />
            )}
          </div>
        ) : (
          <Panel>
            <Empty
              title="A home for your experience"
              description="Upload your first resume above. Then get actionable feedback and start applying."
            />
          </Panel>
        )}
      </QueryState>
    </CandidateLayout>
  );
}

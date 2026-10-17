import { useEffect, useState } from "react";
import { useBlocker } from "react-router-dom";
import { Panel, Button, Notice } from "../workspace/ui";
import { useWorkspaceMutation, hiringKeys } from "../../hooks/useRecruiter";
import applicationApi from "../../api/application.api";
export default function RecruiterNotes({ application }) {
  const [draft, setDraft] = useState(application.recruiterNotes || "");
  const [baseline, setBaseline] = useState(application.recruiterNotes || "");
  const [saved, setSaved] = useState(false);
  const dirty = draft !== baseline;
  useEffect(() => {
    if (!dirty) return;
    const warn = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  const mutation = useWorkspaceMutation(
    (notes) => applicationApi.updateApplicationNotes(application.id, notes),
    hiringKeys,
    (_, notes) => {
      setBaseline(notes);
      setSaved(true);
    },
  );
  const blocker = useBlocker(dirty && !mutation.isPending);
  return (
    <Panel
      title="Private review notes"
      description="Visible to the hiring team. Not shared with the candidate."
    >
      <form
        className="c-stack"
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate(draft);
        }}
      >
        <label className="c-field">
          <span>Notes</span>
          <textarea
            className="r-notes"
            value={draft}
            maxLength={2000}
            disabled={mutation.isPending}
            onChange={(e) => {
              setDraft(e.target.value);
              setSaved(false);
            }}
          />
        </label>
        <p className="c-muted">
          {draft.length}/2000 characters{dirty ? " · Unsaved changes" : ""}
        </p>
        {mutation.error && <Notice>{mutation.error.message}</Notice>}
        {saved && <Notice tone="success">Review notes saved.</Notice>}
        <div className="c-actions">
          <Button type="submit" disabled={!dirty} loading={mutation.isPending}>
            Save notes
          </Button>
          <Button
            variant="outline"
            disabled={!dirty || mutation.isPending}
            onClick={() => {
              setDraft(baseline);
              setSaved(false);
            }}
          >
            Discard
          </Button>
        </div>
      </form>
      {blocker.state === "blocked" && (
        <div className="c-confirm">
          <p>Your review notes have unsaved changes.</p>
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

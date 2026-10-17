import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { Button, TextField, Notice } from "../workspace/ui";
const keys = ["jobId", "status", "search", "minScore", "sort", "view"];
function readViews(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(value)
      ? value
          .filter(
            (x) =>
              typeof x.name === "string" &&
              x.filters &&
              typeof x.filters === "object",
          )
          .slice(0, 12)
      : [];
  } catch {
    return [];
  }
}
export default function SavedViews({ params, onApply }) {
  const { user } = useAuth();
  const key = "hirepilot:recruiter:views:" + user.id;
  const [views, setViews] = useState(() => readViews(key));
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const selected =
    views.find((view) =>
      keys.every((k) => (view.filters[k] ?? "") === (params.get(k) ?? "")),
    )?.name || "";
  const persist = (next) => {
    try {
      localStorage.setItem(key, JSON.stringify(next));
      setViews(next);
      setError("");
      return true;
    } catch {
      setError(
        "This browser couldn't save the view. Your current filters are still available.",
      );
      return false;
    }
  };
  if (!params.get("jobId") && !views.length) return null;
  return (
    <div className="c-stack">
      <div className="c-actions">
        {views.map((v) => (
          <button
            key={v.name}
            className="r-view-chip"
            aria-pressed={selected === v.name}
            onClick={() => {
              onApply(v.filters);
            }}
          >
            {v.name}
          </button>
        ))}
        <Button
          variant="outline"
          disabled={!params.get("jobId")}
          onClick={() => setOpen(!open)}
        >
          Save current view
        </Button>
        {selected && (
          <button
            className="c-text-link"
            onClick={() => {
              persist(views.filter((v) => v.name !== selected));
            }}
          >
            Remove saved view
          </button>
        )}
      </div>
      {open && (
        <form
          className="r-search-row"
          onSubmit={(e) => {
            e.preventDefault();
            const name = new FormData(e.currentTarget).get("name").trim();
            if (!name) return;
            if (views.length >= 12 && !views.some((v) => v.name === name)) {
              setError(
                "You can save up to 12 views. Remove a view before adding another.",
              );
              return;
            }
            const filters = Object.fromEntries(
              keys.filter((k) => params.get(k)).map((k) => [k, params.get(k)]),
            );
            if (
              persist([
                ...views.filter((v) => v.name !== name),
                { name, filters },
              ])
            ) {
              setOpen(false);
            }
          }}
        >
          <TextField
            label="View name"
            name="name"
            maxLength={50}
            required
            placeholder="e.g. Design candidates to review"
          />
          <Button type="submit">Save view</Button>
          <span className="c-muted">
            Saved for your account in this browser. Using an existing name
            replaces that view.
          </span>
        </form>
      )}
      {error && <Notice>{error}</Notice>}
    </div>
  );
}

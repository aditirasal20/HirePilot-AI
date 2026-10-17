import { useQuery } from "@tanstack/react-query";
import RecruiterLayout from "../../components/recruiter/RecruiterLayout";
import JobPicker from "../../components/recruiter/JobPicker";
import Pipeline from "../../components/recruiter/Pipeline";
import SavedViews from "../../components/recruiter/SavedViews";
import ApplicantsTable from "../../components/recruiter/ApplicantsTable";
import {
  Panel,
  Button,
  TextField,
  Select,
  QueryState,
  Pager,
} from "../../components/workspace/ui";
import { usePageParams } from "../../hooks/useRecruiter";
import { useAuth } from "../../contexts/AuthContext";
import { stages, downloadCsv } from "../../utils/recruiter";
import { labelOf } from "../../utils/candidate";
import { formatDate } from "../../utils/format";
import applicationApi from "../../api/application.api";
import { QUERY_KEYS } from "../../config/constants";
export default function Applicants() {
  const { params, page, update } = usePageParams();
  const { user } = useAuth();
  const jobId = params.get("jobId") || "";
  const view = params.get("view") === "board" ? "board" : "list";
  const status = stages.includes(params.get("status"))
    ? params.get("status")
    : "";
  const score = params.get("minScore");
  const filters = {
    ...(params.get("search") ? { search: params.get("search") } : {}),
    ...(score !== null &&
    score !== "" &&
    Number(score) >= 0 &&
    Number(score) <= 100
      ? { minScore: score }
      : {}),
    sort: ["latest", "oldest", "score"].includes(params.get("sort"))
      ? params.get("sort")
      : "latest",
  };
  const query = useQuery({
    queryKey: [
      ...QUERY_KEYS.JOB_APPLICATIONS,
      jobId,
      { ...filters, status, page, limit: 10 },
    ],
    queryFn: () =>
      applicationApi.getJobApplications(jobId, {
        ...filters,
        ...(status ? { status } : {}),
        page,
        limit: 10,
      }),
    enabled: !!jobId,
  });
  const exportPage = () =>
    downloadCsv(
      [
        ["Candidate", "Email", "Role", "Resume score /100", "Stage", "Applied"],
        ...(query.data?.applications || []).map((a) => [
          a.candidate?.user?.fullName,
          a.candidate?.user?.email,
          query.data?.job?.title,
          a.resume?.aiScore,
          labelOf(a.status),
          formatDate(a.appliedAt),
        ]),
      ],
      "hirepilot-applicants-page-" + page + ".csv",
    );
  return (
    <RecruiterLayout
      title="Move the right conversations forward."
      description="Review applicants in context, keep your pipeline clear, and make each next step count."
    >
      <SavedViews
        key={user.id}
        params={params}
        onApply={(v) =>
          update({
            jobId,
            status: null,
            search: null,
            minScore: null,
            sort: null,
            view: null,
            page: null,
            ...v,
          })
        }
      />
      <JobPicker
        value={jobId}
        onChange={(id) => update({ jobId: id, page: null, status: null })}
      />
      {jobId && (
        <>
          <Panel
            title="Your review workspace"
            action={
              <Button variant="outline" to={"/recruiter/jobs/" + jobId}>
                Job overview
              </Button>
            }
          >
            <div className="c-stack">
              <form
                className="r-filter-grid"
                key={params.toString()}
                onSubmit={(e) => {
                  e.preventDefault();
                  update({
                    ...Object.fromEntries(new FormData(e.currentTarget)),
                    page: null,
                  });
                }}
              >
                <TextField
                  label="Candidate name or email"
                  name="search"
                  defaultValue={filters.search || ""}
                  placeholder="Search applicants"
                />
                <TextField
                  label="Minimum resume score"
                  name="minScore"
                  type="number"
                  min={0}
                  max={100}
                  defaultValue={filters.minScore ?? ""}
                />
                <Select label="Sort by" name="sort" defaultValue={filters.sort}>
                  <option value="latest">Newest applications</option>
                  <option value="oldest">Oldest applications</option>
                  <option value="score">Highest resume score</option>
                </Select>
                <Button type="submit">Apply filters</Button>
              </form>
              <div className="c-actions">
                <Select
                  label="Application stage"
                  value={status}
                  disabled={view === "board"}
                  onChange={(e) =>
                    update({ status: e.target.value, page: null })
                  }
                >
                  <option value="">All stages</option>
                  {stages.map((s) => (
                    <option key={s} value={s}>
                      {labelOf(s)}
                    </option>
                  ))}
                </Select>
                <div className="r-view-switch" aria-label="Applicant view">
                  <Button
                    variant={view === "list" ? "dark" : "outline"}
                    aria-pressed={view === "list"}
                    onClick={() => update({ view: "list", page: null })}
                  >
                    List
                  </Button>
                  <Button
                    variant={view === "board" ? "dark" : "outline"}
                    aria-pressed={view === "board"}
                    onClick={() =>
                      update({ view: "board", status: null, page: null })
                    }
                  >
                    Pipeline
                  </Button>
                </div>
                <Button
                  variant="outline"
                  onClick={() =>
                    update({
                      search: null,
                      minScore: null,
                      sort: null,
                      status: null,
                      page: null,
                    })
                  }
                >
                  Clear filters
                </Button>
                {view === "list" && (
                  <Button
                    variant="outline"
                    disabled={
                      !query.data?.applications.length || query.isFetching
                    }
                    onClick={exportPage}
                  >
                    Export this page
                  </Button>
                )}
              </div>
              <p className="c-muted">
                Resume scores measure resume quality, not job fit. Use them
                alongside experience and your own review.
              </p>
            </div>
          </Panel>
          {view === "board" ? (
            <QueryState query={query}>
              <Pipeline
                jobId={jobId}
                filters={filters}
                counts={query.data?.stageCounts}
              />
            </QueryState>
          ) : (
            <Panel
              title={query.data?.job?.title || "Applicants"}
              description={
                query.data
                  ? query.data.pagination.totalApplications +
                    " matching applications"
                  : undefined
              }
            >
              <QueryState query={query}>
                <ApplicantsTable
                  applications={query.data?.applications}
                  jobTitle={query.data?.job?.title}
                />
                <Pager
                  page={page}
                  pagination={query.data?.pagination}
                  onChange={(p) => update({ page: p })}
                />
              </QueryState>
            </Panel>
          )}
        </>
      )}
    </RecruiterLayout>
  );
}

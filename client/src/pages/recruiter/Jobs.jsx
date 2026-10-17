import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import RecruiterLayout from "../../components/recruiter/RecruiterLayout";
import {
  Panel,
  Button,
  TextField,
  Select,
  QueryState,
  Empty,
  Pager,
  Badge,
} from "../../components/workspace/ui";
import { usePageParams } from "../../hooks/useRecruiter";
import jobApi from "../../api/job.api";
import { QUERY_KEYS } from "../../config/constants";
import { formatSalary, formatDate } from "../../utils/format";
import { labelOf } from "../../utils/candidate";
export default function Jobs() {
  const { params, page, update } = usePageParams();
  const search = params.get("search") || "";
  const status = ["OPEN", "DRAFT", "CLOSED"].includes(params.get("status"))
    ? params.get("status")
    : "";
  const query = useQuery({
    queryKey: [...QUERY_KEYS.MY_JOBS, { search, status, page, limit: 10 }],
    queryFn: () =>
      jobApi.getMyJobs({
        search,
        ...(status ? { status } : {}),
        page,
        limit: 10,
      }),
  });
  return (
    <RecruiterLayout
      title="Build your next great team."
      description="Every role, from first draft to the right hire."
      actions={<Button to="/recruiter/jobs/create">Create job</Button>}
    >
      <Panel>
        <form
          className="r-search-row"
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
            name="search"
            label="Search jobs"
            defaultValue={search}
            placeholder="Role, location, or keyword"
          />
          <Select label="Job status" name="status" defaultValue={status}>
            <option value="">All jobs</option>
            <option value="OPEN">Open</option>
            <option value="DRAFT">Draft</option>
            <option value="CLOSED">Closed</option>
          </Select>
          <Button type="submit">Search</Button>
          <Button
            variant="outline"
            onClick={() => update({ search: null, status: null, page: null })}
          >
            Clear
          </Button>
        </form>
        <QueryState query={query}>
          {query.data?.jobs.length ? (
            <>
              <p className="c-muted">
                {query.data.pagination.totalJobs} matching jobs
              </p>
              <div className="c-list r-section-gap">
                {query.data.jobs.map((j) => (
                  <article className="r-job-row" key={j.id}>
                    <div>
                      <div className="c-actions">
                        <h3>
                          <Link to={"/recruiter/jobs/" + j.id}>{j.title}</Link>
                        </h3>
                        <Badge value={j.status} />
                      </div>
                      <p className="c-muted">
                        {j.location} · {labelOf(j.employmentType)}
                      </p>
                      <p className="c-muted">
                        Created {formatDate(j.createdAt)}
                      </p>
                    </div>
                    <div>
                      <p className="r-label">
                        {formatSalary(j.salaryMin, j.salaryMax)}
                      </p>
                      <p>{j._count?.applications ?? 0} applicants</p>
                    </div>
                    <div className="r-job-actions">
                      <Button variant="outline" to={"/recruiter/jobs/" + j.id}>
                        Manage role
                      </Button>
                      <Button to={"/recruiter/applicants?jobId=" + j.id}>
                        Review applicants
                      </Button>
                    </div>
                  </article>
                ))}
              </div>
              <Pager
                pagination={query.data.pagination}
                page={page}
                onChange={(p) => update({ page: p })}
              />
            </>
          ) : (
            <Empty
              title={
                search || status
                  ? "No jobs match this view"
                  : "Your next hire starts here"
              }
              description={
                search || status
                  ? "Try another keyword or clear your filters."
                  : "Create a job, review its details, then publish it when you're ready."
              }
              to={search || status ? undefined : "/recruiter/jobs/create"}
              action="Create your first job"
            />
          )}
        </QueryState>
      </Panel>
    </RecruiterLayout>
  );
}

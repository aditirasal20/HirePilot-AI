import { useQuery } from "@tanstack/react-query";
import CandidateLayout from "../../components/candidate/CandidateLayout";
import JobCard from "../../components/candidate/JobCard";
import {
  Panel,
  Button,
  TextField,
  Select,
  QueryState,
  Empty,
  Pager,
} from "../../components/candidate/ui";
import { usePageParams } from "../../hooks/useCandidate";
import jobApi from "../../api/job.api";
import { QUERY_KEYS, DEFAULT_QUERY_OPTIONS } from "../../config/constants";
export default function Jobs() {
  const { params, page, update } = usePageParams();
  const filters = Object.fromEntries(
    ["search", "location", "employmentType", "experience", "minSalary"]
      .filter((k) => params.get(k))
      .map((k) => [k, params.get(k)]),
  );
  const sort = ["latest", "oldest", "salaryAsc", "salaryDesc"].includes(
    params.get("sort"),
  )
    ? params.get("sort")
    : "latest";
  const query = useQuery({
    queryKey: [...QUERY_KEYS.PUBLIC_JOBS, { ...filters, page, sort }],
    queryFn: () => jobApi.getPublicJobs({ ...filters, page, sort, limit: 10 }),
    ...DEFAULT_QUERY_OPTIONS,
  });
  const submit = (e) => {
    e.preventDefault();
    const values = Object.fromEntries(new FormData(e.currentTarget));
    update({ ...values, page: null });
  };
  return (
    <CandidateLayout
      title="Find your next role."
      description="Explore open opportunities. Find the work that fits where you want to go."
    >
      <Panel>
        <form
          className="c-filter-form"
          key={params.toString()}
          onSubmit={submit}
        >
          <div className="c-filter-row">
            <TextField
              label="Role or keyword"
              name="search"
              defaultValue={params.get("search") || ""}
              placeholder="e.g. Product designer"
            />
            <TextField
              label="Location"
              name="location"
              defaultValue={params.get("location") || ""}
              placeholder="City or remote"
            />
            <Select
              label="Employment type"
              name="employmentType"
              defaultValue={params.get("employmentType") || ""}
            >
              <option value="">All types</option>
              {["FULL_TIME", "PART_TIME", "CONTRACT", "INTERNSHIP"].map((x) => (
                <option key={x} value={x}>
                  {x.toLowerCase().replace("_", " ")}
                </option>
              ))}
            </Select>
          </div>
          <details
            open={!!(params.get("experience") || params.get("minSalary"))}
          >
            <summary>More filters</summary>
            <div className="c-filter-extra">
              <TextField
                name="experience"
                label="Minimum experience required (years)"
                type="number"
                min="0"
                step="1"
                defaultValue={params.get("experience") || ""}
              />
              <TextField
                name="minSalary"
                label="Minimum salary (USD)"
                type="number"
                min="0"
                defaultValue={params.get("minSalary") || ""}
              />
              <Select label="Sort by" name="sort" defaultValue={sort}>
                <option value="latest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="salaryDesc">Highest salary first</option>
                <option value="salaryAsc">Lowest salary first</option>
              </Select>
            </div>
          </details>
          <div className="c-actions">
            <Button type="submit">Search jobs</Button>
            <Button
              variant="outline"
              onClick={() =>
                update({
                  search: null,
                  location: null,
                  employmentType: null,
                  experience: null,
                  minSalary: null,
                  sort: null,
                  page: null,
                })
              }
            >
              Clear filters
            </Button>
            {query.data && (
              <span className="c-muted">
                {query.data.pagination.totalJobs ?? query.data.jobs.length} open
                roles
              </span>
            )}
          </div>
        </form>
      </Panel>
      <QueryState query={query} label="Finding open roles">
        {query.data?.jobs.length ? (
          <div className="c-stack">
            {query.data.jobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        ) : (
          <Panel>
            <Empty
              title="No roles match these filters"
              description="Try a broader keyword, another location, or clear the filters."
            />
          </Panel>
        )}
        {query.data && (
          <Pager
            pagination={query.data.pagination}
            page={page}
            onChange={(p) => update({ page: p })}
          />
        )}
      </QueryState>
    </CandidateLayout>
  );
}

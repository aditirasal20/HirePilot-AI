import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Panel,
  TextField,
  Select,
  Button,
  QueryState,
  Empty,
  Pager,
} from "../workspace/ui";
import jobApi from "../../api/job.api";
import { useJob } from "../../hooks/useRecruiter";
import { QUERY_KEYS } from "../../config/constants";
export default function JobPicker({ value, onChange }) {
  const [term, setTerm] = useState("");
  const [page, setPage] = useState(1);
  const query = useQuery({
    queryKey: [...QUERY_KEYS.MY_JOBS, { search: term, page, limit: 20 }],
    queryFn: () => jobApi.getMyJobs({ search: term, page, limit: 20 }),
  });
  const selected = useJob(value);
  const jobs = query.data?.jobs || [];
  const options =
    selected.data && !jobs.some((j) => j.id === value)
      ? [selected.data, ...jobs]
      : jobs;
  return (
    <Panel title="Choose a hiring pipeline">
      <form
        className="r-search-row"
        onSubmit={(e) => {
          e.preventDefault();
          setTerm(new FormData(e.currentTarget).get("search").trim());
          setPage(1);
        }}
      >
        <TextField
          name="search"
          label="Find a job"
          placeholder="Search your postings"
        />
        <Button type="submit" variant="outline">
          Search jobs
        </Button>
      </form>
      <QueryState query={query}>
        {options.length ? (
          <div className="c-stack">
            <Select
              label="Job pipeline"
              value={value || ""}
              onChange={(e) => onChange(e.target.value)}
            >
              <option value="">Select a job</option>
              {options.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.title} ({j.status.toLowerCase()})
                </option>
              ))}
            </Select>
            <Pager
              pagination={query.data?.pagination}
              page={page}
              onChange={setPage}
            />
          </div>
        ) : (
          <Empty
            title={
              term
                ? "No jobs match your search"
                : "Create your first opportunity"
            }
            description={
              term
                ? "Try another role or keyword."
                : "Post a job to start receiving applications."
            }
            to={term ? undefined : "/recruiter/jobs/create"}
            action="Create job"
          />
        )}
      </QueryState>
      {value && selected.isError && <QueryState query={selected} />}
    </Panel>
  );
}

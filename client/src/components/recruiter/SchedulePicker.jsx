import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Panel,
  TextField,
  Button,
  Select,
  QueryState,
  Empty,
  Pager,
} from "../workspace/ui";
import JobPicker from "./JobPicker";
import InterviewForm from "./InterviewForm";
import applicationApi from "../../api/application.api";
import { QUERY_KEYS } from "../../config/constants";
export default function SchedulePicker({ onSaved, onCancel }) {
  const [jobId, setJobId] = useState("");
  const [appId, setAppId] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const query = useQuery({
    queryKey: [
      ...QUERY_KEYS.JOB_APPLICATIONS,
      jobId,
      { status: "SHORTLISTED", search, page, limit: 20 },
    ],
    queryFn: () =>
      applicationApi.getJobApplications(jobId, {
        status: "SHORTLISTED",
        search,
        page,
        limit: 20,
      }),
    enabled: !!jobId,
  });
  return (
    <div className="c-stack">
      <JobPicker
        value={jobId}
        onChange={(id) => {
          setJobId(id);
          setAppId("");
          setPage(1);
          setSearch("");
        }}
      />
      {jobId && (
        <Panel title="Choose a shortlisted candidate">
          <form
            className="r-search-row"
            onSubmit={(e) => {
              e.preventDefault();
              setSearch(new FormData(e.currentTarget).get("search").trim());
              setAppId("");
              setPage(1);
            }}
          >
            <TextField name="search" label="Candidate name or email" />
            <Button type="submit" variant="outline">
              Search candidates
            </Button>
          </form>
          <QueryState query={query}>
            {query.data?.applications.length ? (
              <>
                <Select
                  label="Shortlisted candidate"
                  value={appId}
                  onChange={(e) => setAppId(e.target.value)}
                >
                  <option value="">Select a candidate</option>
                  {query.data.applications.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.candidate?.user?.fullName} · {a.candidate?.user?.email}
                    </option>
                  ))}
                </Select>
                <Pager
                  page={page}
                  pagination={query.data.pagination}
                  onChange={(p) => {
                    setPage(p);
                    setAppId("");
                  }}
                />
              </>
            ) : (
              <Empty
                title="No shortlisted candidates in this view"
                description="Shortlist an applicant after reviewing their experience, then schedule an interview."
                to={"/recruiter/applicants?jobId=" + jobId}
                action="Review applicants"
              />
            )}
          </QueryState>
        </Panel>
      )}
      {appId && (
        <InterviewForm
          key={appId}
          applicationId={appId}
          onSaved={onSaved}
          onCancel={onCancel}
        />
      )}
    </div>
  );
}

import { labelOf } from "../../utils/candidate";
import { useQuery } from "@tanstack/react-query";
import CandidateLayout from "../../components/candidate/CandidateLayout";
import ApplicationTable from "../../components/candidate/ApplicationTable";
import {
  Panel,
  Button,
  QueryState,
  Select,
  Pager,
} from "../../components/candidate/ui";
import { usePageParams } from "../../hooks/useCandidate";
import applicationApi from "../../api/application.api";
import { QUERY_KEYS } from "../../config/constants";
const statuses = [
  "APPLIED",
  "REVIEWING",
  "SHORTLISTED",
  "INTERVIEW_SCHEDULED",
  "REJECTED",
  "HIRED",
];
export default function Applications() {
  const { params, page, update } = usePageParams();
  const status = statuses.includes(params.get("status"))
    ? params.get("status")
    : "";
  const query = useQuery({
    queryKey: [...QUERY_KEYS.MY_APPLICATIONS, { status, page }],
    queryFn: () =>
      applicationApi.getMyApplications({
        page,
        limit: 10,
        ...(status ? { status } : {}),
      }),
  });
  return (
    <CandidateLayout
      title="Every opportunity, in view."
      description="Keep track of your applications and the next step in each conversation."
      actions={<Button to="/candidate/jobs">Find a role</Button>}
    >
      <Panel
        title="Your applications"
        action={
          <Select
            label="Application status"
            value={status}
            onChange={(e) => update({ status: e.target.value, page: null })}
          >
            <option value="">All statuses</option>
            {statuses.map((x) => (
              <option key={x} value={x}>
                {labelOf(x)}
              </option>
            ))}
          </Select>
        }
      >
        <QueryState query={query}>
          <ApplicationTable applications={query.data?.applications} />
          {query.data && (
            <Pager
              pagination={query.data.pagination}
              page={page}
              onChange={(p) => update({ page: p })}
            />
          )}
        </QueryState>
      </Panel>
    </CandidateLayout>
  );
}

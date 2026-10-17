import RecruiterLayout from "../../components/recruiter/RecruiterLayout";
import JobForm from "../../components/recruiter/JobForm";
import { Panel, QueryState, Empty } from "../../components/workspace/ui";
import { useCompany } from "../../hooks/useRecruiter";
export default function CreateJob() {
  const company = useCompany();
  return (
    <RecruiterLayout
      title="A new opportunity starts here."
      description="Create a thoughtful job post and give candidates a clear reason to apply."
    >
      <QueryState query={company}>
        {company.data ? (
          <JobForm />
        ) : (
          <Panel>
            <Empty
              title="Introduce your company first"
              description="Create your company profile before posting a job."
              to="/recruiter/company"
              action="Set up company"
            />
          </Panel>
        )}
      </QueryState>
    </RecruiterLayout>
  );
}

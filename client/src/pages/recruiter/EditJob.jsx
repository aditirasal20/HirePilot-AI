import { useParams } from "react-router-dom";
import RecruiterLayout from "../../components/recruiter/RecruiterLayout";
import JobForm from "../../components/recruiter/JobForm";
import { QueryState, Empty } from "../../components/workspace/ui";
import { useJob } from "../../hooks/useRecruiter";
import { useAuth } from "../../contexts/AuthContext";
export default function EditJob() {
  const { jobId } = useParams();
  const { user } = useAuth();
  const query = useJob(jobId);
  return (
    <RecruiterLayout
      title="Refine the opportunity."
      description="Keep your posting accurate as the role evolves."
    >
      <QueryState query={query}>
        {query.data?.recruiter?.userId !== user.id ? (
          <Empty
            title="Job unavailable"
            description="You can only edit your own job postings."
            to="/recruiter/jobs"
            action="Your jobs"
          />
        ) : query.data?.status === "CLOSED" ? (
          <Empty
            title="This role is closed"
            description="Reopen the role before changing its details."
            to={"/recruiter/jobs/" + jobId}
            action="Manage role"
          />
        ) : (
          <JobForm key={jobId} job={query.data} />
        )}
      </QueryState>
    </RecruiterLayout>
  );
}

import { Link } from "react-router-dom";
import { Badge, Button, Tags } from "./ui";
import { formatSalary, formatDate, getInitials } from "../../utils/format";
export default function JobCard({ job }) {
  return (
    <article className="c-panel c-job">
      <div className="c-job-head">
        <div>
          <p className="c-muted">{job.company?.name || "Company"}</p>
          <h2>
            <Link to={"/candidate/jobs/" + job.id}>{job.title}</Link>
          </h2>
        </div>
        <span className="c-company-mark">
          {getInitials(job.company?.name) || "Co"}
        </span>
      </div>
      <div className="c-job-meta">
        <span>{job.location || "Location not specified"}</span>
        <span>{formatSalary(job.salaryMin, job.salaryMax)}</span>
        <Badge value={job.employmentType} />
      </div>
      <p className="c-job-description">{job.description}</p>
      <Tags items={job.requiredSkills?.slice(0, 6)} />
      <div className="c-job-footer">
        <span className="c-muted">Posted {formatDate(job.createdAt)}</span>
        <div className="c-actions">
          <Button
            variant="outline"
            to={"/candidate/job-matching?jobId=" + job.id}
          >
            Check fit
          </Button>
          <Button to={"/candidate/jobs/" + job.id}>View role</Button>
        </div>
      </div>
    </article>
  );
}

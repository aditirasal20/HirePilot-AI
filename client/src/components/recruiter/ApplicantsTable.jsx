import { Link } from "react-router-dom";
import { Badge, Empty } from "../workspace/ui";
import { formatDate } from "../../utils/format";
export default function ApplicantsTable({ applications = [], jobTitle }) {
  if (!applications.length)
    return (
      <Empty
        title="No applicants in this view"
        description="New applications will appear here. Try another stage or clear your filters."
      />
    );
  return (
    <div className="c-table-wrap">
      <table className="c-table">
        <caption className="sr-only">Applicant review queue</caption>
        <thead>
          <tr>
            <th scope="col">Candidate</th>
            <th scope="col">Role</th>
            <th scope="col">Resume score</th>
            <th scope="col">Stage</th>
            <th scope="col">Applied</th>
            <th scope="col">Review</th>
          </tr>
        </thead>
        <tbody>
          {applications.map((a) => (
            <tr key={a.id}>
              <td>
                <strong>{a.candidate?.user?.fullName || "Candidate"}</strong>
                <small>{a.candidate?.user?.email}</small>
              </td>
              <td>{jobTitle || a.job?.title || "Not available"}</td>
              <td>
                {a.resume?.aiScore != null &&
                (!a.resume.analysisStatus ||
                  a.resume.analysisStatus === "COMPLETED")
                  ? Math.round(a.resume.aiScore) + "/100"
                  : "Not scored"}
              </td>
              <td>
                <Badge value={a.status} />
              </td>
              <td>{formatDate(a.appliedAt)}</td>
              <td>
                <Link
                  className="c-text-link"
                  to={"/recruiter/applicants/" + a.id}
                  aria-label={"Review " + a.candidate?.user?.fullName}
                >
                  Review
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

import { Link } from "react-router-dom";
import { Badge, Empty } from "./ui";
import { formatDate } from "../../utils/format";
export default function ApplicationTable({ applications = [] }) {
  if (!applications.length)
    return (
      <Empty
        title="Your next chapter starts here"
        description="When you apply for a role, you can follow its progress here."
        to="/candidate/jobs"
        action="Explore open roles"
      />
    );
  return (
    <div className="c-table-wrap">
      <table className="c-table">
        <caption className="sr-only">Your job applications</caption>
        <thead>
          <tr>
            <th scope="col">Role & company</th>
            <th scope="col">Applied</th>
            <th scope="col">Status</th>
            <th scope="col">Details</th>
          </tr>
        </thead>
        <tbody>
          {applications.map((a) => (
            <tr key={a.id}>
              <td>
                <strong>{a.job?.title || "Job"}</strong>
                <small>{a.job?.company?.name}</small>
              </td>
              <td>{formatDate(a.appliedAt)}</td>
              <td>
                <Badge value={a.status} />
              </td>
              <td>
                <Link
                  className="c-text-link"
                  to={"/candidate/applications/" + a.id}
                  aria-label={"View application for " + a.job?.title}
                >
                  View application
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

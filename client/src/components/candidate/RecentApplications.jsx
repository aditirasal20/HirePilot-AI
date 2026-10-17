import { ExternalLink, Building2, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import Skeleton from "../shared/Skeleton";
import ErrorState from "../shared/ErrorState";
import EmptyState from "../shared/EmptyState";
import StatusBadge from "../shared/StatusBadge";
import { getApplicationStatusConfig } from "../../utils/status";
import { timeAgo } from "../../utils/format";

export default function RecentApplications({
  applications = [],
  loading = false,
  error = null,
  onRetry,
  title = "Recent Applications",
  description = "Track real-time updates on your submitted roles",
  showViewAll = true,
}) {
  return (
    <div className="bg-[#0a0a0a] border border-gray-800 rounded-xl p-6 mb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-base font-semibold text-white">{title}</h2>
          {description && <p className="text-xs text-gray-400">{description}</p>}
        </div>
        {showViewAll && (
          <Link
            to="/candidate/applications"
            className="text-xs font-medium text-[#4F46E5] hover:text-[#06B6D4] transition-colors flex items-center gap-1"
          >
            View all <ExternalLink className="w-3 h-3" />
          </Link>
        )}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="flex items-center gap-4">
              <Skeleton className="h-10 w-10" variant="circle" />
              <div className="flex-1 space-y-2">
                <Skeleton className="w-1/3" />
                <Skeleton className="w-1/4" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <ErrorState title="Could not load applications" message={error} onRetry={onRetry} />
      ) : applications.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No applications yet"
          description="Start applying to jobs to see your application history here."
          action={
            <Link
              to="/candidate/jobs"
              className="px-4 py-2 bg-[#4F46E5] hover:bg-[#4338ca] text-white text-xs font-semibold rounded-lg transition-colors"
            >
              Browse Jobs
            </Link>
          }
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-xs font-medium text-gray-400 uppercase tracking-wider">
                <th className="pb-3 px-2">Job & Company</th>
                <th className="pb-3 px-2">Applied</th>
                <th className="pb-3 px-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {applications.map((app) => {
                const status = getApplicationStatusConfig(app.status);
                return (
                  <tr key={app.id} className="hover:bg-gray-900/40 transition-colors">
                    <td className="py-3 px-2">
                      <div className="font-medium text-white">{app.job?.title}</div>
                      <div className="text-xs text-gray-500 flex items-center gap-1.5 mt-0.5">
                        <Building2 className="w-3 h-3 text-gray-600" />
                        {app.job?.company?.name} {app.job?.location ? `• ${app.job.location}` : ""}
                      </div>
                    </td>
                    <td className="py-3 px-2 text-xs text-gray-400">{timeAgo(app.appliedAt)}</td>
                    <td className="py-3 px-2">
                      <StatusBadge label={status.label} className={status.className} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

import { MapPin, DollarSign, Building2, ArrowRight, Loader2, Briefcase } from "lucide-react";
import { Link } from "react-router-dom";
import Skeleton from "../shared/Skeleton";
import ErrorState from "../shared/ErrorState";
import EmptyState from "../shared/EmptyState";
import { formatSalary } from "../../utils/format";
import { getEmploymentTypeLabel } from "../../utils/status";

export default function RecommendedJobs({
  jobs = [],
  loading = false,
  error = null,
  onRetry,
  onApply,
  applyingId = null,
  defaultResumeId = null,
}) {
  return (
    <div className="bg-[#0a0a0a] border border-gray-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-base font-semibold text-white">Recommended AI Matches</h2>
          <p className="text-xs text-gray-400">Open roles curated for your profile</p>
        </div>
        <Link to="/candidate/jobs" className="text-xs font-medium text-[#06B6D4] hover:underline">
          Browse all jobs →
        </Link>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((n) => (
            <div key={n} className="p-4 rounded-lg bg-[#111] border border-gray-800 space-y-3">
              <Skeleton className="w-1/3" variant="title" />
              <Skeleton className="w-1/4" />
              <Skeleton className="w-1/2" />
            </div>
          ))}
        </div>
      ) : error ? (
        <ErrorState title="Could not load recommended jobs" message={error} onRetry={onRetry} />
      ) : jobs.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No recommended jobs right now"
          description="New job postings that match your profile will show up here."
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
        <div className="space-y-4">
          {jobs.map((job) => {
            const canApply = !!defaultResumeId && !!onApply;
            const isApplying = applyingId === job.id;
            return (
              <div
                key={job.id}
                className="p-4 rounded-lg bg-[#111] border border-gray-800 hover:border-[#4F46E5]/50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-white text-sm">{job.title}</h3>
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-[#06B6D4]/10 text-[#06B6D4] border border-[#06B6D4]/20">
                      {getEmploymentTypeLabel(job.employmentType)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1 flex items-center gap-1.5">
                    <Building2 className="w-3 h-3 text-gray-600" /> {job.company?.name}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-gray-600" /> {job.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <DollarSign className="w-3 h-3 text-gray-600" /> {formatSalary(job.salaryMin, job.salaryMax)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-center">
                  {onApply && (
                    <button
                      onClick={() => onApply(job)}
                      disabled={!canApply || isApplying}
                      className="px-4 py-2 bg-[#4F46E5] hover:bg-[#4338ca] text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50 disabled:pointer-events-none flex items-center gap-1.5"
                    >
                      {isApplying ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Applying...
                        </>
                      ) : canApply ? (
                        <>
                          Apply Now <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      ) : (
                        "No Resume"
                      )}
                    </button>
                  )}
                  <Link
                    to="/candidate/jobs"
                    className="px-3 py-2 border border-gray-800 text-gray-400 hover:text-white hover:bg-gray-800 text-xs font-medium rounded-lg transition-colors"
                  >
                    View
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

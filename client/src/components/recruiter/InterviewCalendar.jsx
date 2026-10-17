import { Calendar as CalIcon, Clock, Video, Globe, VideoOff } from "lucide-react";
import Skeleton from "../shared/Skeleton";
import ErrorState from "../shared/ErrorState";
import EmptyState from "../shared/EmptyState";
import StatusBadge from "../shared/StatusBadge";
import { getInterviewStatusConfig, getInterviewTypeLabel } from "../../utils/status";
import { formatDateTime } from "../../utils/format";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function InterviewCalendar({
  interviews = [],
  loading = false,
  error = null,
  onRetry,
  onStatusChange,
}) {
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((n) => (
          <Skeleton key={n} className="h-28 w-full" variant="card" />
        ))}
      </div>
    );
  }

  if (error) {
    return <ErrorState title="Could not load interviews" message={error} onRetry={onRetry} />;
  }

  if (!interviews || interviews.length === 0) {
    return (
      <EmptyState
        icon={Video}
        title="No interviews scheduled"
        description="When you schedule interviews for shortlisted candidates, they will appear here."
      />
    );
  }

  return (
    <div className="space-y-4">
      {interviews.map((interview) => {
        const status = getInterviewStatusConfig(interview.status);
        const scheduled = new Date(interview.scheduledAt);
        const candidateName = interview.application?.candidate?.user?.fullName || "Candidate";
        const jobTitle = interview.application?.job?.title || "Job";
        const isJoinable =
          interview.meetingLink &&
          (interview.status === "SCHEDULED" || interview.status === "RESCHEDULED");
        const isActionable =
          interview.status === "SCHEDULED" || interview.status === "RESCHEDULED";

        return (
          <div
            key={interview.id}
            className="p-4 bg-[#0a0a0a] border border-gray-800 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex flex-col items-center justify-center flex-shrink-0 text-indigo-400">
                <span className="text-[10px] font-bold uppercase">{MONTHS[scheduled.getMonth()]}</span>
                <span className="text-lg font-black leading-none">{scheduled.getDate()}</span>
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-sm font-semibold text-white">{candidateName}</h4>
                  <StatusBadge label={status.label} className={status.className} />
                </div>
                <p className="text-xs text-gray-400 mt-0.5">
                  {jobTitle} • {getInterviewTypeLabel(interview.interviewType)} Interview
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> {formatDateTime(interview.scheduledAt)}
              </span>
              <span className="flex items-center gap-1.5">
                <CalIcon className="w-3.5 h-3.5" /> {interview.durationMinutes} min
              </span>
              <span className="flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5" /> {interview.timezone || "UTC"}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {onStatusChange && isActionable && (
                <>
                  <button
                    onClick={() => onStatusChange(interview.id, "COMPLETED")}
                    className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-white text-xs font-semibold rounded-lg transition-colors"
                  >
                    Complete
                  </button>
                  <button
                    onClick={() => onStatusChange(interview.id, "CANCELLED")}
                    className="px-3 py-2 bg-gray-900 border border-gray-700 hover:bg-gray-800 text-gray-300 text-xs font-semibold rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </>
              )}
              {isJoinable ? (
                <a
                  href={interview.meetingLink}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 bg-[#4F46E5] hover:bg-[#4338ca] text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                  <Video className="w-4 h-4" /> Join
                </a>
              ) : (
                <span className="text-[10px] text-gray-500 flex items-center gap-1.5">
                  <VideoOff className="w-3.5 h-3.5" />
                  {interview.status === "COMPLETED" || interview.status === "CANCELLED"
                    ? "Ended"
                    : "Link will be shared soon"}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

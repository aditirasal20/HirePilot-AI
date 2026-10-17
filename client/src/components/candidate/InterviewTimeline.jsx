import { Calendar, Video, Clock } from "lucide-react";
import Skeleton from "../shared/Skeleton";
import ErrorState from "../shared/ErrorState";
import EmptyState from "../shared/EmptyState";
import { getInterviewTypeLabel } from "../../utils/status";
import { formatDate, formatDateTime } from "../../utils/format";

export default function InterviewTimeline({
  interviews = [],
  loading = false,
  error = null,
  onRetry,
}) {
  const scheduledCount = interviews.filter(
    (interview) => interview.status === "SCHEDULED" || interview.status === "RESCHEDULED"
  ).length;

  return (
    <div className="bg-[#0a0a0a] border border-gray-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-base font-semibold text-white">Upcoming Interviews</h2>
        {!loading && (
          <span className="text-xs px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 font-medium">
            {scheduledCount} Scheduled
          </span>
        )}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((n) => (
            <div key={n} className="p-4 rounded-lg bg-[#111] border border-gray-800 space-y-3">
              <Skeleton className="w-1/2" variant="title" />
              <Skeleton className="w-1/3" />
            </div>
          ))}
        </div>
      ) : error ? (
        <ErrorState title="Could not load interviews" message={error} onRetry={onRetry} />
      ) : interviews.length === 0 ? (
        <EmptyState
          icon={Video}
          title="No upcoming interviews"
          description="When a recruiter schedules an interview with you, it will show up here."
        />
      ) : (
        <div className="space-y-4">
          {interviews.map((item) => (
            <div key={item.id} className="p-4 rounded-lg bg-[#111] border border-gray-800">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white">
                    {item.application?.job?.company?.name}
                  </h3>
                  <p className="text-xs text-gray-400">
                    {item.application?.job?.title} •{" "}
                    <span className="text-gray-300">{getInterviewTypeLabel(item.interviewType)}</span>
                  </p>
                </div>
                <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                  <Video className="w-4 h-4" />
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-gray-800/80 flex flex-wrap justify-between items-center text-xs text-gray-400 gap-2">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 text-gray-300">
                    <Calendar className="w-3.5 h-3.5 text-gray-500" /> {formatDate(item.scheduledAt)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-gray-500" />{" "}
                    {formatDateTime(item.scheduledAt).split(",")[1]?.trim() || formatDateTime(item.scheduledAt)}
                  </span>
                </div>
                {item.meetingLink ? (
                  <a
                    href={item.meetingLink}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1 bg-gray-800 hover:bg-gray-700 text-white rounded text-xs font-medium"
                  >
                    Join Call
                  </a>
                ) : (
                  <span className="text-[10px] text-gray-500">Link will be shared soon</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

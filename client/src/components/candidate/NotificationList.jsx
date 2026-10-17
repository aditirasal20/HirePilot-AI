import { Bell, Sparkles, CheckCircle2, MessageSquare, Briefcase, FileText } from "lucide-react";
import Skeleton from "../shared/Skeleton";
import ErrorState from "../shared/ErrorState";
import EmptyState from "../shared/EmptyState";
import { timeAgo } from "../../utils/format";

export default function NotificationList({
  notifications = [],
  loading = false,
  error = null,
  onRetry,
  onMarkRead,
}) {
  if (loading) {
    return (
      <div className="divide-y divide-gray-800 border border-gray-800 bg-[#0a0a0a] rounded-xl overflow-hidden">
        {[1, 2, 3].map((n) => (
          <div key={n} className="p-4 flex gap-4">
            <Skeleton className="h-10 w-10" variant="circle" />
            <div className="flex-1 space-y-2">
              <Skeleton className="w-1/3" />
              <Skeleton className="w-2/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return <ErrorState title="Could not load notifications" message={error} onRetry={onRetry} />;
  }

  if (!notifications || notifications.length === 0) {
    return (
      <EmptyState
        icon={Bell}
        title="No notifications"
        description="Updates about your applications, interviews, and resume will appear here."
      />
    );
  }

  const getIcon = (type) => {
    switch (type) {
      case "AI":
        return <Sparkles className="w-4 h-4 text-[#06B6D4]" />;
      case "INTERVIEW":
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case "APPLICATION":
        return <Briefcase className="w-4 h-4 text-[#4F46E5]" />;
      case "RESUME":
        return <FileText className="w-4 h-4 text-[#06B6D4]" />;
      default:
        return <MessageSquare className="w-4 h-4 text-[#4F46E5]" />;
    }
  };

  return (
    <div className="divide-y divide-gray-800 border border-gray-800 bg-[#0a0a0a] rounded-xl overflow-hidden">
      {notifications.map((item) => (
        <button
          key={item.id}
          onClick={() => !item.isRead && onMarkRead?.(item)}
          disabled={item.isRead || !onMarkRead}
          className={`w-full p-4 flex gap-4 text-left hover:bg-gray-900/50 transition-colors ${
            !item.isRead ? "bg-[#4F46E5]/5 cursor-pointer" : "cursor-default"
          }`}
        >
          <div className="p-2 rounded-lg bg-gray-900 border border-gray-800 h-fit">
            {getIcon(item.type)}
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between gap-3">
              <h4 className={`text-sm text-white ${item.isRead ? "font-normal" : "font-semibold"}`}>
                {item.title}
              </h4>
              <span className="text-[10px] text-gray-500 flex-shrink-0">{timeAgo(item.createdAt)}</span>
            </div>
            <p className="text-xs text-gray-400 mt-1 leading-relaxed">{item.message}</p>
            {!item.isRead && (
              <span className="mt-2 inline-flex w-2 h-2 rounded-full bg-[#06B6D4]" />
            )}
          </div>
        </button>
      ))}
    </div>
  );
}

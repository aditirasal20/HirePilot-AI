import { Send, FileSearch, Video, CheckCircle2 } from "lucide-react";
import Skeleton from "../shared/Skeleton";

export default function StatsCards({ stats = {}, loading = false }) {
  const items = [
    {
      label: "Applications Submitted",
      value: stats.applications,
      icon: Send,
      color: "text-indigo-400",
      bg: "bg-indigo-500/10",
    },
    {
      label: "In Review",
      value: stats.reviewing,
      icon: FileSearch,
      color: "text-yellow-400",
      bg: "bg-yellow-500/10",
    },
    {
      label: "Interviews Scheduled",
      value: stats.interviewScheduled,
      icon: Video,
      color: "text-cyan-400",
      bg: "bg-cyan-500/10",
    },
    {
      label: "Shortlisted",
      value: stats.shortlisted,
      icon: CheckCircle2,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {items.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.label}
            className="p-5 rounded-xl bg-[#0a0a0a] border border-gray-800 hover:border-gray-700 transition-all shadow-sm"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-gray-400">{stat.label}</span>
              <div className={`p-2 rounded-lg ${stat.bg}`}>
                <Icon className={`w-4 h-4 ${stat.color}`} />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              {loading ? (
                <Skeleton className="h-7 w-12" />
              ) : (
                <h3 className="text-2xl font-bold text-white tracking-tight">
                  {stat.value ?? 0}
                </h3>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

import { useQuery } from "@tanstack/react-query";
import { Menu, Bell, Search, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import notificationApi from "../../api/notification.api";
import { QUERY_KEYS, DEFAULT_QUERY_OPTIONS } from "../../config/constants";

export default function Navbar({ onMenuClick, title = "Recruiter Dashboard" }) {
  const { data: unreadCount = 0 } = useQuery({
    queryKey: QUERY_KEYS.UNREAD_COUNT,
    queryFn: () => notificationApi.getUnreadCount(),
    ...DEFAULT_QUERY_OPTIONS,
  });

  return (
    <header className="sticky top-0 z-30 h-16 bg-[#0a0a0a]/80 backdrop-blur-md border-b border-gray-800 px-4 sm:px-6 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <button onClick={onMenuClick} className="lg:hidden text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800">
          <Menu className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-semibold text-white tracking-tight">{title}</h1>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative hidden md:block w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search candidates or jobs..."
            className="w-full bg-[#111] border border-gray-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#4F46E5]"
          />
        </div>
        <button className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#4F46E5]/20 to-[#06B6D4]/20 border border-[#4F46E5]/30 text-xs font-medium text-white hover:border-[#4F46E5] transition-all">
          <Sparkles className="w-3.5 h-3.5 text-[#06B6D4]" /> Auto-Screen
        </button>
        <Link to="/recruiter/notifications" className="relative p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#06B6D4] ring-2 ring-[#0a0a0a]" />
          )}
        </Link>
      </div>
    </header>
  );
}

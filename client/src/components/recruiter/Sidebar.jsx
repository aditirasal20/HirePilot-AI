import { useQuery } from "@tanstack/react-query";
import { NavLink, Link } from "react-router-dom";
import {
  LayoutDashboard,
  Briefcase,
  Users,
  Calendar,
  BarChart3,
  Building,
  Bell,
  Settings,
  Rocket,
  LogOut,
  X,
  PlusCircle,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import notificationApi from "../../api/notification.api";
import companyApi from "../../api/company.api";
import { QUERY_KEYS, DEFAULT_QUERY_OPTIONS } from "../../config/constants";
import { getInitials } from "../../utils/format";

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();

  const { data: unreadCount = 0 } = useQuery({
    queryKey: QUERY_KEYS.UNREAD_COUNT,
    queryFn: () => notificationApi.getUnreadCount(),
    ...DEFAULT_QUERY_OPTIONS,
  });

  const { data: company } = useQuery({
    queryKey: QUERY_KEYS.COMPANY,
    queryFn: () => companyApi.getMyCompany(),
    ...DEFAULT_QUERY_OPTIONS,
  });

  const handleLogout = async () => {
    await logout();
  };

  const displayName = company?.name || user?.fullName || "Company";
  const displaySub = company?.industry || company?.website || user?.email || "HR Dashboard";

  const navItems = [
    { name: "Dashboard", path: "/recruiter/dashboard", icon: LayoutDashboard },
    { name: "Jobs", path: "/recruiter/jobs", icon: Briefcase },
    { name: "Applicants", path: "/recruiter/applicants", icon: Users },
    { name: "Interviews", path: "/recruiter/interviews", icon: Calendar },
    { name: "Analytics", path: "/recruiter/analytics", icon: BarChart3 },
    { name: "Company", path: "/recruiter/company", icon: Building },
    { name: "Notifications", path: "/recruiter/notifications", icon: Bell, badge: unreadCount },
    { name: "Settings", path: "/recruiter/settings", icon: Settings },
  ];

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#0a0a0a] border-r border-gray-800 flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div>
          <div className="h-16 px-6 flex items-center justify-between border-b border-gray-800">
            <Link to="/recruiter/dashboard" className="flex items-center gap-2">
              <div className="bg-gradient-to-tr from-[#4F46E5] to-[#06B6D4] p-1.5 rounded-lg">
                <Rocket className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold tracking-tight text-white">
                HirePilot<span className="text-[#06B6D4]">.ai</span>
              </span>
            </Link>
            <button className="lg:hidden text-gray-400 hover:text-white" onClick={onClose}>
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-4">
            <Link
              to="/recruiter/jobs/create"
              onClick={onClose}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#4F46E5] hover:bg-[#4338ca] text-white text-sm font-semibold rounded-lg transition-colors mb-4"
            >
              <PlusCircle className="w-4 h-4" /> Post New Job
            </Link>

            <nav className="space-y-1 overflow-y-auto max-h-[calc(100vh-200px)] scrollbar-thin">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        isActive
                          ? "bg-[#4F46E5]/10 text-[#4F46E5] border border-[#4F46E5]/20 font-semibold"
                          : "text-gray-400 hover:bg-gray-900 hover:text-gray-200"
                      }`
                    }
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4" />
                      <span>{item.name}</span>
                    </div>
                    {item.badge > 0 && (
                      <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-[#06B6D4]/10 text-[#06B6D4] border border-[#06B6D4]/20">
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </nav>
          </div>
        </div>

        <div className="p-4 border-t border-gray-800 bg-[#050505]">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-md bg-gradient-to-tr from-[#4F46E5] to-[#06B6D4] flex items-center justify-center font-bold text-white text-sm">
              {getInitials(displayName) || "C"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{displayName}</p>
              <p className="text-xs text-gray-500 truncate">{displaySub}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-xs font-medium text-gray-400 hover:text-red-400 transition-colors w-full px-2 py-1 rounded"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign out</span>
          </button>
        </div>
      </aside>
    </>
  );
}

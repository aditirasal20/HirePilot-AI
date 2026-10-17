import { useEffect, useRef, useState } from "react";
import {
  Link,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  LayoutDashboard,
  BriefcaseBusiness,
  ClipboardList,
  Files,
  ScanLine,
  Target,
  CalendarDays,
  Bell,
  UserRound,
  Settings2,
  Menu,
  X,
  Search,
  LogOut,
  UsersRound,
  ChartNoAxesCombined,
  Building2,
} from "lucide-react";
import Brand from "../ui/Brand";
import { useAuth } from "../../contexts/AuthContext";
import notificationApi from "../../api/notification.api";
import { QUERY_KEYS } from "../../config/constants";
import { getInitials } from "../../utils/format";
import "../../styles/candidate.css";

const candidateGroups = [
  [
    "Workspace",
    [
      ["dashboard", "Overview", LayoutDashboard],
      ["jobs", "Find jobs", BriefcaseBusiness],
      ["applications", "Applications", ClipboardList],
      ["interviews", "Interviews", CalendarDays],
    ],
  ],
  [
    "Career tools",
    [
      ["resume-builder", "My resumes", Files],
      ["ai-resume-audit", "AI resume audit", ScanLine],
      ["job-matching", "Job matching", Target],
    ],
  ],
  [
    "Account",
    [
      ["notifications", "Notifications", Bell],
      ["profile", "Profile", UserRound],
      ["settings", "Settings", Settings2],
    ],
  ],
];
const recruiterGroups = [
  [
    "Hiring",
    [
      ["dashboard", "Overview", LayoutDashboard],
      ["jobs", "Jobs", BriefcaseBusiness],
      ["applicants", "Applicants", UsersRound],
      ["interviews", "Interviews", CalendarDays],
      ["analytics", "Analytics", ChartNoAxesCombined],
    ],
  ],
  [
    "Organization",
    [
      ["company", "Company", Building2],
      ["notifications", "Notifications", Bell],
      ["settings", "Settings", Settings2],
    ],
  ],
];
function Navigation({ close, groups, base }) {
  return (
    <nav aria-label={base.slice(1) + " navigation"}>
      {groups.map(([label, links]) => (
        <section className="c-nav-group" key={label}>
          <p>{label}</p>
          {links.map(([path, name, Icon]) => (
            <NavLink
              key={path}
              to={base + "/" + path}
              onClick={close}
              className={({ isActive }) =>
                "c-nav-link" + (isActive ? " is-active" : "")
              }
            >
              <Icon size={18} strokeWidth={1.7} aria-hidden="true" />
              {name}
            </NavLink>
          ))}
        </section>
      ))}
    </nav>
  );
}
export default function Workspace({ role = "candidate" }) {
  const base = "/" + role;
  const groups = role === "recruiter" ? recruiterGroups : candidateGroups;
  const workspaceLabel =
    role === "recruiter" ? "Recruiter workspace" : "Candidate workspace";
  const profilePath = base + (role === "recruiter" ? "/settings" : "/profile");
  const { user, logout } = useAuth();
  const [signingOut, setSigningOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");
  const handleLogout = async () => {
    if (signingOut) return;
    setSigningOut(true);
    setLogoutError("");
    try {
      await logout();
    } catch (error) {
      setLogoutError(error.message || "Could not sign out. Please try again.");
    } finally {
      setSigningOut(false);
    }
  };
  const navigate = useNavigate();
  const location = useLocation();
  const [search, setSearch] = useState("");
  const drawer = useRef(null);
  const menu = useRef(null);
  const main = useRef(null);
  const count = useQuery({
    queryKey: QUERY_KEYS.UNREAD_COUNT,
    queryFn: notificationApi.getUnreadCount,
    refetchInterval: 60000,
  });
  useEffect(() => {
    const segment = location.pathname.split("/")[2];
    const pageName =
      groups
        .flatMap(([, links]) => links)
        .find(([path]) => path === segment)?.[1] || workspaceLabel;
    document.title = pageName + " | HirePilot AI";
    drawer.current?.close();
    main.current?.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }, [location.pathname, groups, workspaceLabel]);
  const content = (
    <>
      <div className="c-sidebar-brand">
        <Brand />
        <span className="c-workspace-label">{workspaceLabel}</span>
      </div>
      <Navigation
        groups={groups}
        base={base}
        close={() => drawer.current?.close()}
      />
      <div className="c-account">
        <div className="c-account-row">
          <Link to={profilePath} className="c-user">
            <span className="c-avatar">
              {getInitials(user?.fullName) || "C"}
            </span>
            <span>
              <strong title={user?.fullName}>
                {user?.fullName || "Your profile"}
              </strong>
              <small>
                {role === "recruiter"
                  ? "Recruiter account"
                  : "Personal account"}
              </small>
            </span>
          </Link>
          <button
            type="button"
            className="c-icon-button c-sign-out"
            aria-label={signingOut ? "Signing out" : "Sign out"}
            title="Sign out"
            disabled={signingOut}
            aria-busy={signingOut || undefined}
            onClick={handleLogout}
          >
            {signingOut ? (
              <span className="hp-spinner" aria-hidden="true" />
            ) : (
              <LogOut size={18} strokeWidth={1.7} aria-hidden="true" />
            )}
          </button>
        </div>
        {logoutError && (
          <p className="c-account-error" role="alert">
            {logoutError}
          </p>
        )}
      </div>
    </>
  );
  return (
    <div className="hp-theme c-app">
      <a className="c-skip" href="#candidate-content">
        Skip to content
      </a>
      <aside className="c-sidebar">{content}</aside>
      <dialog
        className="c-drawer"
        ref={drawer}
        aria-label={workspaceLabel + " navigation"}
        onClose={() => menu.current?.focus()}
        onClick={(e) => {
          if (e.target === drawer.current) drawer.current.close();
        }}
      >
        <button
          className="c-icon-button c-drawer-close"
          aria-label="Close navigation"
          onClick={() => drawer.current.close()}
        >
          <X size={20} />
        </button>
        {content}
      </dialog>
      <div className="c-workspace">
        <header className="c-topbar">
          <button
            ref={menu}
            className="c-icon-button c-menu"
            aria-label="Open navigation"
            onClick={() => drawer.current.showModal()}
          >
            <Menu size={21} />
          </button>
          <form
            className="c-top-search"
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
              navigate(
                base +
                  "/jobs" +
                  (search.trim()
                    ? "?search=" + encodeURIComponent(search.trim())
                    : ""),
              );
            }}
          >
            <Search size={17} aria-hidden="true" />
            <input
              aria-label="Search jobs"
              type="search"
              enterKeyHint="search"
              placeholder={
                role === "recruiter"
                  ? "Search your job postings"
                  : "Search roles or keywords"
              }
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button type="submit">Search</button>
          </form>
          <div className="c-top-actions">
            <Link
              className="c-icon-button c-notification-link"
              to={base + "/notifications"}
              aria-label={
                count.data
                  ? `Notifications, ${count.data} unread`
                  : "Notifications"
              }
            >
              <Bell size={19} />
              {count.data > 0 && <span className="c-unread-dot" />}
            </Link>
            <Link
              className="c-avatar"
              to={profilePath}
              aria-label="Your profile"
            >
              {getInitials(user?.fullName) || "C"}
            </Link>
          </div>
        </header>
        <main
          id="candidate-content"
          className="c-main"
          ref={main}
          tabIndex={-1}
        >
          <Outlet />
        </main>
        <footer className="c-workspace-footer">
          <span>HirePilot AI</span>
          <span>
            {role === "recruiter"
              ? "Good hiring starts with a clear next step."
              : "A little more clarity. A better next step."}
          </span>
        </footer>
      </div>
    </div>
  );
}

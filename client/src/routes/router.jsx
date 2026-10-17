import { createBrowserRouter, Navigate } from "react-router-dom";

import PublicLayout from "../layouts/PublicLayout";
import AuthLayout from "../layouts/AuthLayout";
import CandidateLayout from "../layouts/CandidateLayout";
import RecruiterLayout from "../layouts/RecruiterLayout";
import AdminLayout from "../layouts/AdminLayout";

import ProtectedRoute from "./ProtectedRoute";
import PublicRoute from "./PublicRoute";

import Home from "../pages/public/Home";
import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
import ForgotPassword from "../components/auth/ForgotPassword";
import ResetPassword from "../components/auth/ResetPassword";
import VerifyEmail from "../components/auth/VerifyEmail";
import CandidateDashboard from "../pages/candidate/Dashboard";
import RecruiterDashboard from "../pages/recruiter/Dashboard";
import AdminDashboard from "../pages/admin/Dashboard";
import CandidateJobs from "../pages/candidate/Jobs";
import CandidateApplications from "../pages/candidate/Applications";
import CandidateResume from "../pages/candidate/Resume";
import CandidateResumeAI from "../pages/candidate/ResumeAI";
import CandidateJobMatching from "../pages/candidate/JobMatching";
import CandidateInterviews from "../pages/candidate/Interviews";
import CandidateNotifications from "../pages/candidate/Notifications";
import CandidateProfile from "../pages/candidate/Profile";
import CandidateSettings from "../pages/candidate/Settings";
import CandidateJobDetail from "../pages/candidate/JobDetail";
import CandidateApplicationDetail from "../pages/candidate/ApplicationDetail";
import CandidateAlias from "./CandidateAlias";

import RecruiterJobs from "../pages/recruiter/Jobs";
import RecruiterJobOverview from "../pages/recruiter/JobOverview";
import RecruiterEditJob from "../pages/recruiter/EditJob";
import RecruiterCreateJob from "../pages/recruiter/CreateJob";
import RecruiterApplicants from "../pages/recruiter/Applicants";
import RecruiterApplicantDetails from "../pages/recruiter/ApplicantDetails";
import RecruiterInterviews from "../pages/recruiter/Interviews";
import RecruiterAnalytics from "../pages/recruiter/Analytics";
import RecruiterCompany from "../pages/recruiter/Company";
import RecruiterNotifications from "../pages/recruiter/Notifications";
import RecruiterSettings from "../pages/recruiter/Settings";

const router = createBrowserRouter([
  {
    path: "/",
    element: <PublicLayout />,
    children: [
      {
        index: true,
        element: <Home />,
      },
    ],
  },

  {
    element: <PublicRoute />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          {
            path: "/login",
            element: <Login />,
          },
          {
            path: "/register",
            element: <Register />,
          },
          {
            path: "/forgot-password",
            element: <ForgotPassword />,
          },
          {
            path: "/reset-password",
            element: <ResetPassword />,
          },
          {
            path: "/verify-email",
            element: <VerifyEmail />,
          },
        ],
      },
    ],
  },

  {
    element: <ProtectedRoute />,
    children: [
      {
        path: "/candidate",
        element: <CandidateLayout />,
        children: [
          { index: true, element: <Navigate to="dashboard" replace /> },
          { path: "jobs/:jobId", element: <CandidateJobDetail /> },
          {
            path: "applications/:applicationId",
            element: <CandidateApplicationDetail />,
          },
          { path: "resume-builder", element: <CandidateResume /> },
          { path: "ai-resume-audit", element: <CandidateResumeAI /> },
          {
            path: "dashboard",
            element: <CandidateDashboard />,
          },
          {
            path: "jobs",
            element: <CandidateJobs />,
          },
          {
            path: "applications",
            element: <CandidateApplications />,
          },
          {
            path: "resume",
            element: <CandidateAlias to="/candidate/resume-builder" />,
          },
          {
            path: "resume-ai",
            element: <CandidateAlias to="/candidate/ai-resume-audit" />,
          },
          {
            path: "job-matching",
            element: <CandidateJobMatching />,
          },
          {
            path: "interviews",
            element: <CandidateInterviews />,
          },
          {
            path: "notifications",
            element: <CandidateNotifications />,
          },
          {
            path: "profile",
            element: <CandidateProfile />,
          },
          {
            path: "settings",
            element: <CandidateSettings />,
          },
        ],
      },
      {
        path: "/recruiter",
        element: <RecruiterLayout />,
        children: [
          { path: "jobs/:jobId", element: <RecruiterJobOverview /> },
          { path: "jobs/:jobId/edit", element: <RecruiterEditJob /> },
          {
            path: "dashboard",
            element: <RecruiterDashboard />,
          },
          {
            path: "jobs",
            element: <RecruiterJobs />,
          },
          {
            path: "jobs/create",
            element: <RecruiterCreateJob />,
          },
          {
            path: "applicants",
            element: <RecruiterApplicants />,
          },
          {
            path: "applicants/:applicationId",
            element: <RecruiterApplicantDetails />,
          },
          {
            path: "interviews",
            element: <RecruiterInterviews />,
          },
          {
            path: "analytics",
            element: <RecruiterAnalytics />,
          },
          {
            path: "company",
            element: <RecruiterCompany />,
          },
          {
            path: "notifications",
            element: <RecruiterNotifications />,
          },
          {
            path: "settings",
            element: <RecruiterSettings />,
          },
        ],
      },
      {
        path: "/admin",
        element: <AdminLayout />,
        children: [
          {
            path: "dashboard",
            element: <AdminDashboard />,
          },
        ],
      },
    ],
  },
]);

export default router;

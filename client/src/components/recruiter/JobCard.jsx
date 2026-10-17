import { DollarSign, MoreHorizontal, Users, Tag } from "lucide-react";
import { Link } from "react-router-dom";
import { getJobStatusConfig, getEmploymentTypeLabel } from "../../utils/status";
import { formatSalary, formatDate } from "../../utils/format";

export default function JobCard({ job }) {
  const status = getJobStatusConfig(job.status);

  return (
    <div className="p-5 bg-[#0a0a0a] border border-gray-800 rounded-xl hover:border-gray-700 transition-all flex flex-col">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-semibold text-white">{job.title}</h3>
          <p className="text-xs text-gray-500 mt-1">
            {job.location} • {getEmploymentTypeLabel(job.employmentType)}
          </p>
        </div>
        <button className="text-gray-500 hover:text-white p-1">
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="flex flex-col">
          <span className="text-xs text-gray-500">Salary</span>
          <span className="text-sm font-semibold text-white flex items-center gap-1">
            <DollarSign className="w-3.5 h-3.5 text-gray-400" /> {formatSalary(job.salaryMin, job.salaryMax)}
          </span>
        </div>
        <div className="w-px h-8 bg-gray-800"></div>
        <div className="flex flex-col">
          <span className="text-xs text-gray-500">Skills</span>
          <span className="text-sm font-semibold text-white flex items-center gap-1">
            <Tag className="w-3.5 h-3.5 text-gray-400" /> {job.requiredSkills?.length ?? 0}
          </span>
        </div>
        <div className="w-px h-8 bg-gray-800"></div>
        <div className="flex flex-col">
          <span className="text-xs text-gray-500">Posted</span>
          <span className="text-sm font-semibold text-white">{formatDate(job.createdAt)}</span>
        </div>
      </div>

      {job.requiredSkills?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {job.requiredSkills.slice(0, 4).map((skill) => (
            <span
              key={skill}
              className="px-2 py-0.5 text-[10px] font-medium text-gray-300 bg-gray-900 border border-gray-800 rounded"
            >
              {skill}
            </span>
          ))}
          {job.requiredSkills.length > 4 && (
            <span className="px-2 py-0.5 text-[10px] font-medium text-gray-500">
              +{job.requiredSkills.length - 4}
            </span>
          )}
        </div>
      )}

      <div className="mt-auto flex items-center justify-between pt-4 border-t border-gray-800">
        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${status.className}`}>
          {status.label}
        </span>

        <Link
          to={`/recruiter/applicants?jobId=${job.id}`}
          className="flex items-center gap-1 text-[10px] text-[#06B6D4] font-medium bg-[#06B6D4]/10 px-2 py-1 rounded border border-[#06B6D4]/20 hover:bg-[#06B6D4]/20 transition-colors"
        >
          <Users className="w-3 h-3" /> View Applicants
        </Link>
      </div>
    </div>
  );
}

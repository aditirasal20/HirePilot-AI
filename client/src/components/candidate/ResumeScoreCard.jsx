import { Sparkles, CheckCircle2, AlertCircle, ArrowRight, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import Skeleton from "../shared/Skeleton";

export default function ResumeScoreCard({ resume = null, loading = false }) {
  const aiScore = resume?.aiScore;

  return (
    <div className="bg-gradient-to-br from-[#0a0a0a] to-[#111827] border border-gray-800 rounded-xl p-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#4F46E5]/10 rounded-full blur-2xl"></div>

      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[#06B6D4]" />
          <h2 className="text-base font-semibold text-white">AI ATS Resume Audit</h2>
        </div>
        {loading ? (
          <Skeleton className="h-7 w-16" />
        ) : aiScore != null ? (
          <span className="text-2xl font-black text-white bg-clip-text text-transparent bg-gradient-to-r from-[#4F46E5] to-[#06B6D4]">
            {Math.round(aiScore)}/100
          </span>
        ) : (
          <span className="text-sm font-semibold text-gray-500">Not analyzed</span>
        )}
      </div>

      <p className="text-xs text-gray-400 mb-4 relative z-10">
        {resume
          ? `Resume "${resume.title}" parses cleanly and is ready for detailed AI analysis.`
          : "Upload your resume to unlock AI-powered ATS scanning, keyword analysis, and actionable improvement tips."}
      </p>

      <div className="space-y-2 mb-6 text-xs relative z-10">
        {resume ? (
          resume.extractedSkills?.length > 0 ? (
            resume.extractedSkills.slice(0, 3).map((skill, index) => (
              <div key={skill} className="flex items-center gap-2 text-emerald-400">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>
                  {index === 0
                    ? "Strong keyword density detected"
                    : index === 1
                    ? "Clear structural headings found"
                    : `Skill recognized: ${skill}`}
                </span>
              </div>
            ))
          ) : (
            <div className="flex items-center gap-2 text-emerald-400">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>Resume uploaded and ready for scanning</span>
            </div>
          )
        ) : (
          <div className="flex items-center gap-2 text-amber-400">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>No resume yet — add one to get your AI score</span>
          </div>
        )}
      </div>

      <Link
        to={resume ? "/candidate/resume-ai" : "/candidate/resume"}
        className="w-full py-2.5 bg-[#4F46E5]/20 border border-[#4F46E5]/40 hover:bg-[#4F46E5]/30 text-white text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-2 relative z-10"
      >
        {resume ? (
          <>
            Run Detailed AI Scan <ArrowRight className="w-3.5 h-3.5" />
          </>
        ) : (
          <>
            <FileText className="w-3.5 h-3.5" /> Upload Resume
          </>
        )}
      </Link>
    </div>
  );
}

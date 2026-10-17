import { AlertTriangle } from "lucide-react";

export default function ErrorState({ title = "Something went wrong", message, onRetry }) {
  return (
    <div className="p-12 text-center bg-[#0a0a0a] border border-gray-800 rounded-xl">
      <div className="mx-auto w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4">
        <AlertTriangle className="w-6 h-6 text-red-400" />
      </div>
      <h3 className="text-sm font-semibold text-white">{title}</h3>
      {message && (
        <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto leading-relaxed">
          {message}
        </p>
      )}
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 px-4 py-2 bg-[#4F46E5] hover:bg-[#4338ca] text-white text-xs font-semibold rounded-lg transition-colors"
        >
          Try Again
        </button>
      )}
    </div>
  );
}

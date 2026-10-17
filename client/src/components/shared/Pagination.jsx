import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Pagination({ page = 1, totalPages = 1, onPageChange }) {
  if (totalPages <= 1) return null;

  const prevDisabled = page <= 1;
  const nextDisabled = page >= totalPages;

  return (
    <div className="flex items-center justify-center gap-3 pt-2">
      <button
        disabled={prevDisabled}
        onClick={() => onPageChange?.(page - 1)}
        className="p-2 rounded-lg border border-gray-800 text-gray-400 hover:text-white hover:bg-gray-800 disabled:opacity-40 disabled:pointer-events-none transition-colors"
        aria-label="Previous page"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      <span className="text-xs text-gray-400">
        Page {page} of {totalPages}
      </span>
      <button
        disabled={nextDisabled}
        onClick={() => onPageChange?.(page + 1)}
        className="p-2 rounded-lg border border-gray-800 text-gray-400 hover:text-white hover:bg-gray-800 disabled:opacity-40 disabled:pointer-events-none transition-colors"
        aria-label="Next page"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

export default function StatusBadge({ label, className = "" }) {
  return (
    <span
      className={`px-2.5 py-1 text-xs font-medium rounded-full border inline-flex items-center ${className}`}
    >
      {label}
    </span>
  );
}

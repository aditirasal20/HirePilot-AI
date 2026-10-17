export default function Skeleton({ variant = "text", className = "" }) {
  const base =
    variant === "text"
      ? "h-3 rounded-md bg-gray-800/60"
      : variant === "title"
      ? "h-5 rounded-md bg-gray-800/60"
      : variant === "card"
      ? "h-40 rounded-xl bg-gray-800/40"
      : variant === "circle"
      ? "rounded-full bg-gray-800/60"
      : "h-3 rounded-md bg-gray-800/60";

  return <div aria-hidden="true" className={`animate-pulse ${base} ${className}`} />;
}

import { useEffect, useRef } from "react";
export default function FormNotice({ children, tone = "error" }) {
  const ref = useRef(null);
  useEffect(() => {
    if (tone === "error" && children) ref.current?.focus();
  }, [children, tone]);
  if (!children) return null;
  return (
    <div
      ref={ref}
      tabIndex={-1}
      role={tone === "error" ? "alert" : "status"}
      className={`hp-notice hp-notice-${tone}`}
    >
      {children}
    </div>
  );
}

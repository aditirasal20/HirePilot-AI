import Brand from "../ui/Brand";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
const links = [
  ["Product", "#ai-tools"],
  ["For candidates", "#candidates"],
  ["For recruiters", "#recruiters"],
  ["How it works", "#how-it-works"],
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  return (
    <header className="hp-header">
      <div className="hp-nav-shell flex items-center justify-between gap-6">
        <Brand />
        <nav
          aria-label="Main navigation"
          className="hidden lg:flex items-center gap-7"
        >
          {links.map(([label, href]) => (
            <a key={href} href={href}>
              {label}
            </a>
          ))}
        </nav>
        <div className="hidden lg:flex items-center gap-7">
          <Link to="/login">Log in</Link>
          <Link
            to="/register"
            className="hp-button hp-button-dark hp-button-small"
          >
            Get started
          </Link>
        </div>
        <button
          className="hp-menu-button lg:hidden"
          aria-label={open ? "Close navigation" : "Open navigation"}
          aria-expanded={open}
          aria-controls="mobile-navigation"
          onClick={() => setOpen(!open)}
          onKeyDown={(event) => {
            if (event.key === "Escape") setOpen(false);
          }}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>
      {open && (
        <nav
          id="mobile-navigation"
          aria-label="Mobile navigation"
          className="hp-mobile-nav lg:hidden"
          onKeyDown={(event) => {
            if (event.key === "Escape") setOpen(false);
          }}
        >
          {links.map(([label, href]) => (
            <a key={href} href={href} onClick={() => setOpen(false)}>
              {label}
            </a>
          ))}
          <Link to="/login">Log in</Link>
          <Link to="/register" className="hp-button hp-button-dark">
            Get started
          </Link>
        </nav>
      )}
    </header>
  );
}

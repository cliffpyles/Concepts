import { Outlet, Link } from "react-router";
import { Github } from "lucide-react";

export default function App() {
  return (
    <div className="app-shell">
      {/* Global Persistent Navigation */}
      <nav className="global-nav">
        <div className="global-nav__inner">
          <Link to="/" className="brand-link">
            <div className="brand-logo" />
            <span className="brand-name">Concepts</span>
          </Link>

          <div className="nav-actions">
            <a
              href="https://github.com/cliffpyles"
              target="_blank"
              rel="noopener noreferrer"
              className="nav-icon-link"
              aria-label="View cliffpyles on GitHub"
            >
              <Github size={18} />
            </a>
          </div>
        </div>
      </nav>
      <Outlet />
    </div>
  );
}
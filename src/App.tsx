import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Search,
  SlidersHorizontal,
  LayoutGrid,
  List as ListIcon,
  Eye,
  Heart,
  MessageCircle,
  Codepen,
  Github,
  Terminal,
  ArrowUpRight,
  Code2
} from "lucide-react";
import pensData from "./data/pens.json";
import type { Pen } from "./types/pen"; // Ensure your types/pen.ts includes createdAt, updatedAt, and code
import "./App.css";

// Inject a mock local sandbox item for the "Vault" experience
const localMock: Pen = {
  id: "local-01",
  title: "Framer Motion Fluid Interactions",
  details: "Local sandbox testing environment for spring physics and layout animations.",
  link: "/sandbox/fluid-interactions",
  views: "0", loves: "0", comments: "0",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

const allResources = [localMock, ...(pensData.pens as Pen[])];

type ViewMode = "grid" | "list";
type SortMode = "newest" | "updated" | "popular" | "loved";

const getPlatformInfo = (link: string) => {
  if (link.startsWith("/")) return { name: "Local Sandbox", icon: Terminal, color: "#059669" };
  if (link.includes("github.com")) return { name: "GitHub", icon: Github, color: "#0f172a" };
  return { name: "CodePen", icon: Codepen, color: "#475569" };
};

// Formats a date string beautifully (e.g., "Oct 24, 2023")
const formatDate = (dateString?: string) => {
  if (!dateString) return "";
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(dateString));
};

function ResourceCard({ pen, viewMode }: { pen: Pen; viewMode: ViewMode }) {
  const PlatformIcon = getPlatformInfo(pen.link).icon;
  const thumb = pen.images?.large ?? pen.images?.small;
  const isLocal = pen.link.startsWith("/");

  // Use true creation date, fallback to when we first indexed it
  const displayDate = pen.createdAt || pen.firstSeen;
  const isUpdated = pen.updatedAt && pen.createdAt && pen.updatedAt !== pen.createdAt;

  return (
    <motion.a
      href={pen.link}
      target={isLocal ? "_self" : "_blank"}
      rel="noopener noreferrer"
      className={`resource-card ${viewMode}-card group`}
      initial={{ opacity: 0, y: 15, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, filter: "blur(4px)" }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      layout="position"
    >
      <div className="card__media">
        {thumb ? (
          <img src={thumb} alt={pen.title} loading="lazy" className="card__image" />
        ) : (
          <div className="card__image-fallback">
            <PlatformIcon size={32} className="fallback-icon" />
          </div>
        )}
        <div className="card__overlay">
          <span className="badge-glass">
            {isLocal ? "Enter Sandbox" : "View Source"}
            <ArrowUpRight size={14} />
          </span>
        </div>
      </div>

      <div className="card__content">
        <div className="card__header">
          <div className="card__title-group">
            <div className="card__platform" title={getPlatformInfo(pen.link).name}>
              <PlatformIcon size={14} />
            </div>
            <h3 className="card__title">{pen.title || "Untitled Fragment"}</h3>
          </div>
        </div>

        {pen.details && viewMode === "list" && (
          <p className="card__description">{pen.details}</p>
        )}

        {/* Display Tech Stack if available (List view only) */}
        {pen.code && viewMode === "list" && (
          <div className="card__tech-stack">
            {pen.code.html && <span className="tech-badge">HTML</span>}
            {pen.code.css && <span className="tech-badge">CSS</span>}
            {pen.code.js && <span className="tech-badge">JS</span>}
          </div>
        )}

        <div className="card__footer">
          <div className="metrics__group">
            {pen.views !== undefined && pen.views !== "0" && <span><Eye size={14} /> {parseInt(pen.views).toLocaleString()}</span>}
            {pen.loves !== undefined && pen.loves !== "0" && <span><Heart size={14} /> {parseInt(pen.loves).toLocaleString()}</span>}
            {pen.comments !== undefined && pen.comments !== "0" && <span><MessageCircle size={14} /> {parseInt(pen.comments).toLocaleString()}</span>}
          </div>

          <div className="card__timestamps">
            {displayDate && <span className="card__date">{formatDate(displayDate)}</span>}
            {isUpdated && viewMode === "list" && (
              <span className="card__date card__date--updated" title={`Updated: ${formatDate(pen.updatedAt)}`}>
                • Updated
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.a>
  );
}

export default function App() {
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortMode>("newest");

  const processedResources = useMemo(() => {
    // 1. Filter
    let filtered = allResources.filter(pen =>
      (pen.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (pen.details || "").toLowerCase().includes(searchQuery.toLowerCase())
    );

    // 2. Sort
    return filtered.sort((a, b) => {
      if (sortBy === "popular") return parseInt(b.views || "0") - parseInt(a.views || "0");
      if (sortBy === "loved") return parseInt(b.loves || "0") - parseInt(a.loves || "0");

      if (sortBy === "updated") {
        const bDate = b.updatedAt ?? b.createdAt ?? b.firstSeen ?? "";
        const aDate = a.updatedAt ?? a.createdAt ?? a.firstSeen ?? "";
        return bDate.localeCompare(aDate);
      }

      // Default: Newest (Created)
      const bDate = b.createdAt ?? b.firstSeen ?? "";
      const aDate = a.createdAt ?? a.firstSeen ?? "";
      return bDate.localeCompare(aDate);
    });
  }, [searchQuery, sortBy]);

  return (
    <div className="app">
      <main className="main">
        <header className="hero">
          <h1 className="hero__title">Concepts Vault</h1>
          <p className="hero__subtitle">
            An indexed archive of {allResources.length} local environments and synced architectural fragments.
          </p>
        </header>

        <div className="toolbar-wrapper">
          <div className="toolbar">
            <div className="search-box">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                placeholder="Search concepts, layouts, or environments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </div>

            <div className="toolbar__controls">
              <div className="select-wrapper">
                <SlidersHorizontal size={14} className="select-icon" />
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortMode)} className="select-input">
                  <option value="newest">Recently Created</option>
                  <option value="updated">Recently Updated</option>
                  <option value="popular">Most Viewed</option>
                  <option value="loved">Most Loved</option>
                </select>
              </div>

              <div className="divider" />

              <div className="segmented-control" role="group">
                {(["grid", "list"] as const).map((mode) => (
                  <button
                    key={mode}
                    className={`segmented-btn ${viewMode === mode ? "active" : ""}`}
                    onClick={() => setViewMode(mode)}
                    aria-label={`Switch to ${mode} view`}
                  >
                    {mode === "grid" ? <LayoutGrid size={15} /> : <ListIcon size={15} />}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {processedResources.length === 0 ? (
            <motion.div
              key="empty"
              className="empty-state"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="empty-state__icon"><Code2 size={32} /></div>
              <h3>No results found</h3>
              <p>No sequences match "{searchQuery}"</p>
            </motion.div>
          ) : (
            <motion.div
              key={viewMode}
              className={`resource-grid layout-${viewMode}`}
            >
              {processedResources.map((pen) => (
                <ResourceCard key={pen.id || pen.link} pen={pen} viewMode={viewMode} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
import { useMemo, useState } from "react";
import { useLoaderData } from "react-router";
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
import type { Concept, ConceptDataContainer } from "../types/concept";

// ==========================================================================
// 1. ROUTE LOADER (Data Mode)
// Fetches JSON data before the component even mounts, eliminating layout shift.
// ==========================================================================
export async function galleryLoaderV1() {
    // Dynamically import JSON chunks so they don't bloat the initial JS payload
    const [pensModule, sandboxModule] = await Promise.all([
        import("../data/pens.json").catch(() => ({ default: { concepts: [] } })),
        import("../data/sandbox.json").catch(() => ({ default: { concepts: [] } }))
    ]);

    const pensData = pensModule.default as ConceptDataContainer;
    const sandboxData = sandboxModule.default as ConceptDataContainer;

    // Merge our multi-source architecture into one unified timeline
    const allConcepts = [
        ...(sandboxData.concepts || []),
        ...(pensData.concepts || [])
    ];

    return { concepts: allConcepts };
}

// ==========================================================================
// 1. ROUTE LOADER (Data Mode)
// ==========================================================================
export async function galleryLoader() {
    // Dynamically import JSON chunks
    const [pensModule, sandboxModule] = await Promise.all([
        import("../data/pens.json").catch(() => ({ default: { pens: [] } })), // fallback to pens: []
        import("../data/sandbox.json").catch(() => ({ default: { concepts: [] } }))
    ]);

    // Use 'any' here temporarily because pens.json and sandbox.json have slightly different root keys right now
    const pensData = pensModule.default as any;
    const sandboxData = sandboxModule.default as any;

    // Extract the arrays (handle the legacy 'pens' key from pens.json)
    const rawPens = pensData.concepts || pensData.pens || [];
    const localSandboxes = sandboxData.concepts || [];

    // Data Adapter: Upgrade legacy pens.json items to the unified Concept interface on the fly
    const upgradedPens = rawPens.map((pen: any) => ({
        ...pen,
        platform: "CodePen", // Inject the missing platform tag
        // Ensure we have valid timestamps for sorting, falling back to firstSeen if legacy
        createdAt: pen.createdAt || pen.firstSeen || new Date().toISOString(),
        updatedAt: pen.updatedAt || pen.createdAt || pen.firstSeen || new Date().toISOString(),
        metrics: {
            views: parseInt(pen.views || "0", 10),
            loves: parseInt(pen.loves || "0", 10),
            comments: parseInt(pen.comments || "0", 10),
        }
    }));

    // Merge our multi-source architecture into one unified timeline
    const allConcepts = [
        ...localSandboxes,
        ...upgradedPens
    ];

    return { concepts: allConcepts };
}

type ViewMode = "grid" | "list";
type SortMode = "newest" | "updated" | "popular" | "loved";

// ==========================================================================
// 2. HELPERS
// ==========================================================================
const getPlatformInfo = (link: string) => {
    if (link.startsWith("/")) return { name: "Local Sandbox", icon: Terminal };
    if (link.includes("github.com")) return { name: "GitHub", icon: Github };
    return { name: "CodePen", icon: Codepen };
};

const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    }).format(new Date(dateString));
};

// ==========================================================================
// 3. RESOURCE CARD COMPONENT
// ==========================================================================
function ResourceCard({ concept, viewMode }: { concept: Concept; viewMode: ViewMode }) {
    const PlatformIcon = getPlatformInfo(concept.link).icon;
    const thumb = concept.images?.large ?? concept.images?.small;
    const isLocal = concept.platform === "Sandbox";

    // Use true creation date
    const displayDate = concept.createdAt;
    const isUpdated = concept.updatedAt && concept.createdAt && concept.updatedAt !== concept.createdAt;

    return (
        <motion.a
            href={concept.link}
            target={isLocal ? "_self" : "_blank"}
            rel="noopener noreferrer"
            className={`resource-card layout-${viewMode} group`}
            initial={{ opacity: 0, y: 15, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, filter: "blur(4px)" }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            layout="position"
        >
            <div className="card__media">
                {thumb ? (
                    <img src={thumb} alt={concept.title} loading="lazy" className="card__image" />
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
                        <div className="card__platform" title={getPlatformInfo(concept.link).name}>
                            <PlatformIcon size={14} />
                        </div>
                        <h3 className="card__title">{concept.title || "Untitled Fragment"}</h3>
                    </div>
                </div>

                {concept.details && viewMode === "list" && (
                    <p className="card__description">{concept.details}</p>
                )}

                {/* Display Tech Stack if available (List view only) */}
                {concept.techStack && viewMode === "list" && (
                    <div className="card__tech-stack">
                        {Object.entries(concept.techStack)
                            .filter(([_, isActive]) => isActive)
                            .map(([tech]) => (
                                <span key={tech} className="tech-badge">{tech}</span>
                            ))}
                    </div>
                )}

                <div className="card__footer">
                    <div className="metrics__group">
                        {concept.metrics?.views !== undefined && concept.metrics.views > 0 && <span><Eye size={14} /> {concept.metrics.views.toLocaleString()}</span>}
                        {concept.metrics?.loves !== undefined && concept.metrics.loves > 0 && <span><Heart size={14} /> {concept.metrics.loves.toLocaleString()}</span>}
                        {concept.metrics?.comments !== undefined && concept.metrics.comments > 0 && <span><MessageCircle size={14} /> {concept.metrics.comments.toLocaleString()}</span>}
                    </div>

                    <div className="card__timestamps">
                        {displayDate && <span className="card__date">{formatDate(displayDate)}</span>}
                        {isUpdated && viewMode === "list" && (
                            <span className="card__date card__date--updated" title={`Updated: ${formatDate(concept.updatedAt)}`}>
                                • Updated
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </motion.a>
    );
}

// ==========================================================================
// 4. MAIN GALLERY ROUTE
// ==========================================================================
export default function GalleryRoute() {
    // Data is guaranteed to be here because of the router loader
    const { concepts } = useLoaderData() as { concepts: Concept[] };

    const [viewMode, setViewMode] = useState<ViewMode>("grid");
    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState<SortMode>("newest");

    const processedConcepts = useMemo(() => {
        // 1. Filter
        let filtered = concepts.filter(concept =>
            (concept.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
            (concept.details || "").toLowerCase().includes(searchQuery.toLowerCase())
        );

        // 2. Sort
        return filtered.sort((a, b) => {
            if (sortBy === "popular") return (b.metrics?.views || 0) - (a.metrics?.views || 0);
            if (sortBy === "loved") return (b.metrics?.loves || 0) - (a.metrics?.loves || 0);

            if (sortBy === "updated") {
                return b.updatedAt.localeCompare(a.updatedAt);
            }

            // Default: Newest (Created)
            return b.createdAt.localeCompare(a.createdAt);
        });
    }, [concepts, searchQuery, sortBy]);

    return (
        <main className="main-content">
            <header className="hero">
                <h1 className="hero__title">Concepts Vault</h1>
                <p className="hero__subtitle">
                    An indexed archive of {concepts.length} local environments and synced architectural fragments.
                </p>
            </header>

            {/* Floating Toolbar */}
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

            {/* Render Grid / List */}
            <AnimatePresence mode="wait">
                {processedConcepts.length === 0 ? (
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
                        {processedConcepts.map((concept) => (
                            <ResourceCard key={concept.id || concept.link} concept={concept} viewMode={viewMode} />
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </main>
    );
}
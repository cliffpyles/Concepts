import { useLoaderData, Link } from "react-router";
import { ArrowLeft, Terminal } from "lucide-react";
import type { Concept, ConceptDataContainer } from "../types/concept";

// ==========================================================================
// 1. ROUTE LOADER (Data Mode)
// Validates the experiment exists in our generated registry before rendering.
// ==========================================================================
export async function sandboxLoader({ params }: { params: any }) {
    const { experimentId } = params;

    // Dynamically fetch our generated sandbox registry
    const module = await import("../data/sandbox.json").catch(() => ({
        default: { concepts: [] }
    }));

    const sandboxData = module.default as ConceptDataContainer;
    const concept = sandboxData.concepts.find(c => c.link === `/sandbox/${experimentId}`);

    if (!concept) {
        // React Router will catch this and render your ErrorBoundary (if configured)
        throw new Response("Sandbox experiment not found in registry", { status: 404 });
    }

    return { concept, experimentId };
}

// ==========================================================================
// 2. MAIN COMPONENT
// Renders the Vault UI shell and mounts the isolated iframe.
// ==========================================================================
export default function SandboxRoute() {
    const { concept, experimentId } = useLoaderData() as {
        concept: Concept;
        experimentId: string;
    };

    return (
        <div className="sandbox-environment">
            {/* Sandbox Header & Breadcrumbs */}
            <header className="sandbox-header">
                <div className="sandbox-header__inner">
                    <Link to="/" className="back-link">
                        <ArrowLeft size={16} />
                        <span>Back to Vault</span>
                    </Link>

                    <div className="sandbox-meta">
                        <div className="sandbox-badge">
                            <Terminal size={14} />
                            <span>Local Sandbox</span>
                        </div>
                        <h1 className="sandbox-title">{concept.title}</h1>
                    </div>

                    {/* Tech stack badges parsed from your Markdown frontmatter */}
                    {concept.techStack && (
                        <div className="sandbox-tech">
                            {Object.entries(concept.techStack)
                                .filter(([_, isActive]) => isActive)
                                .map(([tech]) => (
                                    <span key={tech} className="tech-badge">{tech}</span>
                                ))}
                        </div>
                    )}
                </div>
            </header>

            {/* The Isolation Frame 
        This iframe points to the second Vite entry point (sandbox.html).
        It guarantees 100% CSS and JS isolation from the main app shell.
      */}
            <main className="sandbox-frame" style={{ padding: 0, overflow: "hidden" }}>
                <iframe
                    src={`/sandbox.html?id=${experimentId}`}
                    title={`Sandbox Environment: ${concept.title}`}
                    style={{
                        width: "100%",
                        height: "100%",
                        border: "none",
                        background: "transparent",
                        display: "block"
                    }}
                    sandbox="allow-scripts allow-same-origin"
                />
            </main>
        </div>
    );
}
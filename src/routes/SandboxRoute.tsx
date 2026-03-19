import { lazy, Suspense } from "react";
import { useLoaderData, useParams, Link } from "react-router";
import { ArrowLeft, Loader2, Terminal } from "lucide-react";
import type { Concept, ConceptDataContainer } from "../types/concept";

// 1. THE LOADER: Validates the experiment exists before rendering
export async function sandboxLoader({ params }: { params: any }) {
    const { experimentId } = params;

    // Fetch our generated sandbox registry
    const module = await import("../data/sandbox.json").catch(() => ({
        default: { concepts: [] }
    }));

    const sandboxData = module.default as ConceptDataContainer;
    const concept = sandboxData.concepts.find(c => c.link === `/sandbox/${experimentId}`);

    if (!concept) {
        throw new Response("Sandbox experiment not found", { status: 404 });
    }

    return { concept, experimentId };
}

// 2. THE COMPONENT: Renders the shell and dynamically loads the experiment code
export default function SandboxRoute() {
    const { concept, experimentId } = useLoaderData() as { concept: Concept, experimentId: string };

    // Dynamically import the specific sandbox component based on the URL parameter.
    // Vite statically analyzes this and creates separate chunks for each folder in src/sandbox/
    const Experiment = lazy(() =>
        import(`../sandbox/${experimentId}/index.tsx`).catch(() => {
            return { default: () => <div className="sandbox-error">Failed to load component. Does src/sandbox/{experimentId}/index.tsx exist?</div> };
        })
    );

    return (
        <div className="sandbox-environment">
            {/* Sandbox Header / Breadcrumb */}
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

                    {/* Tech stack badges from your Markdown frontmatter */}
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

            {/* The Isolation Frame for your experiment */}
            <main className="sandbox-frame">
                <Suspense
                    fallback={
                        <div className="sandbox-loading">
                            <Loader2 size={24} className="spin" />
                            <span>Mounting Environment...</span>
                        </div>
                    }
                >
                    <Experiment />
                </Suspense>
            </main>
        </div>
    );
}
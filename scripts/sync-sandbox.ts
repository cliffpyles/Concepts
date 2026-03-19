/**
 * Syncs local sandbox environments into the Concepts collection.
 * Scans src/sandbox/* /README.md, parses frontmatter, and outputs to src/data/sandbox.json
 * Run with: npm run sync:sandbox (after adding to package.json)
 */
import { readdirSync, statSync, readFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import matter from "gray-matter";

// Emulate __dirname in ESM
const __dirname = dirname(fileURLToPath(import.meta.url));

const SANDBOX_DIR = join(__dirname, "../src/sandbox");
const OUTPUT_PATH = join(__dirname, "../src/data/sandbox.json");

// Matches the unified Concept interface we defined
interface Concept {
    id: string;
    title: string;
    details?: string;
    link: string;
    platform: "CodePen" | "Sandbox" | "GitHub" | "Colab";
    createdAt: string;
    updatedAt: string;
    metrics?: { views?: number; loves?: number; comments?: number };
    techStack?: Record<string, boolean | undefined>;
}

interface ConceptDataContainer {
    concepts: Concept[];
    lastSynced: string;
}

function getDirectories(srcPath: string) {
    if (!existsSync(srcPath)) return [];
    return readdirSync(srcPath).filter(file =>
        statSync(join(srcPath, file)).isDirectory()
    );
}

// Helper to strip markdown formatting for a clean excerpt
function createExcerpt(markdown: string, maxLength: number = 150): string {
    // Remove headers, bolding, links, etc.
    const plainText = markdown
        .replace(/^#+\s+/gm, "") // Remove headers
        .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // Extract link text
        .replace(/(\*\*|__)(.*?)\1/g, "$2") // Remove bold
        .replace(/(\*|_)(.*?)\1/g, "$2") // Remove italics
        .replace(/\n/g, " ") // Replace newlines with spaces
        .trim();

    if (plainText.length <= maxLength) return plainText;
    return plainText.substring(0, maxLength).trim() + "...";
}

async function main() {
    console.log("Syncing local sandbox environments...");

    if (!existsSync(SANDBOX_DIR)) {
        console.log(`Sandbox directory not found at ${SANDBOX_DIR}. Creating it...`);
        // Create the directory if it doesn't exist yet to prevent errors
        import("fs").then(fs => fs.mkdirSync(SANDBOX_DIR, { recursive: true }));
    }

    const sandboxFolders = getDirectories(SANDBOX_DIR);
    const concepts: Concept[] = [];
    const now = new Date().toISOString();

    for (const folderName of sandboxFolders) {
        const readmePath = join(SANDBOX_DIR, folderName, "README.md");

        if (!existsSync(readmePath)) {
            console.warn(`⚠️  Skipping "${folderName}": No README.md found.`);
            continue;
        }

        try {
            const fileContents = readFileSync(readmePath, "utf-8");
            // Parse the frontmatter and the markdown body
            const { data: frontmatter, content } = matter(fileContents);

            // Construct the Concept object
            const concept: Concept = {
                id: frontmatter.id || `sandbox-${folderName}`,
                title: frontmatter.title || folderName.replace(/-/g, " "),
                // Use frontmatter details if provided, otherwise generate an excerpt from the README body
                details: frontmatter.details || createExcerpt(content) || "A local sandbox experiment.",
                link: `/sandbox/${folderName}`,
                platform: "Sandbox",
                createdAt: frontmatter.createdAt || now,
                updatedAt: frontmatter.updatedAt || frontmatter.createdAt || now,
                techStack: frontmatter.techStack || {},
                metrics: { views: 0, loves: 0, comments: 0 } // Default metrics for local files
            };

            concepts.push(concept);
        } catch (err) {
            console.error(`❌ Error parsing ${readmePath}:`, err);
        }
    }

    // Sort chronologically (newest first based on creation)
    concepts.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    const outputData: ConceptDataContainer = {
        concepts,
        lastSynced: now,
    };

    writeFileSync(OUTPUT_PATH, JSON.stringify(outputData, null, 2), "utf-8");
    console.log(`✅ Successfully synced ${concepts.length} sandbox experiments to ${OUTPUT_PATH}`);
}

main().catch((err) => {
    console.error("Failed to sync sandbox:", err.message);
    process.exit(1);
});
/**
 * Creates a new sandbox experiment with scaffolded files.
 * Run with: npm run create:sandbox <experiment-id> [title]
 *
 * Example:
 *   npm run create:sandbox my-demo
 *   npm run create:sandbox my-demo "My Cool Demo"
 */
import { mkdirSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { spawnSync } from "child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SANDBOX_DIR = join(__dirname, "../src/sandbox");

function slugToPascal(slug: string): string {
    return slug
        .split("-")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join("");
}

function slugToTitle(slug: string): string {
    return slug
        .split("-")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join(" ");
}

function main() {
    const args = process.argv.slice(2);
    const experimentId = args[0];
    const titleArg = args[1];

    if (!experimentId) {
        console.error("Usage: npm run create:sandbox <experiment-id> [title]");
        console.error("Example: npm run create:sandbox my-demo \"My Cool Demo\"");
        process.exit(1);
    }

    // Validate: kebab-case, alphanumeric and hyphens only
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(experimentId)) {
        console.error("Error: experiment-id must be kebab-case (e.g. my-cool-demo)");
        process.exit(1);
    }

    const sandboxPath = join(SANDBOX_DIR, experimentId);
    if (existsSync(sandboxPath)) {
        console.error(`Error: Sandbox "${experimentId}" already exists at ${sandboxPath}`);
        process.exit(1);
    }

    const componentName = slugToPascal(experimentId);
    const title = titleArg ?? slugToTitle(experimentId);
    const now = new Date().toISOString();

    console.log(`Creating sandbox: ${experimentId}`);
    mkdirSync(sandboxPath, { recursive: true });

    const indexTsx = `import "./styles.css";

export default function ${componentName}() {
    return (
        <div className="${experimentId}-sandbox">
            <h2>${title}</h2>
            <p>Edit <code>src/sandbox/${experimentId}/index.tsx</code> to get started.</p>
        </div>
    );
}
`;

    const stylesCss = `.${experimentId}-sandbox {
    width: 100%;
    height: 100%;
    min-height: 400px;
    padding: 1.5rem;
    font-family: system-ui, sans-serif;
}

.${experimentId}-sandbox h2 {
    margin: 0 0 0.5rem;
    font-size: 1.25rem;
}

.${experimentId}-sandbox p {
    margin: 0;
    color: #64748b;
    font-size: 0.875rem;
}

.${experimentId}-sandbox code {
    background: #f1f5f9;
    padding: 0.125rem 0.375rem;
    border-radius: 4px;
    font-size: 0.8125rem;
}
`;

    const readmeMd = `---
id: ${experimentId}-01
title: ${title}
createdAt: "${now}"
updatedAt: "${now}"
techStack:
  react: true
  css: true
---

# ${title}

Describe what this sandbox demonstrates.
`;

    writeFileSync(join(sandboxPath, "index.tsx"), indexTsx, "utf-8");
    writeFileSync(join(sandboxPath, "styles.css"), stylesCss, "utf-8");
    writeFileSync(join(sandboxPath, "README.md"), readmeMd, "utf-8");

    console.log(`  ✓ index.tsx`);
    console.log(`  ✓ styles.css`);
    console.log(`  ✓ README.md`);

    // Run sync to register in sandbox.json
    console.log("\nSyncing sandbox registry...");
    const result = spawnSync("npm", ["run", "sync:sandbox"], {
        cwd: join(__dirname, ".."),
        stdio: "inherit",
        shell: true,
    });

    if (result.status !== 0) {
        console.error("\nWarning: sync failed. Run `npm run sync:sandbox` manually.");
        process.exit(1);
    }

    console.log(`\n✅ Sandbox "${experimentId}" created. Visit /sandbox/${experimentId} to see it.`);
}

main();

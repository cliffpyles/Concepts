/**
 * Syncs public CodePen pens from https://codepen.io/cliffpyles
 * Fetches from unofficial CodePen APIs and merges new pens into the log.
 * Run with: npm run sync
 */
import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const USERNAME = "cliffpyles";

const API_ENDPOINTS = [
  `https://cpv2api.com/pens/public/${USERNAME}`,
  `https://cpv2api.herokuapp.com/pens/public/${USERNAME}`,
  `https://cpvapi.com/pens/public/${USERNAME}`,
];

interface ApiPen {
  id: string;
  title: string;
  details: string;
  link: string;
  views?: string;
  loves?: string;
  comments?: string;
  images?: { small?: string; large?: string };
  user?: { username?: string; nicename?: string; avatar?: string };
}

interface ApiResponse {
  success?: string;
  data?: ApiPen[];
}

interface PensData {
  pens: ApiPen[];
  lastSynced: string | null;
  username: string;
}

interface PenCode {
  html?: string;
  css?: string;
  js?: string;
}

interface PenWithFirstSeen extends ApiPen {
  firstSeen?: string;
  code?: PenCode;
}

function looksLikeCode(text: string): boolean {
  return (
    text.length > 0 &&
    !text.trimStart().startsWith("<!") &&
    !text.trimStart().startsWith("<html")
  );
}

async function fetchPenCode(baseUrl: string): Promise<PenCode | undefined> {
  const [html, css, js] = await Promise.all(
    [".html", ".css", ".js"].map(async (ext) => {
      try {
        const res = await fetch(`${baseUrl}${ext}`, {
          signal: AbortSignal.timeout(8000),
          headers: {
            "User-Agent":
              "Mozilla/5.0 (compatible; CodePenSync/1.0; +https://github.com)",
          },
        });
        if (!res.ok) return undefined;
        const text = (await res.text()) || "";
        return looksLikeCode(text) ? text : undefined;
      } catch {
        return undefined;
      }
    })
  );
  if (html ?? css ?? js) {
    return { html, css, js };
  }
  return undefined;
}

async function fetchFromApi(url: string): Promise<ApiPen[] | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return null;
    const json: ApiResponse = await res.json();
    if (json.success === "true" && Array.isArray(json.data)) {
      return json.data;
    }
    return null;
  } catch {
    return null;
  }
}

async function fetchPens(): Promise<ApiPen[]> {
  for (const url of API_ENDPOINTS) {
    const pens = await fetchFromApi(url);
    if (pens && pens.length > 0) {
      console.log(`Fetched ${pens.length} pens from ${url}`);
      return pens;
    }
  }
  // Fallback: merge manual pens if API fails
  const manualPath = join(__dirname, "../src/data/pens.manual.json");
  try {
    const raw = readFileSync(manualPath, "utf-8");
    const manual = JSON.parse(raw) as ApiPen[];
    if (Array.isArray(manual) && manual.length > 0) {
      console.log(`Using ${manual.length} pens from pens.manual.json (API unavailable)`);
      return manual;
    }
  } catch {
    // No manual file or invalid
  }
  throw new Error(
    "All CodePen API endpoints failed. Add pens to src/data/pens.manual.json or try again later."
  );
}

function loadExistingData(): PensData {
  const dataPath = join(__dirname, "../src/data/pens.json");
  try {
    const raw = readFileSync(dataPath, "utf-8");
    return JSON.parse(raw) as PensData;
  } catch {
    return { pens: [], lastSynced: null, username: USERNAME };
  }
}

function mergePens(existing: PenWithFirstSeen[], fetched: ApiPen[]): PenWithFirstSeen[] {
  const byId = new Map<string, PenWithFirstSeen>();
  for (const p of existing) {
    byId.set(p.id, { ...p });
  }
  const now = new Date().toISOString();
  let newCount = 0;
  for (const p of fetched) {
    const normalized = {
      ...p,
      link: p.link?.startsWith("http") ? p.link : `https://codepen.io/${USERNAME}/pen/${p.id}`,
    };
    if (!byId.has(p.id)) {
      byId.set(p.id, { ...normalized, firstSeen: now });
      newCount++;
    } else {
      const existingPen = byId.get(p.id)!;
      byId.set(p.id, { ...normalized, firstSeen: existingPen.firstSeen ?? now });
    }
  }
  if (newCount > 0) {
    console.log(`Added ${newCount} new pen(s) to the log.`);
  }
  return Array.from(byId.values()).sort((a, b) => {
    const aSeen = a.firstSeen ?? "";
    const bSeen = b.firstSeen ?? "";
    return bSeen.localeCompare(aSeen);
  });
}

async function main() {
  console.log(`Syncing pens for ${USERNAME}...`);
  const fetched = await fetchPens();
  const existing = loadExistingData();
  let merged = mergePens(existing.pens as PenWithFirstSeen[], fetched);

  // Fetch pen code from URL + .html, .css, .js
  console.log("Fetching pen source code...");
  for (let i = 0; i < merged.length; i++) {
    const pen = merged[i];
    const baseUrl = pen.link?.replace(/\/?$/, "");
    if (baseUrl) {
      const code = await fetchPenCode(baseUrl);
      if (code) {
        merged[i] = { ...pen, code };
      }
    }
  }

  const data: PensData = {
    pens: merged,
    lastSynced: new Date().toISOString(),
    username: USERNAME,
  };

  const dataPath = join(__dirname, "../src/data/pens.json");
  writeFileSync(dataPath, JSON.stringify(data, null, 2), "utf-8");
  console.log(`Wrote ${merged.length} pens to ${dataPath}`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});

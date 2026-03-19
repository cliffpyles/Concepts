/**
 * Syncs public CodePen pens via GraphQL API into the Concepts collection.
 * Requires .env with CODEPEN_USER_ID, CODEPEN_SESSION, CODEPEN_CSRF_TOKEN.
 * Run with: npm run sync
 */
import "dotenv/config";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const PENS_QUERY = `query PensPaginatedGridQuery($input: PensInput!) {
  pens(input: $input) {
    pens {
      id
      ...GridItemFields
      __typename
    }
    pageInfo {
      cursorEnd
      hasNextPage
      hasPreviousPage
      cursorStart
      __typename
    }
    __typename
  }
}

fragment GridItemFields on Item {
  access
  createdAt
  id
  ... on Pen {
    cpid
    isNewEditorPen
    __typename
  }
  token
  itemType
  private
  streamForeignId
  title
  updatedAt
  url
  counts {
    comments
    loves
    views
    __typename
  }
  owner {
    anon
    avatar80
    baseUrl
    id
    ownerType
    pro
    title
    username
    sessionUser {
      id
      followsOwner
      isBannedByOwner
      __typename
    }
    __typename
  }
  sessionUser {
    id
    loveLevel
    ownsItem
    __typename
  }
  ... on Collection {
    ...GridCollectionFields
    __typename
  }
  ... on Pen {
    ...GridPenFields
    __typename
  }
  ... on Post {
    ...GridPostFields
    __typename
  }
  ... on Project {
    ...GridProjectFields
    __typename
  }
  __typename
}

fragment GridCollectionFields on Collection {
  id
  counts { items __typename }
  urls { full __typename }
  __typename
}

fragment GridPenFields on Pen {
  id
  urls {
    details
    full
    template
    __typename
  }
  template
  previews {
    iframeUrl
    shotUrlTemplate
    showScreenshot
    __typename
  }
  __typename
}

fragment GridPostFields on Post {
  id
  previews { summary { processed { body __typename } __typename } __typename }
  __typename
}

fragment GridProjectFields on Project {
  id
  urls { details full __typename }
  previews { shotUrlTemplate __typename }
  __typename
}`;

interface Config {
  userId: string | null;
  session: string;
  csrfToken: string;
  outputPath: string;
}

function loadConfig(): Config {
  const userId = process.env.CODEPEN_USER_ID?.trim() || null;
  const session = process.env.CODEPEN_SESSION;
  const csrfToken = process.env.CODEPEN_CSRF_TOKEN;

  const missing: string[] = [];
  if (!session?.trim()) missing.push("CODEPEN_SESSION");
  if (!csrfToken?.trim()) missing.push("CODEPEN_CSRF_TOKEN");

  if (missing.length > 0) {
    console.error(
      `Missing required env vars: ${missing.join(", ")}. Copy .env.example to .env and fill in values.`
    );
    process.exit(1);
  }

  const outputPath =
    process.env.PENS_OUTPUT_PATH?.trim() ||
    join(__dirname, "../src/data/pens.json");

  return {
    userId,
    session: session!,
    csrfToken: csrfToken!,
    outputPath,
  };
}

const SESSION_USER_QUERY = `query SessionUser {
  sessionUser {
    id
    username
    anon
    currentContext {
      id
      username
      __typename
    }
    __typename
  }
}`;

async function fetchSessionUserId(config: Config): Promise<string> {
  if (config.userId) return config.userId;

  const headers = getAuthHeaders(config);
  const res = await fetch("https://codepen.io/graphql", {
    method: "POST",
    headers,
    body: JSON.stringify({
      operationName: "SessionUser",
      query: SESSION_USER_QUERY,
    }),
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) {
    throw new Error(`Session query failed: ${res.status}`);
  }

  const json = (await res.json()) as {
    data?: {
      sessionUser?: {
        anon?: boolean;
        currentContext?: { id?: string };
        id?: string;
      };
    };
    errors?: Array<{ message: string }>;
  };

  if (json.errors?.length) {
    throw new Error(
      `Session query failed: ${json.errors.map((e) => e.message).join("; ")}`
    );
  }

  if (json.data?.sessionUser?.anon) {
    throw new Error(
      "Not logged in. Copy CODEPEN_SESSION and CODEPEN_CSRF_TOKEN from browser DevTools while logged in at codepen.io."
    );
  }

  const userId =
    json.data?.sessionUser?.currentContext?.id ?? json.data?.sessionUser?.id;
  if (!userId) {
    throw new Error(
      "Could not get user ID from session. Are you logged in? Set CODEPEN_USER_ID manually if needed."
    );
  }
  return userId;
}

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

interface GqlPen {
  id: string;
  token: string;
  title: string;
  itemType: string;
  private?: boolean;
  url?: string;
  counts?: { views?: number; loves?: number; comments?: number };
  owner?: { username?: string; title?: string; baseUrl?: string; avatar80?: string };
  urls?: { full?: string };
  previews?: { shotUrlTemplate?: string };
}

interface GqlResponse {
  data?: {
    pens?: {
      pens?: GqlPen[];
      pageInfo?: {
        cursorEnd?: string | null;
        hasNextPage?: boolean;
      };
    };
  };
  errors?: Array<{ message: string }>;
}

function getAuthHeaders(config: Config): Record<string, string> {
  const cookieParts = [`cp_session=${config.session}`];
  if (process.env.CODEPEN_CF_CLEARANCE) {
    cookieParts.push(`cf_clearance=${process.env.CODEPEN_CF_CLEARANCE}`);
  }
  if (process.env.CODEPEN_CF_BM) {
    cookieParts.push(`__cf_bm=${process.env.CODEPEN_CF_BM}`);
  }
  return {
    accept: "application/graphql-response+json,application/json;q=0.9",
    "content-type": "application/json",
    cookie: cookieParts.join("; "),
    "x-csrf-token": config.csrfToken,
    origin: "https://codepen.io",
    referer: "https://codepen.io/your-work",
    "user-agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36",
  };
}

async function fetchPensGraphQL(config: Config, userId: string): Promise<ApiPen[]> {
  const headers = getAuthHeaders(config);
  const allPens: GqlPen[] = [];
  let cursor: string | null = null;

  do {
    const variables = {
      input: {
        pagination: {
          limit: 100,
          cursor,
          sortBy: "UpdatedAt",
          sortOrder: "Desc",
        },
        filters: {
          userId,
          teamId: null,
          access: "All",
        },
      },
    };

    const res = await fetch("https://codepen.io/graphql", {
      method: "POST",
      headers,
      body: JSON.stringify({
        operationName: "PensPaginatedGridQuery",
        variables,
        query: PENS_QUERY,
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      throw new Error(`GraphQL request failed: ${res.status} ${res.statusText}`);
    }

    const json: GqlResponse = await res.json();

    if (json.errors?.length) {
      throw new Error(
        `GraphQL errors: ${json.errors.map((e) => e.message).join("; ")}`
      );
    }

    const pens = json.data?.pens?.pens ?? [];
    const pageInfo = json.data?.pens?.pageInfo;

    for (const p of pens) {
      // Only include public pens (access: "All" returns everything; filter client-side)
      // itemType is "Pen" (capital P) from GraphQL
      if (p.itemType?.toLowerCase() === "pen" && p.private !== true) {
        allPens.push(p);
      }
    }

    cursor = pageInfo?.hasNextPage ? pageInfo.cursorEnd ?? null : null;
  } while (cursor);

  return allPens.map((p) => mapGqlPenToApiPen(p));
}

function mapGqlPenToApiPen(p: GqlPen): ApiPen {
  const username = p.owner?.username ?? "unknown";
  const baseUrl = p.owner?.baseUrl ?? `https://codepen.io/${username}`;
  const penSlug = p.token ?? p.id;
  let link = p.urls?.full ?? p.url ?? "";
  if (!link && penSlug) {
    link = `${baseUrl.replace(/\/$/, "")}/pen/${penSlug}`;
  }
  if (link && link.includes("/full/")) {
    link = link.replace("/full/", "/pen/");
  }

  return {
    id: penSlug ?? p.id ?? "",
    title: p.title ?? "Untitled",
    details: "",
    link,
    views: String(p.counts?.views ?? 0),
    loves: String(p.counts?.loves ?? 0),
    comments: String(p.counts?.comments ?? 0),
    images: link
      ? {
          small: link.startsWith("http") ? `${link}/image/small.png` : `https://codepen.io${link}/image/small.png`,
          large: link.startsWith("http") ? `${link}/image/large.png` : `https://codepen.io${link}/image/large.png`,
        }
      : undefined,
    user: {
      username,
      nicename: p.owner?.title,
      avatar: p.owner?.avatar80,
    },
  };
}

function looksLikeCode(text: string): boolean {
  return (
    text.length > 0 &&
    !text.trimStart().startsWith("<!") &&
    !text.trimStart().startsWith("<html")
  );
}

async function fetchPenCode(
  baseUrl: string,
  config: Config
): Promise<PenCode | undefined> {
  const headers = getAuthHeaders(config);

  const [html, css, js] = await Promise.all(
    [".html", ".css", ".js"].map(async (ext) => {
      try {
        const res = await fetch(`${baseUrl}${ext}`, {
          signal: AbortSignal.timeout(8000),
          headers,
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

function loadExistingData(outputPath: string, fallbackUsername: string): PensData {
  try {
    if (existsSync(outputPath)) {
      const raw = readFileSync(outputPath, "utf-8");
      return JSON.parse(raw) as PensData;
    }
  } catch {
    // ignore
  }
  return { pens: [], lastSynced: null, username: fallbackUsername };
}

function mergePens(
  existing: PenWithFirstSeen[],
  fetched: ApiPen[],
  username: string
): PenWithFirstSeen[] {
  const byId = new Map<string, PenWithFirstSeen>();
  for (const p of existing) {
    byId.set(p.id, { ...p });
  }
  const now = new Date().toISOString();
  let newCount = 0;
  for (const p of fetched) {
    const normalized = {
      ...p,
      link: p.link?.startsWith("http")
        ? p.link
        : `https://codepen.io/${username}/pen/${p.id}`,
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
  const config = loadConfig();
  console.log("Syncing public pens via GraphQL...");

  const userId = await fetchSessionUserId(config);
  const debug = process.env.CODEPEN_DEBUG === "1" || process.env.CODEPEN_DEBUG === "true";
  if (debug) {
    console.error(`CODEPEN_DEBUG: Using userId=${userId}`);
  }

  const fetched = await fetchPensGraphQL(config, userId);
  console.log(`Fetched ${fetched.length} public pens.`);

  if (fetched.length === 0 && !debug) {
    console.error(
      "Tip: Set CODEPEN_DEBUG=1 to see the raw API response. Ensure your session is fresh (log in at codepen.io and copy cookies)."
    );
  }

  const username = fetched[0]?.user?.username ?? "codepen";
  const existing = loadExistingData(config.outputPath, username);
  let merged = mergePens(
    existing.pens as PenWithFirstSeen[],
    fetched,
    username
  );

  console.log("Fetching pen source code...");
  for (let i = 0; i < merged.length; i++) {
    const pen = merged[i];
    const baseUrl = pen.link?.replace(/\/?$/, "");
    if (baseUrl) {
      const code = await fetchPenCode(baseUrl, config);
      if (code) {
        merged[i] = { ...pen, code };
      }
    }
  }

  const data: PensData = {
    pens: merged,
    lastSynced: new Date().toISOString(),
    username,
  };

  writeFileSync(config.outputPath, JSON.stringify(data, null, 2), "utf-8");
  console.log(`Wrote ${merged.length} pens to ${config.outputPath}`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});

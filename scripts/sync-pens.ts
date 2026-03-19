/**
 * Syncs public CodePen pens via GraphQL API.
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
  ... on Pen {
    ...GridPenFields
    __typename
  }
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
}`;

interface Config {
  userId: string;
  session: string;
  csrfToken: string;
  outputPath: string;
}

function loadConfig(): Config {
  const userId = process.env.CODEPEN_USER_ID;
  const session = process.env.CODEPEN_SESSION;
  const csrfToken = process.env.CODEPEN_CSRF_TOKEN;

  const missing: string[] = [];
  if (!userId?.trim()) missing.push("CODEPEN_USER_ID");
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
    userId: userId!,
    session: session!,
    csrfToken: csrfToken!,
    outputPath,
  };
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
  return {
    accept: "application/graphql-response+json,application/json;q=0.9",
    "content-type": "application/json",
    cookie: `cp_session=${config.session}`,
    "x-csrf-token": config.csrfToken,
    origin: "https://codepen.io",
    referer: "https://codepen.io/your-work",
    "user-agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36",
  };
}

async function fetchPensGraphQL(config: Config): Promise<ApiPen[]> {
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
          userId: config.userId,
          teamId: null,
          access: "Public",
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
      if (p.itemType === "pen" && !p.private) {
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
  const link =
    p.urls?.full ?? `${baseUrl.replace(/\/$/, "")}/pen/${p.token}`;

  return {
    id: p.token,
    title: p.title ?? "Untitled",
    details: "",
    link,
    views: String(p.counts?.views ?? 0),
    loves: String(p.counts?.loves ?? 0),
    comments: String(p.counts?.comments ?? 0),
    images: {
      small: `${link}/image/small.png`,
      large: `${link}/image/large.png`,
    },
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

  const fetched = await fetchPensGraphQL(config);
  console.log(`Fetched ${fetched.length} public pens.`);

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

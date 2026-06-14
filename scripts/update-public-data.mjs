import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const sourcesPath = path.join(rootDir, "data/sources.json");
const manualMatchesPath = path.join(rootDir, "data/manual/matches.json");
const outputPath = path.join(rootDir, "apps/web/public/data/bootstrap.json");
const imageFallbacks = [
  "/assets/football-action.jpg",
  "/assets/football-crowd.jpg",
  "/assets/village-scene.jpg"
];

const {
  activities,
  bookingEvents,
  comments,
  contents: fallbackContents,
  leagues,
  matches: fallbackMatches,
  posts,
  standings,
  teams,
  travelGuides
} = await import("../packages/shared/dist/index.js");

const sources = JSON.parse(await fs.readFile(sourcesPath, "utf8"));
const manualMatches = JSON.parse(await fs.readFile(manualMatchesPath, "utf8"));
const minimumCollectedItems = Number(process.env.MIN_COLLECTED_ITEMS ?? 3);

function stripHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, "\n")
    .replace(/&nbsp;|&#160;/g, " ")
    .replace(/&ensp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeUrl(href, baseUrl) {
  try {
    return new URL(href, baseUrl).toString();
  } catch {
    return "";
  }
}

function extractLinks(html, baseUrl) {
  const links = [];
  const linkPattern = /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  for (const match of html.matchAll(linkPattern)) {
    const url = normalizeUrl(match[1], baseUrl);
    const title = stripHtml(match[2]);
    if (!url || !title || title.length < 4) continue;
    links.push({ url, title });
  }
  return links;
}

function extractTitle(html, fallbackTitle) {
  const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1];
  const title = h1 || html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1];
  return stripHtml(title || fallbackTitle).replace(/\s+-\s+贵州村超来了$/, "");
}

function extractPublishedAt(html, url) {
  const text = stripHtml(html);
  const fromText = text.match(/20\d{2}[-年./]\d{1,2}[-月./]\d{1,2}(?:\s+\d{1,2}:\d{2}(?::\d{2})?)?/);
  if (fromText) return normalizeDate(fromText[0]);
  const fromUrl = url.match(/\/(20\d{2})(\d{2})\/t(\d{8})_/);
  if (fromUrl) return `${fromUrl[3].slice(0, 4)}-${fromUrl[3].slice(4, 6)}-${fromUrl[3].slice(6, 8)}T09:00:00+08:00`;
  return new Date().toISOString();
}

function normalizeDate(value) {
  const cleaned = value.replace(/年|[./]/g, "-").replace(/月/g, "-").replace(/日/g, "").trim();
  const [datePart, timePart = "09:00"] = cleaned.split(/\s+/);
  const [year, month, day] = datePart.split("-").map((part) => part.padStart(2, "0"));
  return `${year}-${month}-${day}T${timePart.length === 5 ? `${timePart}:00` : timePart}+08:00`;
}

function summarize(html, title) {
  const text = stripHtml(html)
    .replace(title, "")
    .replace(/中国政府网.*$/, "")
    .trim();
  const sentence = text.match(/[^。！？]{16,120}[。！？]/)?.[0];
  return sentence || title;
}

function isRelevant(link, source) {
  if (normalizeUrl(link.url, source.url) === normalizeUrl(source.url, source.url)) return false;
  if (source.excludeTitles?.some((title) => link.title === title)) return false;
  if (!source.includeKeywords?.length) return true;
  return source.includeKeywords.some((keyword) => link.title.includes(keyword));
}

function itemId(sourceId, url) {
  const slug = url
    .replace(/^https?:\/\//, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(-80);
  return `${sourceId}-${slug}`;
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 CunChaoDataBot/0.1 (+https://github.com/blake358z/cunchao)"
    }
  });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  return response.text();
}

async function collectSource(source) {
  try {
    const listHtml = await fetchText(source.url);
    const links = extractLinks(listHtml, source.url)
      .filter((link) => isRelevant(link, source))
      .filter((link, index, array) => array.findIndex((item) => item.url === link.url) === index)
      .slice(0, source.limit ?? 10);

    const items = [];
    for (const [index, link] of links.entries()) {
      try {
        const detailHtml = await fetchText(link.url);
        const title = extractTitle(detailHtml, link.title);
        items.push({
          id: itemId(source.id, link.url),
          type: source.kind === "schedule" ? "article" : "news",
          title,
          summary: summarize(detailHtml, title),
          source: source.sourceName,
          leagueId: source.leagueId,
          image: imageFallbacks[index % imageFallbacks.length],
          likes: 0,
          comments: 0,
          favorites: 0,
          publishedAt: extractPublishedAt(detailHtml, link.url),
          body: `${summarize(detailHtml, title)}\n\n来源：${source.sourceName}\n原文：${link.url}`
        });
      } catch (error) {
        console.warn(`[source:${source.id}] detail failed: ${link.url} ${error.message}`);
      }
    }
    return items;
  } catch (error) {
    console.warn(`[source:${source.id}] list failed: ${source.url} ${error.message}`);
    return [];
  }
}

function mergeById(primary, fallback) {
  const seen = new Set();
  return [...primary, ...fallback].filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

function updateLeagueHints(currentLeagues, scheduleItems) {
  return currentLeagues.map((league) => {
    const latest = scheduleItems.find((item) => item.leagueId === league.id);
    if (!latest) return league;
    return {
      ...league,
      nextHint: latest.title
    };
  });
}

const collectedGroups = await Promise.all(sources.contentSources.map(collectSource));
const collectedContents = collectedGroups.flat().sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
if (collectedContents.length < minimumCollectedItems) {
  try {
    const existing = JSON.parse(await fs.readFile(outputPath, "utf8"));
    const existingCount = existing.meta?.collectedContentCount ?? existing.data?.contents?.length ?? 0;
    if (existingCount >= minimumCollectedItems) {
      console.warn(
        `Collected only ${collectedContents.length} items; keeping existing ${outputPath} with ${existingCount} collected items.`
      );
      process.exit(0);
    }
  } catch {
    console.warn(`Collected only ${collectedContents.length} items and no existing output was found; writing fallback payload.`);
  }
}
const scheduleItems = collectedContents.filter((item) => item.type === "article");
const mergedContents = mergeById(collectedContents, fallbackContents).slice(0, 60);
const mergedMatches = mergeById(manualMatches.matches ?? [], fallbackMatches);

const payload = {
  data: {
    leagues: updateLeagueHints(leagues, scheduleItems),
    matches: mergedMatches,
    teams,
    standings,
    contents: mergedContents,
    posts,
    comments,
    travelGuides,
    bookingEvents,
    activities
  },
  source: "external",
  updatedAt: new Date().toISOString(),
  meta: {
    sourceCount: sources.contentSources.length,
    collectedContentCount: collectedContents.length,
    manualMatchCount: manualMatches.matches?.length ?? 0
  }
};

await fs.mkdir(path.dirname(outputPath), { recursive: true });
await fs.writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
console.log(`Wrote ${outputPath}`);
console.log(`Collected ${collectedContents.length} content items; merged ${mergedContents.length} total content items.`);

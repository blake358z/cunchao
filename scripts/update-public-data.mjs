import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const sourcesPath = path.join(rootDir, "data/sources.json");
const manualMatchesPath = path.join(rootDir, "data/manual/matches.json");
const outputPath = path.join(rootDir, "apps/web/public/data/bootstrap.json");
const imageOutputDir = path.join(rootDir, "apps/web/public/data/images");
const publicImageBasePath = "/data/images";
const maxBodyChars = Number(process.env.MAX_ARTICLE_BODY_CHARS ?? 1200);
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
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
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
  const articleTitle = extractMeta(html, "ArticleTitle");
  const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1];
  const title = articleTitle || h1 || html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1];
  return stripHtml(title || fallbackTitle).replace(/\s+-\s+贵州村超来了$/, "");
}

function extractPublishedAt(html, url) {
  const pubDate = extractMeta(html, "PubDate");
  if (pubDate) return normalizeDate(pubDate);
  const text = stripHtml(html);
  const fromText = text.match(/20\d{2}[-年./]\d{1,2}[-月./]\d{1,2}(?:\s+\d{1,2}:\d{2}(?::\d{2})?)?/);
  if (fromText) return normalizeDate(fromText[0]);
  const fromUrl = url.match(/\/(20\d{2})(\d{2})\/t(\d{8})_/);
  if (fromUrl) return `${fromUrl[3].slice(0, 4)}-${fromUrl[3].slice(4, 6)}-${fromUrl[3].slice(6, 8)}T09:00:00+08:00`;
  return new Date().toISOString();
}

function extractMeta(html, name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`<meta[^>]+name=["']${escaped}["'][^>]+content=["']([^"']*)["'][^>]*>`, "i");
  return stripHtml(pattern.exec(html)?.[1] ?? "");
}

function normalizeDate(value) {
  const cleaned = value.replace(/年|[./]/g, "-").replace(/月/g, "-").replace(/日/g, "").trim();
  const [datePart, timePart = "09:00"] = cleaned.split(/\s+/);
  const [year, month, day] = datePart.split("-").map((part) => part.padStart(2, "0"));
  return `${year}-${month}-${day}T${timePart.length === 5 ? `${timePart}:00` : timePart}+08:00`;
}

function summarize(paragraphs, title, html = "") {
  const description = extractMeta(html, "Description");
  if (description) return description;
  const text = (paragraphs.join(" ") || stripHtml(html))
    .replace(title, "")
    .replace(/中国政府网.*$/, "")
    .trim();
  const sentence = text.match(/[^。！？]{16,140}[。！？]/)?.[0];
  return sentence || title;
}

function extractArticleHtml(html) {
  const selectors = [
    /<div[^>]+class=["'][^"']*trs_editor_view[^"']*["'][^>]*>([\s\S]*?)<\/div>\s*(?:<\/div>|<script|$)/i,
    /<div[^>]+class=["'][^"']*DocHtmlCon[^"']*["'][^>]*>([\s\S]*?)<div[^>]+class=["'][^"']*QRcode/i,
    /<div[^>]+id=["']Zoom["'][^>]*>([\s\S]*?)<\/div>\s*(?:<script|<\/div>)/i,
    /<article[^>]*>([\s\S]*?)<\/article>/i
  ];
  for (const pattern of selectors) {
    const match = pattern.exec(html);
    if (match?.[1]) return match[1];
  }
  return html;
}

function extractParagraphs(articleHtml, title) {
  const paragraphs = [];
  const pTags = [...articleHtml.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)].map((match) => match[1]);
  const blocks = pTags.length ? pTags : articleHtml.split(/<br\s*\/?>|\n/gi);
  for (const block of blocks) {
    const text = stripHtml(block)
      .replace(/^[-\s]+贵州村超来了\s*\d*\s*/, "")
      .replace(/^扫一扫在手机打开当前页面$/, "")
      .trim();
    if (!text || text === title || text.length < 6) continue;
    if (/^(打印|关闭|分享|字体|来源：|原文：)$/.test(text)) continue;
    paragraphs.push(text);
  }

  const deduped = paragraphs.filter((paragraph, index, array) => array.indexOf(paragraph) === index);
  const selected = [];
  let total = 0;
  for (const paragraph of deduped) {
    if (total >= maxBodyChars) break;
    const remaining = maxBodyChars - total;
    const next = paragraph.length > remaining ? `${paragraph.slice(0, Math.max(0, remaining - 1))}…` : paragraph;
    selected.push(next);
    total += next.length;
  }
  return selected;
}

function extractImages(articleHtml, baseUrl) {
  const images = [];
  const imagePattern = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
  for (const match of articleHtml.matchAll(imagePattern)) {
    const url = normalizeUrl(match[1], baseUrl);
    if (!url) continue;
    if (/favicon|ewm|qrcode|footer|logo|red\.png|slhwzafw|wx|weibo|app/i.test(url)) continue;
    images.push(url);
  }
  return images.filter((url, index, array) => array.indexOf(url) === index);
}

function imageExtension(url, contentType = "") {
  const fromType = contentType.match(/image\/(jpeg|jpg|png|webp|gif)/i)?.[1];
  if (fromType) return fromType === "jpeg" ? "jpg" : fromType.toLowerCase();
  const fromUrl = new URL(url).pathname.match(/\.([a-zA-Z0-9]{3,4})$/)?.[1]?.toLowerCase();
  if (fromUrl && ["jpg", "jpeg", "png", "webp", "gif"].includes(fromUrl)) return fromUrl === "jpeg" ? "jpg" : fromUrl;
  return "jpg";
}

async function cacheImage(url, id, index) {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 CunChaoDataBot/0.1 (+https://github.com/blake358z/cunchao)"
      }
    });
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.startsWith("image/")) throw new Error(`unexpected content-type ${contentType}`);
    const ext = imageExtension(url, contentType);
    const fileName = `${id}-${index}.${ext}`.replace(/[^a-zA-Z0-9._-]/g, "-");
    await fs.mkdir(imageOutputDir, { recursive: true });
    await fs.writeFile(path.join(imageOutputDir, fileName), Buffer.from(await response.arrayBuffer()));
    return `${publicImageBasePath}/${fileName}`;
  } catch (error) {
    console.warn(`[image] failed: ${url} ${error.message}`);
    return "";
  }
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
    console.log(`[source:${source.id}] ${links.length} candidate links`);

    const items = [];
    for (const [index, link] of links.entries()) {
      try {
        const detailHtml = await fetchText(link.url);
        const title = extractTitle(detailHtml, link.title);
        const articleHtml = extractArticleHtml(detailHtml);
        const paragraphs = extractParagraphs(articleHtml, title);
        const summary = summarize(paragraphs, title, detailHtml);
        const articleImages = extractImages(articleHtml, link.url);
        const id = itemId(source.id, link.url);
        const cachedImage = articleImages[0] ? await cacheImage(articleImages[0], id, 0) : "";
        items.push({
          id,
          type: source.kind === "schedule" ? "article" : "news",
          title,
          summary,
          source: source.sourceName,
          leagueId: source.leagueId,
          image: cachedImage || imageFallbacks[index % imageFallbacks.length],
          imageCredit: cachedImage ? source.sourceName : undefined,
          likes: 0,
          comments: 0,
          favorites: 0,
          publishedAt: extractPublishedAt(detailHtml, link.url),
          originalUrl: link.url,
          body: [
            ...(paragraphs.length ? paragraphs : [summary]),
            `来源：${source.sourceName}`,
            `原文：${link.url}`
          ].join("\n\n")
        });
      } catch (error) {
        console.warn(`[source:${source.id}] detail failed: ${link.url} ${error.message}`);
      }
    }
    console.log(`[source:${source.id}] collected ${items.length} items`);
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
      const retainedPayload = {
        ...existing,
        updatedAt: new Date().toISOString(),
        meta: {
          ...existing.meta,
          lastCheckedAt: new Date().toISOString(),
          lastAttemptCollectedContentCount: collectedContents.length,
          updateStatus: "retained_existing_low_collection"
        }
      };
      await fs.writeFile(outputPath, `${JSON.stringify(retainedPayload, null, 2)}\n`, "utf8");
      console.warn(
        `Collected only ${collectedContents.length} items; retained existing ${outputPath} with ${existingCount} collected items.`
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
    manualMatchCount: manualMatches.matches?.length ?? 0,
    lastCheckedAt: new Date().toISOString(),
    lastAttemptCollectedContentCount: collectedContents.length,
    updateStatus: "updated"
  }
};

await fs.mkdir(path.dirname(outputPath), { recursive: true });
await fs.writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
console.log(`Wrote ${outputPath}`);
console.log(`Collected ${collectedContents.length} content items; merged ${mergedContents.length} total content items.`);

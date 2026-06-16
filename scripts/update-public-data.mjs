import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const sourcesPath = path.join(rootDir, "data/sources.json");
const manualMatchesPath = path.join(rootDir, "data/manual/matches.json");
const villageGuidesPath = path.join(rootDir, "data/manual/village-guides.json");
const outputPath = path.join(rootDir, "apps/web/public/data/bootstrap.json");
const imageOutputDir = path.join(rootDir, "apps/web/public/data/images");
const villageImageOutputDir = path.join(rootDir, "apps/web/public/data/village-images");
const publicImageBasePath = "/data/images";
const publicVillageImageBasePath = "/data/village-images";
const maxBodyChars = Number(process.env.MAX_ARTICLE_BODY_CHARS ?? 1200);
const matchWindowDays = Number(process.env.MATCH_WINDOW_DAYS ?? 14);
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
const villageGuideStore = JSON.parse(await fs.readFile(villageGuidesPath, "utf8"));
const minimumCollectedItems = Number(process.env.MIN_COLLECTED_ITEMS ?? 3);
let existingPayload = null;
try {
  existingPayload = JSON.parse(await fs.readFile(outputPath, "utf8"));
} catch {
  existingPayload = null;
}

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

async function cacheVillageImage(guide, index = 0) {
  const candidates = guide.imageCandidates ?? [];
  for (const [candidateIndex, candidate] of candidates.entries()) {
    try {
      const response = await fetch(candidate.url, {
        headers: {
          "User-Agent": "Mozilla/5.0 CunChaoDataBot/0.1 (+https://github.com/blake358z/cunchao)"
        }
      });
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
      const contentType = response.headers.get("content-type") ?? "";
      if (!contentType.startsWith("image/")) throw new Error(`unexpected content-type ${contentType}`);
      const ext = imageExtension(candidate.url, contentType);
      const fileName = `${guide.teamId ?? guide.village ?? `guide-${index}`}-${candidateIndex}.${ext}`.replace(/[^a-zA-Z0-9._-]/g, "-");
      await fs.mkdir(villageImageOutputDir, { recursive: true });
      await fs.writeFile(path.join(villageImageOutputDir, fileName), Buffer.from(await response.arrayBuffer()));
      return {
        image: `${publicVillageImageBasePath}/${fileName}`,
        imageCredit: candidate.sourceName,
        imageSourceUrl: candidate.sourceUrl
      };
    } catch (error) {
      console.warn(`[village-image] failed: ${guide.teamId ?? guide.village} ${candidate.url} ${error.message}`);
    }
  }
  return {
    image: guide.image,
    imageCredit: undefined,
    imageSourceUrl: undefined
  };
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

function stableId(prefix, parts) {
  return `${prefix}-${parts
    .join("-")
    .replace(/^https?:\/\//, "")
    .replace(/[^a-zA-Z0-9\u4e00-\u9fa5]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(-96)}`;
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

function mergeById(...groups) {
  const seen = new Set();
  return groups.flat().filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

function mergeContentItems(collected, existing, fallback) {
  const existingById = new Map(existing.map((item) => [item.id, item]));
  const hydrated = collected.map((item) => {
    const old = existingById.get(item.id);
    if (!old) return item;
    const next = { ...old, ...item };
    const itemUsesFallbackImage = imageFallbacks.includes(item.image);
    if (itemUsesFallbackImage && old.image) {
      next.image = old.image;
      next.imageCredit = old.imageCredit;
    }
    if ((!item.body || item.body.length < old.body?.length) && old.body) next.body = old.body;
    if (!item.summary && old.summary) next.summary = old.summary;
    return next;
  });
  return mergeById(hydrated, existing, fallback);
}

function startOfChinaToday() {
  const formatter = new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
  const parts = Object.fromEntries(formatter.formatToParts(new Date()).map((part) => [part.type, part.value]));
  return new Date(`${parts.year}-${parts.month}-${parts.day}T00:00:00+08:00`);
}

function isWithinFutureMatchWindow(match, start = startOfChinaToday()) {
  const startsAt = new Date(match.startsAt);
  const end = new Date(start.getTime() + matchWindowDays * 24 * 60 * 60 * 1000);
  return match.status === "scheduled" && startsAt >= start && startsAt < end;
}

function normalizeTeamId(name) {
  return `team-${name
    .replace(/代表队$/, "")
    .replace(/[队\s]/g, "")
    .replace(/[^a-zA-Z0-9\u4e00-\u9fa5]+/g, "-")
    .slice(0, 24)}`;
}

function parseDateParts(text) {
  const dates = [];
  const currentYear = new Intl.DateTimeFormat("zh-CN", { timeZone: "Asia/Shanghai", year: "numeric" }).format(new Date());
  const fullDatePattern = /(20\d{2})[年./-]\s*(\d{1,2})[月./-]\s*(\d{1,2})日?/g;
  for (const match of text.matchAll(fullDatePattern)) {
    dates.push({ year: match[1], month: match[2].padStart(2, "0"), day: match[3].padStart(2, "0") });
  }
  const shortDatePattern = /(?<!20\d{2}[年./-]\s*)(\d{1,2})月\s*(\d{1,2})日/g;
  for (const match of text.matchAll(shortDatePattern)) {
    dates.push({ year: currentYear, month: match[1].padStart(2, "0"), day: match[2].padStart(2, "0") });
  }
  return dates.filter((date, index, array) => array.findIndex((item) => `${item.year}-${item.month}-${item.day}` === `${date.year}-${date.month}-${date.day}`) === index);
}

function extractVenue(text) {
  const venueMatch = text.match(/(?:地点|场地|球场|主场|venue)[：:\s]*(.{2,30}?(?:球场|体育场|中心|一号场|二号场|三号场|主场|场))/i);
  if (venueMatch?.[1]) return venueMatch[1].replace(/[，。,；;].*$/, "").trim();
  const inlineVenue = text.match(/([\u4e00-\u9fa5A-Za-z0-9·]{2,24}(?:球场|体育场|中心|一号场|二号场|三号场))/);
  return inlineVenue?.[1] ?? "待公布";
}

function extractMatchesFromContent(item) {
  const text = `${item.title}\n${item.summary}\n${item.body ?? ""}`;
  const dates = parseDateParts(text);
  const matches = [];
  const pairPattern = /([\u4e00-\u9fa5A-Za-z0-9·]{2,18}(?:队|代表队)?)\s*(?:vs|VS|v|V|对阵|迎战|挑战|—|-|：|:)\s*([\u4e00-\u9fa5A-Za-z0-9·]{2,18}(?:队|代表队)?)/g;
  const pairs = [...text.matchAll(pairPattern)];
  if (!dates.length || !pairs.length) return matches;

  const times = [...text.matchAll(/(\d{1,2})[:：](\d{2})/g)].map((match) => ({
    hour: match[1].padStart(2, "0"),
    minute: match[2]
  }));

  pairs.slice(0, 12).forEach((pair, index) => {
    const date = dates[Math.min(index, dates.length - 1)];
    const time = times[index] ?? times[0] ?? { hour: "19", minute: "30" };
    const homeTeam = pair[1].trim();
    const awayTeam = pair[2].trim();
    matches.push({
      id: stableId("match-auto", [item.leagueId ?? "league", `${date.year}${date.month}${date.day}`, homeTeam, awayTeam]),
      leagueId: item.leagueId ?? "gzcunchao",
      homeTeamId: normalizeTeamId(homeTeam),
      awayTeamId: normalizeTeamId(awayTeam),
      homeTeam,
      awayTeam,
      venue: extractVenue(text),
      startsAt: `${date.year}-${date.month}-${date.day}T${time.hour}:${time.minute}:00+08:00`,
      status: "scheduled",
      source: item.source,
      originalUrl: item.originalUrl
    });
  });
  return matches;
}

function normalizeScheduledMatch(match) {
  const { score, minute, ...rest } = match;
  if (match.status !== "scheduled") return match;
  return rest;
}

function mergeMatches(primary, fallback) {
  const seen = new Set();
  return [...primary, ...fallback]
    .map(normalizeScheduledMatch)
    .filter((match) => isWithinFutureMatchWindow(match))
    .sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt))
    .filter((match) => {
      const key = `${match.leagueId}|${match.startsAt}|${match.homeTeam}|${match.awayTeam}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function fallbackVillageGuide(teamId, teamName, leagueId) {
  return {
    teamId,
    teamName,
    village: teamName.replace(/队$/, ""),
    leagueId,
    region: "待补充",
    image: "/assets/village-scene.jpg",
    summary: "该球队/村寨资料待补充，先展示比赛信息、基础路线和通用看球攻略。",
    intro: "资料库尚未收录该村寨。后续拿到官方介绍、达人攻略或合作商家资料后，可在资料库中补齐并自动复用。",
    teamIntro: "球队资料待补充，可先关注赛程、对手、地点和社区讨论。",
    players: ["核心球员待补充", "门将待补充", "后卫待补充", "前锋待补充"],
    travelTips: ["比赛日前确认开球时间和入场方式。", "优先选择官方发布的交通与停车信息。", "热门比赛建议提前到场，给安检和入场留足时间。"],
    lodgingTips: ["热门比赛日提前预订住宿。", "首次到访建议优先选择交通便利区域。", "多人同行需提前确认停车、床型和退改政策。"],
    foodTips: ["赛前选择出餐快的小吃或粉面。", "赛后再安排正餐更从容。", "地方特色口味可提前说明少辣。"],
    sourceUrls: []
  };
}

async function buildTravelGuidesForMatches(futureMatches, guideStore) {
  const guideByTeamId = new Map((guideStore.guides ?? []).map((guide) => [guide.teamId, guide]));
  const cards = [];
  const seen = new Set();

  for (const match of futureMatches) {
    const sides = [
      { teamId: match.homeTeamId, teamName: match.homeTeam, opponent: match.awayTeam },
      { teamId: match.awayTeamId, teamName: match.awayTeam, opponent: match.homeTeam }
    ];
    for (const side of sides) {
      const guide = guideByTeamId.get(side.teamId) ?? fallbackVillageGuide(side.teamId, side.teamName, match.leagueId);
      const key = `${match.id}-${side.teamId}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const cachedImage = await cacheVillageImage(guide, cards.length);
      cards.push({
        id: `guide-${key}`,
        title: `${side.teamName} · ${guide.village}看球攻略`,
        leagueId: match.leagueId,
        region: guide.region,
        image: cachedImage.image,
        imageCredit: cachedImage.imageCredit,
        imageSourceUrl: cachedImage.imageSourceUrl,
        summary: guide.summary,
        tags: ["比赛村寨", "球队故事", "吃住行"],
        matchId: match.id,
        teamId: side.teamId,
        teamName: side.teamName,
        village: guide.village,
        opponent: side.opponent,
        startsAt: match.startsAt,
        venue: match.venue,
        intro: guide.intro,
        teamIntro: guide.teamIntro,
        players: guide.players,
        travelTips: guide.travelTips,
        lodgingTips: guide.lodgingTips,
        foodTips: guide.foodTips,
        sourceUrls: guide.sourceUrls
      });
    }
  }
  return cards;
}

function formatMatchHint(match) {
  const startsAt = new Date(match.startsAt);
  const label = startsAt.toLocaleString("zh-CN", {
    timeZone: "Asia/Shanghai",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });
  return `${label} ${match.homeTeam} vs ${match.awayTeam}`;
}

function updateLeagueHints(currentLeagues, scheduleItems, futureMatches) {
  return currentLeagues.map((league) => {
    const nextMatch = futureMatches.find((match) => match.leagueId === league.id);
    const latest = scheduleItems.find((item) => item.leagueId === league.id);
    const nextHint = nextMatch ? formatMatchHint(nextMatch) : latest?.title;
    return {
      ...league,
      liveHint: undefined,
      nextHint: nextHint ?? "暂无未来两周赛程"
    };
  });
}

const collectedGroups = await Promise.all(sources.contentSources.map(collectSource));
const collectedContents = collectedGroups.flat().sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
if (collectedContents.length < minimumCollectedItems) {
  try {
    const existing = existingPayload ?? JSON.parse(await fs.readFile(outputPath, "utf8"));
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
const collectedMatches = scheduleItems.flatMap(extractMatchesFromContent);
const existingContents = existingPayload?.data?.contents ?? [];
const existingTravelGuides = existingPayload?.data?.travelGuides ?? [];
const mergedContents = mergeContentItems(collectedContents, existingContents, fallbackContents).slice(0, 60);
const mergedMatches = mergeMatches([...(manualMatches.matches ?? []), ...collectedMatches], fallbackMatches);
const matchedTravelGuides = await buildTravelGuidesForMatches(mergedMatches, villageGuideStore);

const payload = {
  data: {
    leagues: updateLeagueHints(leagues, scheduleItems, mergedMatches),
    matches: mergedMatches,
    teams,
    standings,
    contents: mergedContents,
    posts,
    comments,
    travelGuides: matchedTravelGuides.length ? matchedTravelGuides : existingTravelGuides.length ? existingTravelGuides : travelGuides,
    bookingEvents,
    activities
  },
  source: "external",
  updatedAt: new Date().toISOString(),
  meta: {
    sourceCount: sources.contentSources.length,
    collectedContentCount: collectedContents.length,
    retainedExistingContentCount: existingContents.length,
    collectedMatchCount: collectedMatches.length,
    matchCount: mergedMatches.length,
    travelGuideCount: matchedTravelGuides.length,
    matchWindowDays,
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

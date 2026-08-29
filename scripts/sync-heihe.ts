/**
 * 小黑盒内容同步脚本
 * 用法: npx tsx sync-heihe.ts [--cookie "COOKIE"] [--no-images]
 * 默认会下载图片备份到 imageBackupDir（本地路径与 URL 路径一致），不修改 markdown 内的 img url；
 * 传入 --no-images 可关闭图片备份。
 */
import { createSignedParams, getBaseApiParams } from "./heibox-signing";
import { imageUrlToLocalRelPath } from "./image-utils";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================
// Config
// ============================================================
const CONFIG_PATH = path.join(__dirname, "sync-config.json");
const config = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8"));

const OUTPUT_DIR = path.resolve(__dirname, config.outputDir || "../frontend/content");
const IMAGES_DIR = path.resolve(__dirname, config.imagesDir || "../frontend/public/content-images");
const DOC_DIR = path.resolve(__dirname, config.docDir || "../frontend/doc");
const IMAGE_BACKUP_DIR = path.resolve(__dirname, config.imageBackupDir || "../frontend/content-images");

const HEIBOX_HEADERS: Record<string, string> = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/150.0.0.0 Safari/537.36",
  Accept: "application/json, text/plain, */*",
  "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
  Referer: "https://www.xiaoheihe.cn/",
  Origin: "https://www.xiaoheihe.cn",
};

// ============================================================
// Types
// ============================================================
interface MomentItem {
  linkid: number; title?: string; description: string;
  modify_at?: number; create_at?: number;
  link_type?: number; link_tag?: number; content_type?: number;
  duration?: string;
  link?: { linkid: number; title?: string; description?: string; link_tag?: number };
  games?: Array<{ name: string; steam_appid: number; image: string }>;
  imgs?: string[];
}

interface GameReview {
  linkId: number; gameName: string; steamAppId: number;
  coverImage: string; review: string; reviewShort: string;
  date: string; score?: number;
}

interface SyncState { syncedLinkIds: number[]; lastSync: string; }

// ============================================================
// Helpers
// ============================================================
function getMomentType(m: MomentItem): "text" | "game" | "media" {
  if (m.link && m.games) return "game";
  if (m.duration || (m.content_type === 4 && !m.description && !m.title)) return "media";
  return "text";
}

function extractPlainText(raw: unknown): string {
  const str = typeof raw === "string" ? raw : "";
  if (!str) return "";
  if (str.startsWith("[")) {
    try {
      const blocks = JSON.parse(str);
      if (Array.isArray(blocks)) {
        return blocks.filter((b: { text?: string }) => b.text).map((b: { text?: string }) => b.text!).join("\n").replace(/<[^>]+>/g, "");
      }
    } catch { /* fall through */ }
  }
  return str.replace(/<[^>]+>/g, "");
}

/**
 * 将缩略图 URL 转换为原图 URL
 * 支持以下模式（等价于小黑盒原图接口 /bbs/app/api/original/image 的返回结果）：
 *   1. <hash>/thumb.<ext>?imageMogr2...            → <hash>.<ext>
 *   2. img/<hash>.<ext>/thumb?imageMogr2...        → img/<hash>.<ext>
 *   3. <hash>/thumb（无扩展名，bbs/imgs）            → <hash>
 *   4. 任意带 imageMogr2 处理参数的原图 URL          → 去掉查询参数
 *   5. bbsimg.maxjia.com 的 dailynews 图           → 换到 cdn.max-c.com（bbsimg 原图不可访问）
 * 非缩略图 URL 原样返回（避免误伤游戏封面等地址）
 */
function toOriginalImageUrl(url: string): string {
  if (!url) return url;
  // 去掉 imageMogr2 等处理查询参数
  const qIndex = url.indexOf("?");
  const hasProcessingQuery = qIndex >= 0 && url.slice(qIndex).includes("imageMogr2");
  const clean = hasProcessingQuery && qIndex >= 0 ? url.slice(0, qIndex) : url;
  let result = clean;

  // 模式1: <hash>/thumb.<ext>
  const m1 = clean.match(/^(.+)\/thumb(\.[a-zA-Z0-9]+)$/);
  if (m1) {
    result = m1[1] + m1[2];
  }
  // 模式2/3: .../<ext>/thumb 或 <hash>/thumb（无扩展名）
  else {
    const m2 = clean.match(/^(.+)\/thumb$/);
    if (m2) result = m2[1];
  }

  // 模式5: bbsimg.maxjia.com 的 dailynews 原图不可访问，换到 cdn.max-c.com
  if (result.startsWith("https://bbsimg.maxjia.com/heybox/dailynews/")) {
    result = result.replace("https://bbsimg.maxjia.com/", "https://cdn.max-c.com/");
  }

  return result;
}

/** 解析内容块 → { type, body, images[] }，images 均转换为原图 URL */
function parseContent(raw: string): { type: string; body: string; images: string[] } {
  const imgs: string[] = [];
  if (!raw?.startsWith("[")) return { type: "text", body: (raw || "").replace(/<[^>]+>/g, ""), images: imgs };
  try {
    const blocks = JSON.parse(raw);
    if (!Array.isArray(blocks)) return { type: "text", body: raw.replace(/<[^>]+>/g, ""), images: imgs };
    // 格式1: HTML 混排
    if (blocks[0]?.type === "html") {
      let h = blocks[0].text || "";
      const re = /<img\s+[^>]*data-original="([^"]*)"[^>]*\/>/gi;
      let m; while ((m = re.exec(h)) !== null) {
        const orig = toOriginalImageUrl(m[1]);
        imgs.push(orig);
      }
      h = h.replace(re, (_all, src: string) => `\n![](${toOriginalImageUrl(src)})\n`);
      h = h.replace(/<br\s*\/?>/gi, "\n").replace(/<\/p>\s*<p>/gi, "\n\n");
      h = h.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, "\"");
      return { type: "html", body: h.trim(), images: imgs };
    }
    // 格式2: 文本+图片块混排（图片单独列出，文字用空行分段）
    const texts: string[] = [];
    for (const b of blocks) {
      if (b.type === "img" && b.url && !b.url.startsWith("/storage/")) imgs.push(toOriginalImageUrl(b.url));
      else if (b.text) texts.push(b.text);
    }
    const body = texts.join("\n\n").replace(/<[^>]+>/g, "").trim();
    return { type: imgs.length > 0 ? "blocks" : "text", body, images: imgs };
  } catch { return { type: "text", body: raw.replace(/<[^>]+>/g, ""), images: imgs }; }
}

function slugify(text: string): string {
  return text.replace(/[^\w一-鿿]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
}

/** 计算某条动态对应的文章路径 */
function articleOutputPath(m: MomentItem): string {
  const category = tagToCategory(m.link_tag || 0);
  const date = new Date((m.modify_at || m.create_at || 0) * 1000).toISOString().split("T")[0];
  const slug = `${date}-${slugify(m.title || "untitled")}`;
  return path.join(OUTPUT_DIR, "articles", category, `${slug}.md`);
}

function tagToCategory(tag: number, contentType?: string): string {
  // 游戏记录（短评）= game-comment
  // 图文混排（评测帖 link_tag=11）= review
  // 图文分开（社区帖 link_tag=27）= community
  if (tag === 11) return "review";
  if (tag === 27) return "community";
  return "general";
}

function loadSyncState(): SyncState {
  const stateFile = path.join(OUTPUT_DIR, ".sync-state.json");
  try { return JSON.parse(fs.readFileSync(stateFile, "utf-8")); }
  catch { return { syncedLinkIds: [], lastSync: "" }; }
}

/** 读取文章 frontmatter 中的 linkid，用于清理因标题/日期变更而残留的旧文件 */
function readArticleLinkId(filePath: string): number | null {
  try {
    const head = fs.readFileSync(filePath, "utf-8").slice(0, 500);
    const m = head.match(/^linkid:\s*(\d+)/m);
    return m ? Number(m[1]) : null;
  } catch { return null; }
}

/** 全量模式下清理残留文章：仅清理 linkid 仍存在于动态列表、但标题/日期变更导致路径不一致的旧文件 */
function cleanupStaleArticles(moments: MomentItem[]): void {
  const momentPath = new Map<number, string>();
  for (const m of moments) {
    if (m.linkid) momentPath.set(m.linkid, path.resolve(articleOutputPath(m)));
  }
  const articlesDir = path.join(OUTPUT_DIR, "articles");
  if (!fs.existsSync(articlesDir)) return;

  const walk = (dir: string): void => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.isFile() && entry.name.endsWith(".md")) {
        const linkid = readArticleLinkId(full);
        if (linkid == null) continue; // 无 linkid 的本地文件不清理
        const expected = momentPath.get(linkid);
        if (expected && path.resolve(full) !== expected) {
          fs.unlinkSync(full);
          console.error(`    🧹 清理残留: ${path.basename(full)}`);
        }
      }
    }
  };
  walk(articlesDir);
}

function saveSyncState(state: SyncState): void {
  fs.writeFileSync(path.join(OUTPUT_DIR, ".sync-state.json"), JSON.stringify(state, null, 2));
}

async function delay(ms: number): Promise<void> { return new Promise(r => setTimeout(r, ms)); }

async function fetchWithRetry(url: string, headers: Record<string, string>, retries = 5): Promise<any> {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, { headers });
      if (res.status === 429 || res.status === 403) {
        const wait = 3000 * (i + 1);
        console.error(`    ⚠ 风控 ${res.status}, ${(wait/1000).toFixed(0)}s 后重试...`);
        await delay(wait);
        continue;
      }
      return await res.json();
    } catch (e) {
      if (i === retries - 1) throw e;
      await delay(2000 * (i + 1));
    }
  }
}

// ============================================================
// API
// ============================================================
function buildUrl(path: string, extraParams: Record<string, string>): string {
  const base = getBaseApiParams();
  const signed = createSignedParams(path);
  const merged: Record<string, string> = { ...base, hkey: signed.hkey, _time: String(signed._time), nonce: signed.nonce, ...extraParams };
  return `https://api.xiaoheihe.cn${path}?${new URLSearchParams(merged)}`;
}

async function fetchMoments(userId: string, cookie: string, syncedSet: Set<number>, force = false): Promise<MomentItem[]> {
  const allMoments: MomentItem[] = [];
  let lastval = "";
  let page = 0;

  while (true) {
    page++;
    const url = buildUrl("/bbs/app/profile/events", {
      dw: "636", lastval, list_type: "moment", userid: userId,
    });
    const headers = cookie ? { ...HEIBOX_HEADERS, Cookie: cookie } : HEIBOX_HEADERS;

    const data = await fetchWithRetry(url, headers);
    if (data.status !== "ok") {
      console.error(`  ⚠ 第 ${page} 页失败:`, data.msg);
      break;
    }

    const moments: MomentItem[] = (data.result?.moments || []).filter((m: MomentItem) => m.linkid);
    allMoments.push(...moments);

    const newCount = force ? moments.length : moments.filter(m => !syncedSet.has(m.linkid)).length;
    console.error(`  第 ${page} 页: ${moments.length} 条 (新增 ${newCount}, 累计 ${allMoments.length})`);

    // 整页都是已同步的旧数据 → 后续页也不会再有新内容，提前终止
    if (!force && moments.length > 0 && newCount === 0) {
      console.error(`  ⏹ 本页无新内容，停止分页`);
      break;
    }

    lastval = data.result?.lastval || "";
    if (!lastval || moments.length === 0) break;
    await delay(1500); // 分页间隔 1.5s，防风控
  }

  return allMoments;
}

async function fetchFullContent(linkId: number, cookie: string): Promise<{ raw: string; thumb: string } | null> {
  if (!cookie) return null;
  try {
    const base = getBaseApiParams();
    const signed = createSignedParams("/bbs/app/link/tree");
    const params = new URLSearchParams({
      ...base, hkey: signed.hkey, _time: String(signed._time), nonce: signed.nonce,
      link_id: String(linkId), is_first: "1", page: "1", index: "1", limit: "1", owner_only: "0",
    });
    const url = `https://api.xiaoheihe.cn/bbs/app/link/tree?${params.toString().replace("&link_id=", "&h_src&link_id=")}`;

    const data = await fetchWithRetry(url, { ...HEIBOX_HEADERS, Cookie: cookie });
    if (data.status !== "ok" || !data?.result?.link) {
      // 非 ok（如 show_captcha 风控拦截/验证码）或响应缺少 link 时说明原因，
      // 避免静默降级为摘要让人误以为是接口没有正文
      const reason = data.status !== "ok"
        ? `status=${JSON.stringify(data.status)}${data.msg ? `, msg=${JSON.stringify(data.msg)}` : ""}`
        : "响应缺少 result.link";
      console.error(`    ⚠ link/tree 获取失败: ${reason}（风控/验证码会拦截，稍后重试或刷新 Cookie）`);
      return null;
    }

    const link = data.result.link;
    const raw = link.text || link.description || "";
    const thumb = toOriginalImageUrl(link.thumb || "");
    return { raw, thumb };
  } catch {
    return null;
  }
}

async function downloadImage(imgUrl: string, destPath: string): Promise<boolean> {
  try {
    const res = await fetch(imgUrl);
    if (!res.ok) return false;
    const buf = Buffer.from(await res.arrayBuffer());
    fs.mkdirSync(path.dirname(destPath), { recursive: true });
    fs.writeFileSync(destPath, buf);
    return true;
  } catch { return false; }
}

// ============================================================
// Processors
// ============================================================
async function processTextMoment(
  m: MomentItem, cookie: string, downloadImages: boolean, force = false
): Promise<void> {
  const outputPath = articleOutputPath(m);
  const catDir = path.dirname(outputPath);
  fs.mkdirSync(catDir, { recursive: true });

  // 文件已存在则跳过（不重复拉取完整内容），--force 全量模式除外
  if (!force && fs.existsSync(outputPath)) {
    console.error(`    ⏭ 跳过 (已存在)`);
    return;
  }

  // Get full content
  let raw = m.description || "";
  let parsed: { type: string; body: string; images: string[] } = { type: "text", body: raw, images: [] };
  let coverImg = "";
  if (cookie) {
    const full = await fetchFullContent(m.linkid, cookie);
    if (full) {
      raw = full.raw;
      coverImg = full.thumb;
      parsed = parseContent(raw);
      console.error(`    ✅ 完整: ${parsed.body.length} 字, ${parsed.images.length} 图 [${parsed.type}]`);
    } else {
      parsed = parseContent(raw);
      console.error(`    ⚠ 使用摘要: ${parsed.body.length} 字`);
    }
    await delay(1500); // 单篇间隔 1.5s，防风控
  } else {
  }

  const cover = coverImg || (parsed.images.length > 0 ? parsed.images[0] : "");
  const coverYaml = cover ? `cover: "${cover}"` : "";
  const imagesYaml = parsed.images.length > 0
    ? `\nimages:\n${parsed.images.map(u => `  - "${u}"`).join("\n")}`
    : "";

  const date = new Date((m.modify_at || m.create_at || 0) * 1000).toISOString().split("T")[0];
  const category = tagToCategory(m.link_tag || 0);

  const frontmatter = [
    "---",
    `title: ${JSON.stringify(m.title || "Untitled")}`,
    `date: ${date}`,
    `category: ${category}`,
    `type: ${parsed.type}`,
    `linkid: ${m.linkid}`,
    `link_tag: ${m.link_tag || 0}`,
    `source: https://www.xiaoheihe.cn/app/bbs/link/${m.linkid}`,
    coverYaml,
    imagesYaml,
    "---",
    "",
  ].join("\n");

  fs.writeFileSync(outputPath, frontmatter + parsed.body, "utf-8");

  // Download images (backup only, 不修改 markdown 内的 img url)
  if (downloadImages) {
    const urls = new Set<string>();
    if (cover) urls.add(cover);
    for (const imgUrl of parsed.images) urls.add(imgUrl);
    for (const imgUrl of m.imgs || []) urls.add(toOriginalImageUrl(imgUrl));
    for (const url of urls) {
      const rel = imageUrlToLocalRelPath(url);
      if (!rel) continue;
      const ok = await downloadImage(url, path.join(IMAGE_BACKUP_DIR, rel));
      console.error(`    📷 ${ok ? '✅' : '❌'} ${rel}`);
    }
  }
}

async function processGameMoment(
  m: MomentItem, gameReviews: GameReview[], cookie: string, downloadImages: boolean
): Promise<void> {
  const game = m.games?.[0];
  if (!game) return;

  // 游戏评测：events API 的 link.description 是概述（~128字），
  // link/tree 的 link.text 是 JSON 格式完整评测，需要 parseContent 提取
  let review = "";
  let reviewDate = "";
  if (cookie) {
    const linkId = m.link?.linkid || m.linkid;
    const full = await fetchFullContent(linkId, cookie);
    if (full) {
      // full.raw 是从 link/tree 返回的原始 link.text（JSON数组字符串）
      const parsed = parseContent(full.raw);
      review = parsed.body || full.raw;
      console.error(`    ✅ 完整: ${review.length} 字`);
    }
    await delay(1500);
  }
  if (!review) {
    review = m.link?.description || "";
    console.error(`    ⚠ 使用概述: ${review.length} 字`);
  }

  // 游戏记录的日期在嵌套 link 对象中
  const timestamp = m.modify_at || m.create_at || m.link?.modify_at || m.link?.create_at || 0;
  const date = new Date(timestamp * 1000).toISOString().split("T")[0];

  // Download cover
  let coverImage = game.image || "";
  if (downloadImages && coverImage) {
    const filename = `cover-${game.steam_appid}.jpg`;
    const destPath = path.join(IMAGES_DIR, "games", filename);
    if (await downloadImage(coverImage, destPath)) {
      coverImage = `/content-images/games/${filename}`;
    }
  }

  gameReviews.push({
    linkId: m.linkid,
    gameName: game.name,
    steamAppId: game.steam_appid,
    coverImage,
    review,
    reviewShort: m.link?.description || "",
    date,
  });
}

// ============================================================
// Main
// ============================================================
async function main() {
  const args = process.argv.slice(2);
  const cookie = args.includes("--cookie") ? args[args.indexOf("--cookie") + 1] : (process.env.HEIBOX_COOKIE || "");
  const noImages = args.includes("--no-images");
  const downloadImages = !noImages;
  const gamesOnly = args.includes("--games-only");
  const force = args.includes("--force");
  // 优先 --user-id → 环境变量 → 从 cookie 提取 user_heybox_id
  let userId = args.includes("--user-id") ? args[args.indexOf("--user-id") + 1] : process.env.HEIBOX_USER_ID || "";
  if (!userId && cookie) {
    const m = cookie.match(/(?:^|;\s*)user_heybox_id=(\d+)/);
    if (m) userId = m[1];
  }

  if (!userId) {
    console.error("❌ 无法获取 userId，请通过 --user-id、HEIBOX_USER_ID 环境变量或包含 user_heybox_id 的 Cookie 提供");
    process.exit(1);
  }

  console.log("🔄 小黑盒内容同步");
  console.log(`  用户ID: ${userId}${cookie && cookie.includes(userId) ? " (从 Cookie 提取)" : ""}`);
  console.log(`  Cookie: ${cookie ? "✅ 已设置" : "⚠ 未设置（将使用摘要而非完整内容）"}`);
  console.log(`  下载图片备份: ${downloadImages ? "✅ (默认, --no-images 关闭)" : "❌"}`);
  console.log(`  全量重同步: ${force ? "✅" : "❌"}`);
  console.log(`  仅游戏: ${gamesOnly ? "✅" : "❌"}`);
  console.log(`  输出目录: ${OUTPUT_DIR}`);
  console.log("");

  // 1. Load sync state
  const state = loadSyncState();
  const syncedSet = new Set(state.syncedLinkIds);
  console.log(`📋 已同步: ${syncedSet.size} 条`);

  // 2. Fetch all moments
  console.log("\n📥 拉取动态列表...");
  const moments = await fetchMoments(userId, cookie, syncedSet, force);
  const newMoments = force ? moments : moments.filter(m => !syncedSet.has(m.linkid));
  console.log(`  总计: ${moments.length} 条, 新增: ${newMoments.length} 条\n`);

  if (newMoments.length === 0) {
    console.log("✅ 没有新内容，无需同步");
    return;
  }

  // 3. Classify and process
  const textMoments: MomentItem[] = [];
  const gameMoments: MomentItem[] = [];
  const mediaMoments: MomentItem[] = [];
  const gameReviews: GameReview[] = [];

  for (const m of newMoments) {
    const type = getMomentType(m);
    if (type === "text") textMoments.push(m);
    else if (type === "game") gameMoments.push(m);
    else mediaMoments.push(m);
  }

  console.log(`📊 分类: 📝${textMoments.length} 文本 | 🎮${gameMoments.length} 游戏 | 📹${mediaMoments.length} 媒体\n`);

  // 4. Process text moments (skip if --games-only)
  if (textMoments.length > 0 && !gamesOnly) {
    console.log("📝 处理文本动态...");
    for (let i = 0; i < textMoments.length; i++) {
      const m = textMoments[i];
      console.error(`  [${i + 1}/${textMoments.length}] ${(m.title || "无标题").slice(0, 30)}`);
      await processTextMoment(m, cookie, downloadImages, force);
    }
    console.log(`  ✅ 生成 ${textMoments.length} 篇 Markdown\n`);
  }

  // 4.5 全量模式清理标题/日期变更导致的残留文章
  if (force && textMoments.length > 0) {
    console.log("🧹 清理残留文章（标题/日期变更后的旧文件）...");
    cleanupStaleArticles(moments);
    console.log("");
  }

  // 5. Process game moments
  if (gameMoments.length > 0) {
    console.log("🎮 处理游戏记录...");
    for (let i = 0; i < gameMoments.length; i++) {
      const m = gameMoments[i];
      console.error(`  [${i + 1}/${gameMoments.length}] ${m.games?.[0]?.name || "未知游戏"}`);
      await processGameMoment(m, gameReviews, cookie, downloadImages);
    }
  }

  // 6. Merge with existing game data and write
  const gamesJsonPath = path.join(IMAGES_DIR.replace("content-images", ""), "../public/content/games/games.json");
  // Actually, save games.json to the main output location
  const gamesOutputPath = path.join(path.dirname(IMAGES_DIR), "../public/content/games/games.json");

  // Also try the path relative to frontend
  const frontendGamesPath = path.resolve(__dirname, "../frontend/public/content/games/games.json");
  fs.mkdirSync(path.dirname(frontendGamesPath), { recursive: true });

  let existingGames: GameReview[] = [];
  try {
    const raw = fs.readFileSync(frontendGamesPath, "utf-8");
    existingGames = JSON.parse(raw).games || [];
  } catch { /* no existing data */ }

  // 全量模式直接替换游戏数据，避免重复
  const allGames = force ? gameReviews : [...existingGames, ...gameReviews];
  fs.writeFileSync(frontendGamesPath, JSON.stringify({ games: allGames }, null, 2));
  console.log(`  ✅ 游戏评测: ${gameReviews.length} 条${force ? "（全量替换）" : "新增"} (总计 ${allGames.length})\n`);

  // 7. Save sync state (games-only 模式只记录游戏 ID)
  if (gamesOnly) {
    for (const m of gameMoments) syncedSet.add(m.linkid);
  } else if (force) {
    syncedSet.clear();
    for (const m of moments) syncedSet.add(m.linkid);
  } else {
    for (const m of newMoments) syncedSet.add(m.linkid);
  }
  saveSyncState({ syncedLinkIds: Array.from(syncedSet), lastSync: new Date().toISOString() });

  // 8. Summary
  console.log("═══════════════════════════════════");
  console.log("📊 同步完成");
  console.log(`  📝 文章: ${textMoments.length} 篇 → ${OUTPUT_DIR}/articles/`);
  console.log(`  🎮 游戏: ${gameReviews.length} 条 → ${frontendGamesPath}`);
  console.log(`  📹 媒体: ${mediaMoments.length} 条 (跳过)`);
  console.log(`  💾 已同步总数: ${syncedSet.size}`);
  console.log("═══════════════════════════════════");
}

main().catch(e => { console.error("❌", e); process.exit(1); });

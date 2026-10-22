/**
 * 正文图片改为「缩略图展示 + 原图进灯箱」
 *
 * 作用：
 *   1. 把正文里的 ![](原图URL) 替换成 <img src="缩略图" data-origin="原图">，
 *      文章页只加载压缩图，灯箱点开再加载原图。
 *   2. 给 frontmatter 补上 thumbs: 列表（与 images 一一对应），画廊缩略条用它。
 *
 * 只处理小黑盒 CDN（支持 imageMogr2）；其他域名的图原样保留。
 * 幂等：已有的 <img data-origin> 不会重复处理，已存在的 thumbs 不会重复插入。
 *
 * 用法: npx tsx thumbnailize-articles.ts [--dry-run]
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG_PATH = path.join(__dirname, "sync-config.json");
const config = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8"));
const OUTPUT_DIR = path.resolve(__dirname, config.outputDir || "../frontend/content");
const ARTICLES_DIR = path.join(OUTPUT_DIR, "articles");

const DRY_RUN = process.argv.includes("--dry-run");

/** 与 sync-heihe.ts 保持一致 */
function toThumbnailUrl(originalUrl: string): string {
  if (!originalUrl) return originalUrl;
  // 小黑盒历史图床有两个域名：max-c.com（现用）与 maxjia.com（老文章），
  // 老图路径常带双斜杠如 bbsimg.maxjia.com//heybox/…，先把域名后的斜杠归一化
  const normalized = originalUrl.replace(/(\.com)\/+/i, "$1/");
  if (!/^https?:\/\/(imgheybox\d*|cdn|bbsimg)\.(max-c|maxjia)\.com\//i.test(normalized)) {
    return originalUrl;
  }
  if (originalUrl.includes("imageMogr2")) return originalUrl;
  return `${originalUrl}?imageMogr2/thumbnail/1280x/format/jpg/quality/80`;
}

function walkMarkdown(dir: string): string[] {
  const out: string[] = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkMarkdown(full));
    else if (entry.isFile() && entry.name.endsWith(".md")) out.push(full);
  }
  return out;
}

function splitContent(md: string): { fm: string; body: string } {
  const m = md.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!m) return { fm: "", body: md };
  return { fm: m[1], body: md.slice(m[0].length) };
}

/**
 * 逐行解析 frontmatter 里的数组字段。
 * 不用正则 lookahead（`(?=^\S)` 在块位于末尾时会误判，导致少读一项）。
 */
function collectList(fmLines: string[], key: string): string[] {
  const out: string[] = [];
  let inBlock = false;
  for (const line of fmLines) {
    if (new RegExp(`^${key}:\\s*$`).test(line)) { inBlock = true; continue; }
    if (!inBlock) continue;
    if (/^\s*-\s+/.test(line)) {
      const mm = line.match(/^\s*-\s*["']?(.+?)["']?\s*$/);
      if (mm) out.push(mm[1]);
    } else {
      break; // 遇到下一个顶层字段
    }
  }
  return out;
}

/** 在 frontmatter 行数组里，把 thumbs 块插到 images 块之后（或替换已有 thumbs 块） */
function upsertThumbs(fmLines: string[], thumbs: string[]): string[] {
  const thumbsBlock = [`thumbs:`, ...thumbs.map((u) => `  - "${u}"`)];

  // 已存在 thumbs 块 → 整块替换
  const existingStart = fmLines.findIndex((l) => /^thumbs:\s*$/.test(l));
  if (existingStart >= 0) {
    let end = existingStart + 1;
    while (end < fmLines.length && /^\s*-\s+/.test(fmLines[end])) end++;
    return [...fmLines.slice(0, existingStart), ...thumbsBlock, ...fmLines.slice(end)];
  }

  // 否则插到 images 块之后
  const imagesStart = fmLines.findIndex((l) => /^images:\s*$/.test(l));
  if (imagesStart < 0) return fmLines;
  let end = imagesStart + 1;
  while (end < fmLines.length && /^\s*-\s+/.test(fmLines[end])) end++;
  return [...fmLines.slice(0, end), ...thumbsBlock, ...fmLines.slice(end)];
}

function main() {
  console.log("🖼  正文图片改为缩略图 + 原图灯箱");
  console.log(`  文章目录: ${ARTICLES_DIR}${DRY_RUN ? " (dry-run)" : ""}`);

  const files = walkMarkdown(ARTICLES_DIR);
  let changed = 0, skipped = 0, totalImgs = 0;

  for (const file of files) {
    const raw = fs.readFileSync(file, "utf-8");
    const { fm, body } = splitContent(raw);
    if (!fm) { skipped++; continue; }

    // --- 1. 正文：![]() → <img src=thumb data-origin=原图> ---
    let replaced = 0;
    let nextBody = body.replace(
      /!\[([^\]]*)\]\((https?:\/\/[^)\s]+)\)/g,
      (_all, alt: string, url: string) => {
        if (url.includes("imageMogr2")) return `![${alt}](${url})`; // 已是缩略图
        const thumb = toThumbnailUrl(url);
        if (thumb === url) return `![${alt}](${url})`; // 非小黑盒 CDN
        replaced++;
        const altAttr = alt ? ` alt="${alt.replace(/"/g, "&quot;")}"` : ' alt=""';
        return `<img src="${thumb}" data-origin="${url}"${altAttr} loading="lazy" decoding="async" />`;
      },
    );

    // --- 2. frontmatter：按 images 生成 thumbs ---
    const fmLines = fm.split(/\r?\n/);
    const images = collectList(fmLines, "images");
    let nextFm = fm;
    if (images.length > 0) {
      const desired = images.map((u) => toThumbnailUrl(u));
      // 全部图片都不支持压缩时（thumbs 与原图完全一致），不值得新增冗余字段
      const hasAnyCompressible = desired.some((t, i) => t !== images[i]);
      if (hasAnyCompressible) {
        const existing = collectList(fmLines, "thumbs");
        const same = existing.length === desired.length && existing.every((t, i) => t === desired[i]);
        if (!same) {
          nextFm = upsertThumbs(fmLines, desired).join("\n");
        }
      }
    }

    if (nextBody === body && nextFm === fm) { skipped++; continue; }

    console.log(`  ${DRY_RUN ? "→" : "✅"} ${path.relative(ARTICLES_DIR, file)}  (正文替换 ${replaced} 张, images ${images.length} 条)`);
    if (!DRY_RUN) {
      fs.writeFileSync(file, `---\n${nextFm}\n---\n${nextBody}`, "utf-8");
    }
    totalImgs += replaced;
    changed++;
  }

  console.log(`\n📊 完成: 处理 ${changed} 篇, 跳过 ${skipped} 篇, 共替换 ${totalImgs} 张正文图${DRY_RUN ? " (dry-run，未改动)" : ""}`);
}

main();

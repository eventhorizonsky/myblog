/**
 * Markdown 图片备份脚本
 *
 * 扫描内容目录下所有 markdown，提取其中的图片 URL（行内 ![]()、frontmatter 的 cover/images），
 * 下载到本地备份目录，本地路径与 URL 路径保持一致（host + path）。
 * 仅做备份，不会修改 markdown 中的任何内容，备份目录已在 .gitignore 中忽略。
 *
 * 用法: npx tsx backup-images.ts [--content ../frontend/content] [--out ../frontend/content-images] [--dry-run]
 *   --content   扫描的 markdown 根目录（默认取 sync-config.json 的 outputDir）
 *   --out       备份输出根目录（默认 ../frontend/content-images）
 *   --dry-run   只列出待下载的 URL，不实际下载
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { extractMarkdownImageUrls, imageUrlToLocalRelPath, downloadImage, runPool } from "./image-utils";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG_PATH = path.join(__dirname, "sync-config.json");
const config = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8"));

const args = process.argv.slice(2);
const argValue = (name: string): string | undefined => {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : undefined;
};

const CONTENT_DIR = path.resolve(__dirname, argValue("--content") || config.outputDir || "../frontend/content");
const BACKUP_DIR = path.resolve(__dirname, argValue("--out") || config.imageBackupDir || "../frontend/content-images");
const DRY_RUN = args.includes("--dry-run");
const CONCURRENCY = 8;

function walkMarkdown(dir: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkMarkdown(full));
    else if (entry.isFile() && entry.name.endsWith(".md")) out.push(full);
  }
  return out;
}

async function main() {
  console.log("🖼  图片备份");
  console.log(`  内容目录: ${CONTENT_DIR}`);
  console.log(`  备份目录: ${BACKUP_DIR}${DRY_RUN ? " (dry-run)" : ""}`);

  const files = walkMarkdown(CONTENT_DIR);
  const urlSet = new Map<string, string>(); // url -> 源 markdown
  for (const file of files) {
    const md = fs.readFileSync(file, "utf-8");
    for (const url of extractMarkdownImageUrls(md)) {
      if (!urlSet.has(url)) urlSet.set(url, path.relative(CONTENT_DIR, file));
    }
  }
  const urls = Array.from(urlSet.keys());
  console.log(`  找到 ${files.length} 个 markdown, ${urls.length} 个唯一图片 URL\n`);

  if (DRY_RUN) {
    for (const url of urls) {
      const rel = imageUrlToLocalRelPath(url);
      console.log(`  ${rel || "<跳过>"}  ← ${urlSet.get(url)}`);
    }
    return;
  }

  let ok = 0, skip = 0, fail = 0;
  const tasks = urls.map((url) => async () => {
    const rel = imageUrlToLocalRelPath(url);
    if (!rel) { fail++; console.log(`  ⏭ 跳过（无法解析）: ${url}`); return; }
    const dest = path.join(BACKUP_DIR, rel);
    if (fs.existsSync(dest)) { skip++; return; }
    const success = await downloadImage(url, dest);
    if (success) { ok++; console.log(`  ✅ ${rel}`); }
    else { fail++; console.error(`  ❌ ${url}`); }
  });
  await runPool(tasks, CONCURRENCY, (fn) => fn());

  console.log(`\n📊 完成: 新增 ${ok}, 已存在 ${skip}, 失败 ${fail}`);
}

main().catch((e) => { console.error("❌", e); process.exit(1); });

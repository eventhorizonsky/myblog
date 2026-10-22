/**
 * 按分类整理文章目录
 *
 * 把 frontend/content/articles 下的 markdown 移动到以「分类」命名的子目录，
 * 例如 articles/community/xxx.md（category: kuro）→ articles/kuro/xxx.md。
 * 只改文件位置，不改文件内容；后端递归扫描且用 linkid 作为 id，因此文章 URL 不变。
 *
 * 用法: npx tsx reorganize-by-category.ts [--dry-run]
 *   --dry-run  只打印将要发生的移动，不实际执行
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

/** 读取 frontmatter 的 category，缺省为 general */
function readCategory(file: string): string {
  try {
    const head = fs.readFileSync(file, "utf-8").slice(0, 800);
    const m = head.match(/^category:\s*(\S+)\s*$/m);
    return (m ? m[1] : "general").replace(/[<>:"/\\|?*]/g, "_");
  } catch {
    return "general";
  }
}

function main() {
  console.log("📁 按分类整理文章目录");
  console.log(`  文章根目录: ${ARTICLES_DIR}${DRY_RUN ? " (dry-run)" : ""}`);

  const files = walkMarkdown(ARTICLES_DIR);
  if (!files.length) {
    console.log("  ⚠️ 没找到 markdown 文件");
    return;
  }

  let moved = 0, kept = 0;
  const conflicts: string[] = [];
  const byCategory = new Map<string, number>();

  for (const file of files) {
    const category = readCategory(file);
    const targetDir = path.join(ARTICLES_DIR, category);
    const target = path.join(targetDir, path.basename(file));
    byCategory.set(category, (byCategory.get(category) || 0) + 1);

    if (path.resolve(file) === path.resolve(target)) { kept++; continue; }

    // 目标已存在则拒绝覆盖（不丢内容）
    if (fs.existsSync(target)) {
      conflicts.push(`${path.relative(ARTICLES_DIR, file)} → ${category}/（目标已存在，跳过）`);
      continue;
    }

    console.log(`  ${DRY_RUN ? "→" : "✅"} ${path.relative(ARTICLES_DIR, file)} → ${category}/`);
    if (!DRY_RUN) {
      fs.mkdirSync(targetDir, { recursive: true });
      fs.renameSync(file, target);
    }
    moved++;
  }

  console.log("\n  分类分布:");
  for (const [cat, n] of [...byCategory.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`    ${cat.padEnd(14)} ${n}`);
  }

  if (conflicts.length) {
    console.log("\n  ⚠️ 冲突（未覆盖）:");
    for (const c of conflicts) console.log(`    ${c}`);
  }

  // 清理空目录（只删 articles 下一级的空目录）
  if (!DRY_RUN) {
    for (const entry of fs.readdirSync(ARTICLES_DIR, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const dir = path.join(ARTICLES_DIR, entry.name);
      if (fs.readdirSync(dir).length === 0) {
        fs.rmdirSync(dir);
        console.log(`  🧹 删除空目录: ${entry.name}/`);
      }
    }
  }

  console.log(`\n📊 完成: 移动 ${moved}, 已在正确位置 ${kept}${conflicts.length ? `, 冲突 ${conflicts.length}` : ""}${DRY_RUN ? " (dry-run，未改动文件)" : ""}`);
}

main();

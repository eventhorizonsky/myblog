import MarkdownIt from "markdown-it";
import type { ArticleMeta } from "@/types";

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  breaks: true,
});

/** 加载表情映射 [cube_喜欢] → img URL */
let emojiMap: Record<string, { img: string; code: string }> = {};
async function loadEmojis() {
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}content/emojis.json`);
    if (res.ok) emojiMap = await res.json();
  } catch { /* emoji data not available */ }
}
loadEmojis();

/** 将 [cube_xxx] 格式的表情码替换为 <img> */
function replaceEmojis(html: string): string {
  return html.replace(/\[([a-z]+)_([^\]]+)\]/g, (match, group, code) => {
    const key = `[${group}_${code}]`;
    const emoji = emojiMap[key];
    if (emoji) {
      return `<img src="${emoji.img}" alt="${emoji.code}" class="emoji-inline" loading="lazy" />`;
    }
    return match; // 不认识的表情码保持原样
  });
}

/** 导入所有 articles 目录下的 .md 文件 */
const articleFiles = import.meta.glob<string>("../../content/articles/**/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
});

const docFiles = import.meta.glob<string>("../../doc/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
});

/** 解析 single .md raw string → meta + html */
export function parseArticle(rawMd: string): { meta: ArticleMeta; html: string } {
  // Simple frontmatter parser (avoid gray-matter ESM issues in Vite)
  const fmMatch = rawMd.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  let meta: ArticleMeta = { id: "", title: "Untitled", date: "", category: "general", excerpt: "" };
  let content = rawMd;

  if (fmMatch) {
    const fmText = fmMatch[1];
    content = fmMatch[2];

    // Parse YAML-like frontmatter
    const rawMeta: Record<string, unknown> = {};
    let arrayKey = "";
    let arrayValues: string[] = [];
    for (const line of fmText.split("\n")) {
      const arrMatch = line.match(/^\s+-\s+(.*)$/);
      if (arrMatch && arrayKey) {
        let v = arrMatch[1].trim();
        if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
        arrayValues.push(v);
        continue;
      }
      if (arrayKey && arrayValues.length > 0) { rawMeta[arrayKey] = arrayValues; arrayValues = []; arrayKey = ""; }
      const ci = line.indexOf(":");
      if (ci > 0) {
        const k = line.slice(0, ci).trim();
        let v = line.slice(ci + 1).trim();
        if (!v) { arrayKey = k; }
        else {
          if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
          rawMeta[k] = v;
        }
      }
    }
    if (arrayKey && arrayValues.length > 0) rawMeta[arrayKey] = arrayValues;
    Object.assign(meta, rawMeta);
  }

  const html = replaceEmojis(md.render(content));
  const titleHtml = replaceEmojis(meta.title);
  const excerpt = content.replace(/[#*`>\[\]()!\-\n\r]/g, "").slice(0, 120).trim();

  return { meta: { ...meta, title: titleHtml, excerpt }, html };
}

/** 从所有 .md 文件构建文章列表 */
export function loadAllArticles(): (ArticleMeta & { html: string; path: string })[] {
  const results: (ArticleMeta & { html: string; path: string })[] = [];

  for (const [filePath, raw] of Object.entries({ ...articleFiles, ...docFiles })) {
    try {
      const { meta, html } = parseArticle(raw);
      let id = filePath.replace("/doc/", "").replace("/content/articles/", "").replace(".md", "");
      // Remove category prefix if present
      const parts = id.split("/");
      id = parts[parts.length - 1];
      results.push({ ...meta, id: meta.id || id, html, path: filePath });
    } catch {
      // Skip invalid files
    }
  }

  return results.sort((a, b) => b.date.localeCompare(a.date));
}

/** 获取分类列表 */
export function getCategories(articles: ArticleMeta[]): string[] {
  const cats = new Set(articles.map((a) => a.category));
  return ["all", ...Array.from(cats).filter(Boolean)];
}

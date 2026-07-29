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
export function replaceEmojis(text: string): string {
  return text.replace(/\[([a-z]+)_([^\]]+)\]/g, (match, group, code) => {
    const key = `[${group}_${code}]`;
    const emoji = emojiMap[key];
    if (emoji) {
      return `<img src="${emoji.img}" alt="${emoji.code}" class="emoji-inline" loading="lazy" />`;
    }
    return match;
  });
}

/** 渲染 Markdown → HTML（含表情替换） */
export function renderMarkdown(content: string): string {
  return replaceEmojis(md.render(content));
}

// ====== API 数据获取（替代 import.meta.glob） ======

/** 获取所有文章元数据列表 */
export async function fetchArticles(): Promise<ArticleMeta[]> {
  const res = await fetch("/api/articles");
  if (!res.ok) throw new Error(`Failed to fetch articles: ${res.status}`);
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

/** 获取单篇文章详情（元数据 + 原始 Markdown） */
export async function fetchArticle(id: string): Promise<{ meta: ArticleMeta; content: string }> {
  const res = await fetch(`/api/articles/${id}`);
  if (!res.ok) throw new Error(`Article not found: ${id}`);
  const data = await res.json();
  return { meta: data, content: data.content };
}

/** 搜索文章（返回匹配的元数据列表） */
export async function searchArticles(q: string): Promise<ArticleMeta[]> {
  const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
  if (!res.ok) throw new Error(`Search failed: ${res.status}`);
  return res.json();
}

/** 获取分类列表 */
export function getCategories(articles: ArticleMeta[]): string[] {
  const cats = new Set(articles.map((a) => a.category));
  return ["all", ...Array.from(cats).filter(Boolean)];
}

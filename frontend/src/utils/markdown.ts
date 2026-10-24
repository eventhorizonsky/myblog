import MarkdownIt from "markdown-it";
import hljs from "highlight.js/lib/common";
import "highlight.js/styles/github-dark.css";
import type { ArticleMeta } from "@/types";

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  breaks: true,
});

// 这些语言按纯文本输出，不参与自动识别，
// 否则 URL、配置片段之类会被识别成奇怪的语法并错误着色。
const PLAIN_LANGS = new Set(["text", "plain", "plaintext", "txt", "output", "log"]);

/**
 * 自定义 fence（``` 代码块）渲染。
 *
 * 两个目的：
 * 1. 用 highlight.js 做语法高亮 —— 原文里有大量 bash / C / Java 片段，
 *    单色文字读起来很吃力。
 * 2. markdown-it 默认只输出 <code class="language-xxx">，不带 .hljs 类，
 *    而 highlight.js 主题（背景色 + 着色）是靠 .hljs 生效的，
 *    所以这里显式补上，代码块才有正确的深色底和语法配色。
 */
md.renderer.rules.fence = (tokens, idx) => {
  const token = tokens[idx];
  const info = token.info ? md.utils.unescapeAll(token.info).trim() : "";
  const langName = info.split(/\s+/)[0] || "";
  const lower = langName.toLowerCase();

  let code: string;
  if (PLAIN_LANGS.has(lower) || !token.content.trim()) {
    code = md.utils.escapeHtml(token.content);
  } else if (langName && hljs.getLanguage(langName)) {
    code = hljs.highlight(token.content, { language: langName, ignoreIllegals: true }).value;
  } else {
    // 未标语言时让 hljs 猜，猜不准也只是着色偏差，不影响可读性
    code = hljs.highlightAuto(token.content).value;
  }

  const langCls = langName ? ` language-${md.utils.escapeHtml(langName)}` : "";
  return `<pre class="hljs-pre"><code class="hljs${langCls}">${code}</code></pre>\n`;
};

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

/**
 * 把文章里使用的相对资源路径（如 `halo-images/2021/04/a.png`）解析成可访问的绝对路径。
 * 文章里不写死域名/base，换部署路径（如 GitHub Pages 的 /myblog/）也不失效；
 * 但详情页路由是 /articles/:id，相对路径会被解析成 /articles/halo-images/... 而 404，
 * 所以统一加 BASE_URL 前缀。
 */
export function resolveAssetUrl(src: string): string {
  if (!src) return src;
  // 已经是绝对路径 / 协议地址 / data URI，原样返回
  if (/^(https?:)?\/\/|^\/|^data:|^blob:/i.test(src)) return src;
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  return `${base}/${src}`;
}

/** 批量修正 HTML 里 <img src> 的相对路径 */
export function resolveContentImages(html: string): string {
  return html.replace(
    /(<img\b[^>]*?\ssrc=")(?!https?:\/\/|\/\/|\/|data:|blob:)([^"]*)"/gi,
    (_m, pre: string, src: string) => `${pre}${resolveAssetUrl(src)}"`,
  );
}

/** 渲染 Markdown → HTML（含表情替换与图片路径修正） */
export function renderMarkdown(content: string): string {
  return resolveContentImages(replaceEmojis(md.render(content)));
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

/**
 * 图片工具函数（markdown 图片 URL 提取 / URL 路径镜像 / 下载 / 并发池）
 */
import * as fs from "node:fs";
import * as path from "node:path";

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/150.0.0.0 Safari/537.36";

/** 提取 markdown 中的图片 URL：行内 ![](...)、frontmatter 的 cover / images */
export function extractMarkdownImageUrls(markdown: string): string[] {
  const urls = new Set<string>();
  const add = (u: string) => { if (/^https?:\/\//i.test(u)) urls.add(u); };

  // frontmatter 区域（首个 --- 到第二个 ---）
  const fm = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  const block = fm ? fm[1] : "";
  // cover: "url"
  const coverM = block.match(/^cover:\s*["']?(https?:\/\/[^"'\s]+)/m);
  if (coverM) add(coverM[1]);
  // images: 列表
  const listRe = /^\s*-\s*["']?(https?:\/\/[^"'\s]+)/gm;
  let m: RegExpExecArray | null;
  while ((m = listRe.exec(block)) !== null) add(m[1]);

  // 行内图片
  const inlineRe = /!\[[^\]]*\]\((https?:\/\/[^)\s]+)\)/g;
  while ((m = inlineRe.exec(markdown)) !== null) add(m[1]);

  return Array.from(urls);
}

/**
 * 将图片 URL 映射为本地相对路径（host + path），保持与 URL 路径一致。
 * 如 https://cdn.max-c.com/heybox/img/a.png → cdn.max-c.com/heybox/img/a.png
 */
export function imageUrlToLocalRelPath(url: string): string {
  let u: URL;
  try { u = new URL(url); } catch { return ""; }
  if (u.protocol !== "http:" && u.protocol !== "https:") return "";
  const rawPath = u.pathname.replace(/^\/+/, "");
  const segs = rawPath.split("/").filter(Boolean).map((seg) => {
    try { seg = decodeURIComponent(seg); } catch { /* keep as-is */ }
    return seg.replace(/[<>:"/\\|?*\x00-\x1f]/g, "_").replace(/[. ]+$/g, "");
  });
  if (!segs.length) return "";
  return [u.hostname, ...segs].join("/");
}

/** 下载图片到目标路径（默认跳过已存在），成功返回 true */
export async function downloadImage(url: string, destPath: string, skipIfExists = true): Promise<boolean> {
  if (skipIfExists && fs.existsSync(destPath)) return true;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA, Referer: new URL(url).origin },
      redirect: "follow",
    });
    if (!res.ok) return false;
    const buf = Buffer.from(await res.arrayBuffer());
    fs.mkdirSync(path.dirname(destPath), { recursive: true });
    fs.writeFileSync(destPath, buf);
    return true;
  } catch { return false; }
}

/** 并发池：以 limit 并发执行 fn */
export async function runPool<T>(items: T[], limit: number, fn: (item: T) => Promise<void>): Promise<void> {
  const queue = [...items];
  const workers = Array.from({ length: Math.min(limit, queue.length) }, async () => {
    while (queue.length) {
      const item = queue.shift()!;
      await fn(item);
    }
  });
  await Promise.all(workers);
}

/**
 * 列表页 ↔ 文章页 之间的状态记忆。
 *
 * 两件事：
 * 1. 按路由记录滚动位置（列表页 → 文章页 → 返回列表时恢复）
 * 2. 记住「最后一次访问的列表页地址」，让文章页的「返回列表」能带回筛选条件，
 *    而不是硬编码 '/'articles' 把 category/freshness 丢掉。
 */
const positions = new Map<string, number>();

/** 最后一次访问的文章列表页完整地址（含筛选 query） */
let lastListPath = "";

export function saveScroll(fullPath: string, y: number = window.scrollY) {
  positions.set(fullPath, y);
}

export function getScroll(fullPath: string): number | undefined {
  return positions.get(fullPath);
}

export function clearScroll(fullPath: string) {
  positions.delete(fullPath);
}

export function rememberListPath(fullPath: string) {
  // 列表页根路径至少要是 /articles，避免空串
  if (fullPath.startsWith("/articles") && !fullPath.startsWith("/articles/")) {
    lastListPath = fullPath;
  }
}

export function getListPath(): string {
  return lastListPath || "/articles";
}

/** 判断当前地址是否就是文章列表页（而非详情页） */
export function isListPath(path: string): boolean {
  return path === "/articles" || (path.startsWith("/articles") && !path.startsWith("/articles/"));
}

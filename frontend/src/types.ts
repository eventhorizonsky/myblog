export interface ArticleMeta {
  id: string;
  title: string;
  date: string;
  category: string;
  excerpt: string;
  type?: string;        // "html" | "blocks" | "text"
  cover?: string;       // 封面图（images 第一项）
  images?: string[];    // 画廊图片 URL 列表
  linkid?: number;
  link_tag?: number;
  source?: string;
}

export interface GameReview {
  linkId: number;
  gameName: string;
  steamAppId: number;
  coverImage: string;
  review: string;
  date: string;
  score?: number;
}

export interface BangumiSubjectImage {
  small: string;
  grid: string;
  large: string;
  medium: string;
  common: string;
}

export interface BangumiTag {
  name: string;
  count: number;
  total_count: number;
}

export interface BangumiSubject {
  date: string;
  images: BangumiSubjectImage;
  name: string;
  name_cn: string;
  short_summary: string;
  tags: BangumiTag[];
  score: number;
  type: number;
  id: number;
  eps: number;
  volumes: number;
  collection_total: number;
  rank: number;
}

export interface AnimeCollection {
  updated_at: string;
  comment: string | null;
  tags: string[];
  subject: BangumiSubject;
  subject_id: number;
  vol_status: number;
  ep_status: number;
  subject_type: number;
  type: number;
  rate: number;
  private: boolean;
}

export interface GitHubRepo {
  name: string;
  description: string;
  url: string;
  language: string;
  language_color: string;
  stars: number;
  forks: number;
  homepage_url: string;
  og_image: string;
}

export const CATEGORY_CONFIG: Record<string, { label: string; color: string }> = {
  all: { label: "全部", color: "" },
  community: { label: "社区", color: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-500/15 dark:text-purple-300 dark:border-purple-500/30" },
  "game-comment": { label: "游戏短评", color: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-500/30" },
  "no-tech": { label: "没有技术的技术贴", color: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-500/15 dark:text-sky-300 dark:border-sky-500/30" },
  galgame: { label: "旮旯批的丑态", color: "bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-500/15 dark:text-pink-300 dark:border-pink-500/30" },
  "zhou-pi": { label: "粥批の饭盒", color: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/15 dark:text-orange-300 dark:border-orange-500/30" },
  kuro: { label: "酷狗の真情流露", color: "bg-red-50 text-red-700 border-red-200 dark:bg-red-500/15 dark:text-red-300 dark:border-red-500/30" },
  "light-novel": { label: "轻小说推荐", color: "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-500/15 dark:text-teal-300 dark:border-teal-500/30" },
  manga: { label: "漫画推荐", color: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-500/15 dark:text-indigo-300 dark:border-indigo-500/30" },
};

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
  review: { label: "图文评测", color: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30" },
  community: { label: "社区", color: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-500/15 dark:text-purple-300 dark:border-purple-500/30" },
  "game-comment": { label: "游戏短评", color: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-500/30" },
  general: { label: "日常", color: "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-500/15 dark:text-gray-300 dark:border-gray-500/30" },
};

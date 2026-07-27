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

export const CATEGORY_CONFIG: Record<string, { label: string; color: string }> = {
  all: { label: "全部", color: "" },
  review: { label: "图文评测", color: "bg-amber-50 text-amber-700 border-amber-200" },
  community: { label: "社区", color: "bg-purple-50 text-purple-700 border-purple-200" },
  "game-comment": { label: "游戏短评", color: "bg-blue-50 text-blue-700 border-blue-200" },
  general: { label: "日常", color: "bg-gray-50 text-gray-700 border-gray-200" },
};

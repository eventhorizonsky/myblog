# EventHorizon Blog

个人博客，整合小黑盒动态、游戏评测、技术分享。

## 技术栈

Vue 3 + Vite + Tailwind CSS + Markdown

## 目录结构

```
├── frontend/          # 前端项目
│   ├── src/
│   │   ├── pages/     # 页面组件
│   │   ├── components/# 通用组件
│   │   └── utils/     # Markdown 渲染、表情解析
│   ├── content/       # 同步产出（gitignore）
│   │   ├── articles/  # Markdown 文章
│   │   └── games/     # 游戏评测 JSON
│   ├── doc/           # 本地文章（git track）
│   └── public/content/# 静态数据（emojis.json、games.json）
├── scripts/           # 同步工具
│   ├── sync-heihe.ts  # 小黑盒内容同步
│   ├── fetch-emojis.ts# 表情列表拉取
│   └── heibox-signing.ts # 小黑盒 API 签名算法
└── .github/workflows/ # CI/CD
```

## 快速开始

```bash
# 安装依赖
cd frontend && npm install

# 启动开发服务器
npm run dev          # → http://localhost:5173

# 构建
npm run build        # → dist/
```

## 内容同步

### 小黑盒动态

```bash
cd scripts
npm install

# 完整同步（文章 + 游戏评测）
npx tsx sync-heihe.ts --cookie "你的Cookie"

# 仅游戏评测
npx tsx sync-heihe.ts --games-only --cookie "你的Cookie"

# 下载图片
npx tsx sync-heihe.ts --cookie "xxx" --download-images
```

Cookie 从浏览器 DevTools → Application → Cookies → `xiaoheihe.cn` 复制全部。

### 表情列表

```bash
cd scripts
npx tsx fetch-emojis.ts
# → frontend/public/content/emojis.json
```

## 内容格式

### 文章（Markdown + Frontmatter）

```markdown
---
title: "文章标题"
date: 2026-07-21
category: review
type: html
cover: "https://..."
images:
  - "https://..."
  - "https://..."
---
正文内容，支持 Markdown 语法。

图片会在图文混排模式（type: html）中嵌入段落间，
图文分开模式（type: blocks）会显示顶部画廊。
```

### 分类

| 分类 | 说明 |
|------|------|
| `review` | 图文评测 |
| `community` | 社区帖子 |
| `general` | 日常 |

### 游戏评测（games.json）

```json
{
  "games": [{
    "linkId": 184648002,
    "gameName": "007 初露锋芒",
    "steamAppId": 3768760,
    "coverImage": "https://...",
    "review": "评测正文...",
    "date": "2026-06-29"
  }]
}
```

## 部署

### GitHub Pages

推送 `main` 分支自动部署。需要在仓库 Settings → Pages 选择 "GitHub Actions"。

### Docker

```bash
docker build -t myblog .
docker run -p 80:80 myblog
```

推送 tag 自动构建镜像到 `ghcr.io/<用户名>/<仓库>`。

## 本地文章

在 `frontend/doc/` 目录下创建 `.md` 文件即可，格式同上。`content/articles/` 为同步脚本产出，建议 gitignore。

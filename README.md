# EventHorizon Blog

个人博客，整合小黑盒动态、游戏评测、技术分享。

## 技术栈

Vue 3 + Vite + Tailwind CSS + Markdown + Go

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
    "linkId": 111111,
    "gameName": "007 初露锋芒",
    "steamAppId": 3768760,
    "coverImage": "https://...",
    "review": "评测正文...",
    "date": "2026-06-29"
  }]
}
```

## 环境变量

### 后端

| 变量 | 必需 | 默认值 | 说明 |
|------|------|--------|------|
| `HEIBOX_USER_ID` | ✅ | — | 小黑盒用户 ID，用于游戏战绩接口 |
| `HEIBOX_OS_VERSION` | ❌ | `12` | 小黑盒 API 的 os_version 参数 |
| `BANGUMI_API_URL` | ❌ | `https://api.bgm.tv` | Bangumi 镜像 API 地址 |
| `BANGUMI_USERNAME` | ✅ | — | Bangumi 用户名，用于拉取追番收藏 |
| `SITE_TITLE` | ❌ | `EventHorizon Blog` | 博客名称，显示在左上角和首页 |
| `SITE_DESCRIPTION` | ❌ | — | 首页副标题文案（如 `游戏评测 · 技术分享 · 动漫追番`），未设置时显示默认值 |
| `ICP_BEIAN` | ❌ | — | ICP 备案号，显示在页面底部 |
| `PORT` | ❌ | `8080` | 后端监听端口 |
| `DIST_DIR` | ❌ | `../frontend/dist` | 前端构建产物目录 |
| `GITHUB_USERNAME` | ✅ | — | GitHub 用户名，用于展示置顶项目 |
| `GITHUB_TOKEN` | ❌ | — | GitHub Personal Access Token，提升 API 限额至 5000/h（未认证仅 60/h） |

### 同步脚本

| 变量 | 必需 | 说明 |
|------|------|------|
| `HEIBOX_COOKIE` | 同步 | PC Web Cookie（`--cookie` 参数传入），拉取完整文章内容 |
| `HEIBOX_USER_ID` | 可选 | 小黑盒用户 ID（可从 Cookie 中 `user_heybox_id` 字段自动提取） |

### 已废弃

| 变量 | 说明 |
|------|------|
| `HEIBOX_MOBILE_COOKIE` | 不再需要，已切换至免 Cookie 的 `heybox_home_v2` 接口 |

### 本地开发

```bash
# Go 后端
cd backend
export HEIBOX_USER_ID=111111
export BANGUMI_USERNAME=ezsky
export BANGUMI_API_URL=https://api.bgm.tv
export SITE_TITLE="EventHorizon"
export ICP_BEIAN="ICP备XXXXXXXX号-1"  # 可选
go run .

# 前端（dev 模式自动代理 /api → localhost:8080）
cd frontend
npm run dev
```

### 后端 API

| 端点 | 说明 |
|------|------|
| `GET /api/game-stats` | 游戏战绩 + Steam 信息 + 硬件配置（24h 缓存） |
| `GET /api/anime-collections` | Bangumi 追番收藏，支持 `?type=&limit=&offset=` 分页筛选 |
| `GET /api/site-config` | 站点配置（标题、备案号） |
| `GET /api/health` | 健康检查 |
| `GET /api/github-projects` | GitHub 置顶仓库（24h 缓存，需 `GITHUB_USERNAME` 环境变量） |

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

 npx tsx sync-heihe.ts --cookie 'cookie' --user-id 18962761

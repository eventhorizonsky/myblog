---
name: myblog-heibox-sync
description: "更新 EventHorizon 博客的小黑盒内容：运行 scripts/sync-heihe.ts 同步动态与正文、缓存图片、按社区自动归类、提交推送到 GitHub 触发部署。用户在这个仓库里贴出新 Cookie 要求更新博客时加载。"
whenToUse: "用户在本仓库（D:\\MyProject\\myblog）提供小黑盒 Cookie 或要求「更新博客 / 同步动态 / 拉取新文章」时。"
---

# 更新小黑盒博客内容

这个仓库按固定流程更新博客，**照本文操作即可，不需要重新摸索仓库结构**。
所有命令都在 `D:\MyProject\myblog` 下执行。

## 一、先校验 Cookie（不要跳过）

新 Cookie 可能已过期或被风控，直接跑同步会把**摘要**当成正文写进文章，事后很难发现。
先用临时脚本探测一次，确认 `status=ok` 再进入下一步。

```powershell
cd D:\MyProject\myblog\scripts
# 把用户给的整条 Cookie 原样存进环境变量，避免命令行转义问题
$env:TEST_COOKIE = '<粘贴完整 Cookie>'
```

**Cookie 必须是「完整登录态」**：除了用户平时给的字段，建议包含 `user_pkey` 和 `user_heybox_id`
（从浏览器 www.xiaoheihe.cn 的请求头里复制那段最完整的 `-b` 内容）。
少了这两个字段时接口通常仍返回 `ok`，但**列表窗口会变窄**，最新文章可能被切掉——静默漏同步，很难发现。
Cookie 里的 `pkey` / `user_pkey` 值是一样的，只是键名不同。

新建 `scripts/_probe.ts`，内容如下，用 `npx tsx _probe.ts` 运行：

```ts
import { createSignedParams, getBaseApiParams } from "./heibox-signing.ts";
const cookie = process.env.TEST_COOKIE || "";
const base = getBaseApiParams();
const s = createSignedParams("/bbs/app/profile/events");
const p = new URLSearchParams({ ...base, hkey: s.hkey, _time: String(s._time), nonce: s.nonce, dw: "808", lastval: "", list_type: "moment", userid: "18962761" });
const r = await fetch("https://api.xiaoheihe.cn/bbs/app/profile/events?" + p, { headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36", Accept: "application/json, text/plain, */*", "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8", Referer: "https://xiaoheihe.cn/", Origin: "https://xiaoheihe.cn", Cookie: cookie } });
const j = await r.json();
console.log("status=", j.status, "msg=", JSON.stringify(j.msg || ""), "count=", j.result?.moments?.length);
for (const x of (j.result?.moments || []).slice(0, 6)) {
  console.log(x.linkid, "| tag=", x.link_tag, "|", new Date(((x.modify_at || x.create_at) || 0) * 1000).toISOString().slice(0, 10), "|", String(x.title || "").slice(0, 24), "|", (x.topics || []).map(t => t.name).join("/"));
}
```

判断标准：

| 探测结果 | 含义 | 处理 |
|---|---|---|
| `status=ok` 且有 moments | Cookie 有效 | 继续 |
| `status="show_captcha"` | 触发风控/验证码 | 停手，告知用户换 Cookie 或等冷却 |
| 空 moments / 报错 | Cookie 失效 | 停手，让用户重新提供 |

**跑完立即删除 `scripts/_probe.ts`。**

## 二、执行同步

```powershell
cd D:\MyProject\myblog\scripts
$cookie = '<完整 Cookie>'
npx tsx sync-heihe.ts --cookie $cookie --user-id 18962761 2>&1
```

要点：

- **默认就会缓存图片**（下载到 `frontend/content-images/`，该目录 gitignore）。除非用户明确说不要图，否则不要加 `--no-images`。
- 用户 ID 固定为 `18962761`，也可由 Cookie 里的 `heybox_id` 得到。
- 输出里每篇的 `✅ 完整: N 字, M 图` 表示拿到了正文；`⚠ 使用摘要` 表示被风控拦了，需要重试。
- 图片行全部 `✅` 才算缓存成功；出现 `❌` 要重跑该篇或检查链接。
- 脚本按 `.sync-state.json` 去重，只处理新内容。**不要用 `--force`**，它会重拉全部历史文章（慢，且易触发风控）。

## 三、核对结果

```powershell
# 新产生的文章（最近一小时内）
cd D:\MyProject\myblog
Get-ChildItem frontend\content\articles -Recurse -File -Filter *.md |
  Where-Object { $_.LastWriteTime -gt (Get-Date).AddHours(-1) } |
  Select-Object LastWriteTime, FullName, Length

# 图片缓存总量
$d='frontend\content-images'
"files: $((Get-ChildItem $d -Recurse -File).Count)  0-byte: $((Get-ChildItem $d -Recurse -File | Where-Object Length -eq 0).Count)"
```

**必须检查 0 字节文件数为 0**，否则说明有图片下载失败。

### 3.1 用户说「某篇没同步」时（重要，实战踩过）

如果用户点名一篇文章没同步，**先别怀疑用户**。真实案例：「【轻小说推荐】学园第一美少女做我的秘书」曾漏掉，
根因是脚本用 `dw=636` 请求动态列表，接口只返回 28 条且不含该篇；改成 **`dw=808`** 后返回 30 条，
该篇就在第 3 条。`dw` 是客户端宽度/版本指纹参数，**不同值会让服务端返回不同的列表窗口**。

排查顺序：

1. 用完整 Cookie（**必须包含 `user_pkey` 和 `user_heybox_id`**）按 `dw=808` 请求一次，看该篇在不在第一页。
2. 若 `status=show_captcha`，是短时间翻页太密触发风控，**停手等 1~2 分钟**，不要连续重试（会越锁越久）。
3. 确认存在于列表 → 直接跑同步，脚本会按 linkid 去重后补抓。
4. 若列表里确实没有 → 可能是用户删了/仅自己可见，如实告知，不要硬造。

历史踩坑记录：某次排查时确认 sync state 里没有该 linkid，且首页 28 条最新只到 `190807237`（09-21），
目标文章 `193262469`（10-09）被列表窗口切掉了——**不是已同步过，而是压根没进过候选集**。

## 三·二、图片：缩略图展示 + 灯箱原图

正文图片**不再直接使用原图 URL**。原图动辄 4MB（长文几十张就是几百兆），文章页只加载压缩图：

- 正文里写成 `<img src="缩略图" data-origin="原图">`，灯箱靠 `data-origin` 取原图。
- frontmatter 里 `images` 存原图、`thumbs` 存缩略图，两者**一一对应**，画廊和封面用 `thumbs`。
- 缩略图规则（`toThumbnailUrl()`）：`原图URL + "?imageMogr2/thumbnail/1280x/format/jpg/quality/80"`，
  实测 4.1MB → 91KB。

适用于两个图床域名：`*.max-c.com`（现用）和 `*.maxjia.com`（老文章，**路径常带双斜杠**
如 `bbsimg.maxjia.com//heybox/…`，判断域名前要先把 `域名//` 归一化成 `域名/`）。

**新同步的文章脚本已自动处理，不需要额外步骤。**
只有当仓库里存在旧格式（正文是 `![]()` 原图）时才需要跑：

```powershell
cd D:\MyProject\myblog\scripts
npx tsx thumbnailize-articles.ts --dry-run   # 先看统计
npx tsx thumbnailize-articles.ts
```

注意：这个脚本**基于当前文件状态幂等**，重复跑不会重复加 `thumbs`。
但如果中途手动改坏了，先 `git checkout -- frontend/content/articles` 回到干净状态再跑，
不要在被污染的文件上叠加运行。

## 四、提交发布

文章目录**按分类分文件夹**（`articles/kuro/`、`articles/zhou-pi/` 等），脚本会自动落到正确目录，不要再手动新建 `review/`、`community/` 之类的旧目录。

```powershell
cd D:\MyProject\myblog
git add -A frontend/content/articles scripts 2>$null
git -c core.safecrlf=false commit -m "sync: 同步小黑盒动态 N 篇（标题…）"
git push origin main
```

### 图片备份有独立仓库（别混淆）

`frontend/content-images/` 是一个**独立的本地 git 仓库**，和主仓完全隔离：

- 主仓 `.gitignore` 里有 `**/content-images/`，所以 **`git add -A` 不会把它带进主仓**，也不会被推送。
- 该目录下有自己的 `.git`，专门用来防「图片被改坏后无法恢复」。
- **不要把这两个仓库的 git 命令搞混**。给图片存档时：

```powershell
cd D:\MyProject\myblog\frontend\content-images
git add -A
git commit -m "sync: 新增 N 张图"
# 单张图被改坏时恢复：
# git checkout -- <相对路径>
```

- 这个仓库没有 remote，是纯本地备份，**不要给它配置远端，也不要 push**。


推送 `main` 会触发 `.github/workflows/docker-publish.yml` 自动构建部署，**线上更新靠这一步**。

## 五、分类规则（重要）

分类按**发布在哪个游戏/主题社区**决定，与 `link_tag`、目录无关。规则写在
`scripts/sync-heihe.ts` 的 `resolveCategory()` 里，依据动态接口的 `topics` 字段：

| 社区（topics） | 分类 | 含义 |
|---|---|---|
| 鸣潮 | `kuro` | 酷狗の真情流露 |
| 明日方舟 / 明日方舟：终末地 | `zhou-pi` | 粥批の饭盒 |
| 小说（轻小说推荐） | `light-novel` | 轻小说推荐 |
| Gal游戏综合区 | `galgame` | 旮旯批的丑态 |
| 漫画 | `manga` | 漫画推荐 |
| 教程/装机/NAS 等技术贴 | `no-tech` | 没有技术的技术贴 |
| 其余 | `community` | 社区 |

分类清单必须与 `frontend/src/types.ts` 的 `CATEGORY_CONFIG` 一致；新增分类要同步改那里。

**若用户指出某篇分类不对**：直接改该文件 frontmatter 的 `category:`，然后运行

```powershell
npx tsx reorganize-by-category.ts   # 按 frontmatter 把文件挪到对应目录；--dry-run 可预览
```

## 六、环境相关的坑

- **`pwsh` 报 `SetNamedSecurityInfoW failed (Win32 5): grantWrite(...)`**：工作区 Windows 文件权限坏了，
  按 `diagnose-windows-sandbox-acl` skill 跑一次修复脚本（需要一次完全权限审批）即可恢复。
- **`tsx` 报 `spawn EPERM`**（esbuild 起子进程被沙箱拦）：用「完全权限」重跑该条命令。
- **不要用 PowerShell 读写 `games.json` 等中文 JSON**：`Get-Content -Raw` 再写回会破坏 UTF-8 编码。
  该文件由脚本自己维护；若已被改坏，用 `git checkout -- frontend/public/content/games/games.json` 恢复。
- 同步脚本重写 `games.json` 时会去掉末尾换行，可能产生无意义 diff，提交前可用 `git checkout --` 忽略它。

## 七、禁止事项

- 不要把 Cookie 写进任何被 git 跟踪的文件（README、脚本、配置）里。
- 不要用 `--force` 做常规更新。
- 不要手工创建 `review/`、`community/` 等旧分类目录。
- 不要在没有 `status=ok` 验证明文的情况下提交文章。

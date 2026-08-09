---
title: "为了方便追番，我写了一个一站式的追番平台——AniLinkService"
date: 2026-07-05
category: review
type: html
linkid: 179137974
link_tag: 11
source: https://www.xiaoheihe.cn/app/bbs/link/179137974
cover: "https://imgheybox.max-c.com/web/bbs/2026/04/12/31156219cedb2d620aa7e91d2036aba8.png"

images:
  - "https://imgheybox.max-c.com/web/bbs/2026/04/12/31156219cedb2d620aa7e91d2036aba8.png"
  - "https://imgheybox.max-c.com/web/bbs/2026/04/12/a75387c4994f6e51273c01bc2a6a48a8.png"
  - "https://imgheybox.max-c.com/web/bbs/2026/04/12/8b896141aafb3b43bd366755e19201e7.png"
  - "https://imgheybox.max-c.com/web/bbs/2026/04/12/e4d32a45e40b36cfc0b84617670c3030.png"
  - "https://imgheybox.max-c.com/web/bbs/2026/04/12/24af3bdcbea04da47e6b6a73b86c7237.png"
  - "https://imgheybox.max-c.com/web/bbs/2026/04/12/e26ad09dfed11f0bd60624475f44d38b.png"
  - "https://imgheybox.max-c.com/web/bbs/2026/04/12/f48ea2c09d7fff14d29d9ba6438d70b6.png"
  - "https://imgheybox.max-c.com/web/bbs/2026/04/12/e67b77916169d33b74fdb7f4714a5842.png"
  - "https://imgheybox.max-c.com/web/bbs/2026/04/12/c17b68972ad111e8cad68fb458001539.png"
  - "https://imgheybox.max-c.com/web/bbs/2026/04/12/b6ec89df8af1f26cc349df42c1d5efd4.png"
  - "https://imgheybox.max-c.com/web/bbs/2026/04/12/cbb69e082e55a1dd38f4c68b5abafd37.png"
  - "https://imgheybox.max-c.com/bbs/2026/04/12/927ee4a23db66cff3969571a96e6ce35.jfif"
---
![](https://imgheybox.max-c.com/web/bbs/2026/04/12/31156219cedb2d620aa7e91d2036aba8.png)




自从无职之后，看番的渠道也逐渐五花八门，经历过港澳台版权、omofun、再然后是B站各种神奇投稿


![](https://imgheybox.max-c.com/web/bbs/2026/04/12/a75387c4994f6e51273c01bc2a6a48a8.png)


看番的渠道很多，不过对我而言体验确实谈不上多好。

流畅性和渠道稳定性是一个方面，另一方面也时常忘记这季度打算追哪些番，看到了哪儿

索性自己写了个开源项目 AniLinkService，把媒体管理、番剧匹配、弹幕播放、更新提醒、RSS 下载全部整合在一起，丢在 NAS / 服务器上就能用。

这个项目面向下载党，有自己的NAS或服务器，但不想折腾太多东西（或者你有一个有服务器爱折腾的室友）。它解决的痛点本地番剧杂乱，看没看过全靠回忆找资源、下载、弹幕播放器来回切换，程序不在后台常驻的话，常常还需要现等下载新番更新不提醒，经常漏看多设备看进度不同步想自动化又不想折腾一堆软件功能展示1. 番剧管理与自动匹配自动扫描本地文件，自动匹配番剧信息、封面、集数和弹幕，全过程自动完成，基本无需手操。


![](https://imgheybox.max-c.com/web/bbs/2026/04/12/8b896141aafb3b43bd366755e19201e7.png)
2. 内置弹幕播放器网页直接播放，支持弹幕（来源弹弹PLAY）、字幕（内封、外挂均支持）、进度同步。


![](https://imgheybox.max-c.com/web/bbs/2026/04/12/e4d32a45e40b36cfc0b84617670c3030.png)
3. RSS 自动追番下载 & 内置资源搜索 & 下载器添加订阅源，更新自动下载、自动入库。


![](https://imgheybox.max-c.com/web/bbs/2026/04/12/24af3bdcbea04da47e6b6a73b86c7237.png)




内置资源搜索能力和下载器，无需部署外部服务


![](https://imgheybox.max-c.com/web/bbs/2026/04/12/e26ad09dfed11f0bd60624475f44d38b.png)
4. 新番时间表 & 追番日历 & 消息提醒当季新番一目了然，一键追番不遗漏。


![](https://imgheybox.max-c.com/web/bbs/2026/04/12/f48ea2c09d7fff14d29d9ba6438d70b6.png)



![](https://imgheybox.max-c.com/web/bbs/2026/04/12/e67b77916169d33b74fdb7f4714a5842.png)



![](https://imgheybox.max-c.com/web/bbs/2026/04/12/c17b68972ad111e8cad68fb458001539.png)


5.打通Bangumi查看番剧评价，发布bangumi评价和评分，均聚合在番剧详情页面内


![](https://imgheybox.max-c.com/web/bbs/2026/04/12/b6ec89df8af1f26cc349df42c1d5efd4.png)



![](https://imgheybox.max-c.com/web/bbs/2026/04/12/cbb69e082e55a1dd38f4c68b5abafd37.png)
6. 部署简单 & 可视化后台Docker 一键部署，文档也有详细的介绍和指引docker run -d --name anilink -p 8081:8081 -e DB_PROFILE=h2 \ -v ./anilink/data:/data -v ./anilink/media:/media/anime \ --restart unless-stopped ghcr.io/eventhorizonsky/anilinkserver:latest安装向导 + 可视化配置


![](https://imgheybox.max-c.com/bbs/2026/04/12/927ee4a23db66cff3969571a96e6ce35.jfif)
适合人群有 NAS、小服务器、想长期挂服务的盒友本地收藏大量番剧，想统一管理想要播放 + 弹幕 + 自动下载 + 追更一站式体验不想折腾复杂套件，追求简洁稳定项目完全开源，欢迎体验、提 issue 或一起完善。



项目地址（感觉有帮助的话可以点个星标喵。）：

https://github.com/eventhorizonsky/AniLinkService

使用文档：

https://eventhorizonsky.github.io/ani-link-doc/

有问题可以在评论区问，看到都会回。
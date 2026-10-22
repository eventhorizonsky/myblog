---
title: "【教程向】ONEDRIVE+CLOUDREVE搭建你的私人网盘"
date: 2021-01-12
category: no-tech
type: html
linkid: 51771718
link_tag: 11
source: https://www.xiaoheihe.cn/app/bbs/link/51771718
cover: "https://cdn.max-c.com/heybox/dailynews/img/65dcbbe5309338429c30e21bc54ef6d7.png"

images:
  - "https://cdn.max-c.com/heybox/dailynews/img/2f409134da065c664187b2175a729f90.png"
  - "https://cdn.max-c.com/heybox/dailynews/img/766b806d2f9b008573c5131833b3bcf1.png"
  - "https://cdn.max-c.com/heybox/dailynews/img/53c914175cd5e6370858dd4ec2ee17a0.png"
  - "https://cdn.max-c.com/heybox/dailynews/img/8458c72ed38c8cb55cb043a2824bc5b6.png"
  - "https://cdn.max-c.com/heybox/dailynews/img/c9a4e552575424bf5d4c4f02db58fe0b.png"
  - "https://cdn.max-c.com/heybox/dailynews/img/ce6df66edef350782a806cb49d9e0ed9.png"
  - "https://cdn.max-c.com/heybox/dailynews/img/90d488cf1f658a30d57f2eca591fd774.png"
  - "https://cdn.max-c.com/heybox/dailynews/img/d448c1c1f8c22167dfb3590e2fcfca3e.png"
  - "https://cdn.max-c.com/heybox/dailynews/img/e7ac683a377b882e84c50d8bdfa8d9e6.png"
  - "https://cdn.max-c.com/heybox/dailynews/img/848195a1f5af22bc4ea45ca583834435.png"
  - "https://cdn.max-c.com/heybox/dailynews/img/2c087967fbb9eeb8d1a7552f7b670b01.png"
  - "https://cdn.max-c.com/heybox/dailynews/img/9fd5f222ec4bf0acfc25b2ebb498597c.png"
  - "https://cdn.max-c.com/heybox/dailynews/img/ca0e23d22349ffc53381aeb32cea8eeb.png"
  - "https://cdn.max-c.com/heybox/dailynews/img/b6256f4fb9b80b57bf272d54155e1429.png"
---
在上一期中【【教程向】cloudreve+oss搭建你的私人网盘】我使用了onedriver+oss的模式来搭载网盘，这个模式虽然不错，但还是需要稍微担心一下oss的成本问题，但凡出现了个带恶人来搞破坏，成本将会呈直线式上升，故这次带来的教程是教你如何将你的onedriver云盘映射成网盘，并使其可以取出直链供网站的视频播放或者图床等使用。

想查看效果的话，可以到我的博客查看【https://ezsky.xyz/technology10/】，我在里面的图片及视频都是使用的通过这个方法提取出的直链

那么续接上回，彼时我们已经搭建好了cloudreve【如果还没的话可以去查看我的上一期教程】。反向代理首先在宝塔面板中进行反向代理，代理url根据你自己cloudreve的内网地址而定（端口一般都是这个）


![](https://cdn.max-c.com/heybox/dailynews/img/2f409134da065c664187b2175a729f90.png)


然后部署ssl 


![](https://cdn.max-c.com/heybox/dailynews/img/766b806d2f9b008573c5131833b3bcf1.png)


之后通过

https://地址

来访问你的网盘地址，记住是https，这个需要在onedriver的授权步骤中使用。

之后，在cloudreve中修改你的站点url为当前ip（即https://地址）


![](https://cdn.max-c.com/heybox/dailynews/img/53c914175cd5e6370858dd4ec2ee17a0.png)
连接与授权以https的情况下，进行onedriver的储存策略的分配


![](https://cdn.max-c.com/heybox/dailynews/img/8458c72ed38c8cb55cb043a2824bc5b6.png)


它的步骤教学很简单易懂，但是这里它的步骤中缺漏了一步，导致我之前一直分配失败。 


![](https://cdn.max-c.com/heybox/dailynews/img/c9a4e552575424bf5d4c4f02db58fe0b.png)


即注册完应用，得到其id后，你需要点击api权限进行如下操作。 


![](https://cdn.max-c.com/heybox/dailynews/img/ce6df66edef350782a806cb49d9e0ed9.png)



![](https://cdn.max-c.com/heybox/dailynews/img/90d488cf1f658a30d57f2eca591fd774.png)


然后点击添加权限

之后再按它的教程，去到证件与密码中获得密码复制粘贴到它指定的位置，再进行下一步就行。

授权完成后，将你所在的用户组分配到这个空间就可以使用了。


![](https://cdn.max-c.com/heybox/dailynews/img/d448c1c1f8c22167dfb3590e2fcfca3e.png)


可以看到，我们可以将图片上传到这个网盘，将它作为图床。 


![](https://cdn.max-c.com/heybox/dailynews/img/e7ac683a377b882e84c50d8bdfa8d9e6.png)


也可以将视频上传，获取它的直链，或者在网盘中在线观看。【当然也可以生成分享链接】 


![](https://cdn.max-c.com/heybox/dailynews/img/848195a1f5af22bc4ea45ca583834435.png)



![](https://cdn.max-c.com/heybox/dailynews/img/2c087967fbb9eeb8d1a7552f7b670b01.png)
结语与遗憾这样，你的onedriver就能被你充分地利用上了，你的onedriver有多大，这个网盘就能有多大，我是个人版的本来的5g再去淘宝一块五让人拓充到了15G，学校账号的onedriver好像没办法不行，会出现下图的报错


![](https://cdn.max-c.com/heybox/dailynews/img/9fd5f222ec4bf0acfc25b2ebb498597c.png)



![](https://cdn.max-c.com/heybox/dailynews/img/ca0e23d22349ffc53381aeb32cea8eeb.png)


不知道是不是需要管理员许可之类的（好可惜啊，我的大学账号有1个T呢），有成功的大佬希望能告诉我怎么操作

不过这15个G的私人空间+图床+视频直链来源+不限速还是让我一本满足的。【而且UI好看啊】


![](https://cdn.max-c.com/heybox/dailynews/img/b6256f4fb9b80b57bf272d54155e1429.png)
本文由小黑盒作者：事件视界sky 原创
未经授权禁止转载或摘编
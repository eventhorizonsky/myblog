---
title: "【教程向】cloudreve+oss搭建你的私人网盘"
date: 2020-12-23
category: review
type: html
linkid: 50157789
link_tag: 11
source: https://www.xiaoheihe.cn/app/bbs/link/50157789
cover: "https://cdn.max-c.com/heybox/dailynews/img/510a724fd90dcbf9d996cf5aabf20e84.png"

images:
  - "https://cdn.max-c.com/heybox/dailynews/img/9ed3d3b350aa4db89c301e18defd8904.png"
  - "https://cdn.max-c.com/heybox/dailynews/img/818b167190c50ec80f85d719d830b912.png"
  - "https://cdn.max-c.com/heybox/dailynews/img/ea2cbeee5812db5a1d44fc9c95fea408.png"
  - "https://cdn.max-c.com/heybox/dailynews/img/e1227a02f32e7cc31db4c969f9fe821d.png"
  - "https://cdn.max-c.com/heybox/dailynews/img/b7d3938728d7907e98091c5383587e42.png"
  - "https://cdn.max-c.com/heybox/dailynews/img/122582f7c3ad8c5ceabaf419628d297e.png"
  - "https://cdn.max-c.com/heybox/dailynews/img/644be2fd16c42ba1462f84405c351003.png"
  - "https://cdn.max-c.com/heybox/dailynews/img/e8c47cd6ae6150e4fbb6040a8ff8f61a.png"
  - "https://cdn.max-c.com/heybox/dailynews/img/88e2adbfaa6bd0bb8a1f9c04d9a49c5b.png"
  - "https://cdn.max-c.com/heybox/dailynews/img/32e708f34afed844113e06216d0fb914.png"
  - "https://cdn.max-c.com/heybox/dailynews/img/b6d0c1f1cc79cddb470b1f3d7f1f0b35.png"
  - "https://cdn.max-c.com/heybox/dailynews/img/b4c19c9b0f07a24559e637c8032f3014.png"
  - "https://cdn.max-c.com/heybox/dailynews/img/b40330bec5dadd31fbadb5054c71f33d.png"
  - "https://cdn.max-c.com/heybox/dailynews/img/378634b71fc17d00b911592b245063fb.png"
  - "https://cdn.max-c.com/heybox/dailynews/img/aad388870738dc3b2ae11cb0c1885ea5.png"
  - "https://cdn.max-c.com/heybox/dailynews/img/2b6d5da8fe76e750bce41f86b2c58a15.png"
  - "https://cdn.max-c.com/heybox/dailynews/img/3e60cfb7023824fb830e192103db78be.png"
  - "https://cdn.max-c.com/heybox/dailynews/img/e45735630777f574fdff2ba3e982e498.png"
  - "https://cdn.max-c.com/heybox/dailynews/img/2832ca86aaedb809f5bad3dd15df1e19.png"
  - "https://cdn.max-c.com/heybox/dailynews/img/e04160db17af961474d164085f001cbe.png"
  - "https://cdn.max-c.com/heybox/dailynews/img/9c89c1073b971cfe5e894ae5fde10f8e.png"
  - "https://cdn.max-c.com/heybox/dailynews/img/e6b3173c7a2fa8be91d70454b251d806.png"
  - "https://cdn.max-c.com/heybox/dailynews/img/bb5ff0c52544e3df5dea87ac08bcc969.png"
  - "https://cdn.max-c.com/heybox/dailynews/img/7748335262e816fe05fae4837a2cd548.png"
  - "https://cdn.max-c.com/heybox/dailynews/img/e7f4d922a96dd6e92419a8114a42d4bb.png"
  - "https://cdn.max-c.com/heybox/dailynews/img/2d22019516cb50cec6dcab92cdfae15a.png"
  - "https://cdn.max-c.com/heybox/dailynews/img/fa946265bcaaa35347b9729f9337a490.png"
---
【注：本文来自于我的博客[http://ezsky.xyz/technology8/]，为了获得最优的阅读体验，可以跳转至我的博客阅读本文】

前言

首先需要指出，比起现有的云盘，这个项目并不能帮你省多少钱，它主要面向的需求是

1.需要下载直链以方便做图床或者轻量的文件下载

2.轻微的储存分享需求

3.需要为博客等插入视频等大带宽需求但本身购置的服务器带宽不足的

4.闲得慌的装x爱好者（比如我）

你需要

1.已经购置好服务器并搭建好宝塔面板,并且最好有域名（如果没有可以先转至这个帖子【https://www.xiaoheihe.cn/community/7214/list/48223470】）

2.能接受轻微的云盘消费

3.解决问题的耐心( • ω• )✧

前置任务

一、白嫖至上

任务目标：嫖到你的cos或者oos

任务指引：在以下任务中选择其一

1.七牛云（10g的白嫖空间，需要域名）【https://www.qiniu.com/events/free?entry=index-floatwin】


![](https://cdn.max-c.com/heybox/dailynews/img/9ed3d3b350aa4db89c301e18defd8904.png)
目标是这两个，将他们搞到手 2.腾讯云（50g，但不是永久，好像是6个月）【https://cloud.tencent.com/act/free?from=11649】


![](https://cdn.max-c.com/heybox/dailynews/img/818b167190c50ec80f85d719d830b912.png)
目标是他 二、网站成立

将你需要部署的网站搭建好，ftp和数据库账号密码自己设定就行，是以便不时之需。


![](https://cdn.max-c.com/heybox/dailynews/img/ea2cbeee5812db5a1d44fc9c95fea408.png)


三、开源万岁

去这个地址【https://github.com/cloudreve/Cloudreve/releases】，下载你服务器对应系统的压缩包。


![](https://cdn.max-c.com/heybox/dailynews/img/e1227a02f32e7cc31db4c969f9fe821d.png)


如果下载速度太慢，可以去类似于这种代下载网站【http://gitd.cc/】


![](https://cdn.max-c.com/heybox/dailynews/img/b7d3938728d7907e98091c5383587e42.png)


为了以防万一，请确定自己的压缩包内是这样的文件，如果是个文件夹，请先解压一遍，确保里面的文件是cloudreve。 


![](https://cdn.max-c.com/heybox/dailynews/img/122582f7c3ad8c5ceabaf419628d297e.png)


将你的压缩包上传到你之前建立的网站的目录，比如说我刚创建的网站是pan.ezsky.xyz，你就需要在宝塔面板找到 


![](https://cdn.max-c.com/heybox/dailynews/img/644be2fd16c42ba1462f84405c351003.png)


在这个界面上传你刚下载好的压缩包

最终任务——云盘搭建

1.项目解压与部署

将你之前下载好的项目进行解压


![](https://cdn.max-c.com/heybox/dailynews/img/e8c47cd6ae6150e4fbb6040a8ff8f61a.png)


得到一个没有后缀的cloudreve文件（我截图中其他文件不用管，你应该完成后除了压缩包就只有那个文件了） 


![](https://cdn.max-c.com/heybox/dailynews/img/88e2adbfaa6bd0bb8a1f9c04d9a49c5b.png)


然后打开你的ssh面板，宝塔自带的也可以（你需要记得自己服务器的账号密码，登录即可，忘了的话去自己购买服务器的网站找找吧）


![](https://cdn.max-c.com/heybox/dailynews/img/32e708f34afed844113e06216d0fb914.png)


输入cd +你的网站的文件夹，比如我的是/www/wwwroot/pan.ezsky.xyz，那么我应该在命令行输入

cd /www/wwwroot/pan.ezsky.xyz 


![](https://cdn.max-c.com/heybox/dailynews/img/b6d0c1f1cc79cddb470b1f3d7f1f0b35.png)


输入

chmod +x ./cloudreve

来赋予权限

然后输入

./cloudreve

第一次运行cloudreve，他会告诉你你的账号密码将它复制下来（如果告诉你端口被占用，则按下一步操作杀掉进程）


![](https://cdn.max-c.com/heybox/dailynews/img/b4c19c9b0f07a24559e637c8032f3014.png)


然后先确保你的5212端口没有没占用，输入

lsof -i:5212

如果没有什么反应就可以直接进行下一步，有如图所示的反馈的话


![](https://cdn.max-c.com/heybox/dailynews/img/b40330bec5dadd31fbadb5054c71f33d.png)


则输入kill -9 +对应的pid，比如

kill -9 3312

然后进入宝塔面板的应用中，找到supervisor管理器并安装


![](https://cdn.max-c.com/heybox/dailynews/img/378634b71fc17d00b911592b245063fb.png)


然后点击添加守护进程后如图进行设置


![](https://cdn.max-c.com/heybox/dailynews/img/aad388870738dc3b2ae11cb0c1885ea5.png)


如果是如下图的绿色三角，就是运行成功了，如果无法运行，则重启机器再杀一遍5212的占用进程再添加。 


![](https://cdn.max-c.com/heybox/dailynews/img/2b6d5da8fe76e750bce41f86b2c58a15.png)


然后进行反向代理（我这一步不算设置成功，不需要域名反代的可以跳过这一步）


![](https://cdn.max-c.com/heybox/dailynews/img/3e60cfb7023824fb830e192103db78be.png)


最后在浏览器输入你的域名或者你的ip:5212（比如196.163.0.1:5212）就可以进入登录页了

二、建立连接

输入你之前记下的账号密码。


![](https://cdn.max-c.com/heybox/dailynews/img/e45735630777f574fdff2ba3e982e498.png)


进入管理面板 


![](https://cdn.max-c.com/heybox/dailynews/img/2832ca86aaedb809f5bad3dd15df1e19.png)


然后进入储存策略选择你之前的对象储存服务 


![](https://cdn.max-c.com/heybox/dailynews/img/e04160db17af961474d164085f001cbe.png)


按照他的要求填写就行，七牛的话要求填写绑定的域名。 


![](https://cdn.max-c.com/heybox/dailynews/img/9c89c1073b971cfe5e894ae5fde10f8e.png)


你可能需要前往你的控制台查看你的api秘钥，按要求填入，然后无脑下一步（需要外链的话记得打开）


![](https://cdn.max-c.com/heybox/dailynews/img/e6b3173c7a2fa8be91d70454b251d806.png)


建立好储存策略，就进入管理用户组 


![](https://cdn.max-c.com/heybox/dailynews/img/bb5ff0c52544e3df5dea87ac08bcc969.png)


为其分配刚刚创建的储存策略，还有分配的空间 


![](https://cdn.max-c.com/heybox/dailynews/img/7748335262e816fe05fae4837a2cd548.png)


搭建完成，进行测试 


![](https://cdn.max-c.com/heybox/dailynews/img/e7f4d922a96dd6e92419a8114a42d4bb.png)


可以看到上传下载速度都很足 


![](https://cdn.max-c.com/heybox/dailynews/img/2d22019516cb50cec6dcab92cdfae15a.png)



![](https://cdn.max-c.com/heybox/dailynews/img/fa946265bcaaa35347b9729f9337a490.png)


结语

至此，你的云盘就已经搭建完成了，善加使用吧。

小声逼逼（当然，如果不是直链等类似需求的话，是可以直接200买天翼网盘两年黄金会员的，6t不限速我感觉挺值的，空虚+999ヽ(｀Д´)ﾉ︵ ┻━┻ ┻━┻ ）

 本文由小黑盒作者：事件视界sky 原创
未经授权禁止转载或摘编
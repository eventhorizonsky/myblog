---
title: "【教程向】利用calibre-web搭建私人书库"
date: 2020-12-15
category: no-tech
type: html
linkid: 50245602
link_tag: 11
source: https://www.xiaoheihe.cn/app/bbs/link/50245602
cover: "https://cdn.max-c.com/heybox/dailynews/img/86144e31838aacaa4b92fa31cfce5914.jpg"

images:
  - "https://cdn.max-c.com/heybox/dailynews/img/bfdc45a682a3e998d392a6f54eb7d549.jpg"
  - "https://cdn.max-c.com/heybox/dailynews/img/3edb258131fcf8e6696cea8ee55b2380.png"
  - "https://cdn.max-c.com/heybox/dailynews/img/78645ca80dea05aa54a28bfe87a1dac1.png"
  - "https://cdn.max-c.com/heybox/dailynews/img/fa8cfbbc2e5d60c4099bebe5e03b50bd.png"
  - "https://cdn.max-c.com/heybox/dailynews/img/578b2b2791bb1dac7ddfcfe942932e72.png"
  - "https://cdn.max-c.com/heybox/dailynews/img/25f3e0d20215f05e94750b12719e2823.png"
  - "https://cdn.max-c.com/heybox/dailynews/img/847f3a03f28950b88163b12693f1d772.png"
  - "https://cdn.max-c.com/heybox/dailynews/img/3691d3c2bd68439e93f6e651e8a158d6.png"
  - "https://cdn.max-c.com/heybox/dailynews/img/67f44daa8d0cedceb337b8326fd6ebee.png"
  - "https://cdn.max-c.com/heybox/dailynews/img/59da228dc7899c3883558d1a2f91e894.png"
  - "https://cdn.max-c.com/heybox/dailynews/img/f60db4b8e681086b138c867d0c48ef99.png"
  - "https://cdn.max-c.com/heybox/dailynews/img/39fecb2f04c6165876e7bdac0f7b6fef.png"
  - "https://cdn.max-c.com/heybox/dailynews/img/db6d1c400be6723d04b48e1758f7a1e1.png"
  - "https://cdn.max-c.com/heybox/dailynews/img/81f700ad6bdec7989a4e6d0f65d82d8b.png"
  - "https://cdn.max-c.com/heybox/dailynews/img/cc9acdde4457186672e4ef6c9682e995.png"
  - "https://cdn.max-c.com/heybox/dailynews/img/49be9b4b7c3699736eb407a3fcc64677.png"
  - "https://cdn.max-c.com/heybox/dailynews/img/9fffd3638f47471d023ed88c854fc60a.png"
  - "https://cdn.max-c.com/heybox/dailynews/img/3354fc359e40804e7ab66e2c26357edf.png"
  - "https://cdn.max-c.com/heybox/dailynews/img/f4ba5ae86463df68c5d0255153a14cc8.png"
  - "https://cdn.max-c.com/heybox/dailynews/img/935ddf8bbbbbe635f86b85c64d9c1cfb.png"
  - "https://cdn.max-c.com/heybox/dailynews/img/20d89300b110dce735eecb8e981106a2.png"
  - "https://cdn.max-c.com/heybox/dailynews/img/9ce457fa77cedc80efc7637d81d13429.png"
  - "https://cdn.max-c.com/heybox/dailynews/img/a30690752e69a0b78f0c96f686d63ed8.png"
---
前言

calibre-web是一个支持opds的在线阅读网站的开源项目，主要支持的是对主流电子书文档（epub、txt等）的在线阅读、推送至kindle、在支持opds的平台的下载阅读等

我是觉得在线阅读的界面很好看，opds也相当方便就当做了几个宅友私下的轻小说书站|･ω･` )。


![](https://cdn.max-c.com/heybox/dailynews/img/bfdc45a682a3e998d392a6f54eb7d549.jpg)



![](https://cdn.max-c.com/heybox/dailynews/img/3edb258131fcf8e6696cea8ee55b2380.png)



![](https://cdn.max-c.com/heybox/dailynews/img/78645ca80dea05aa54a28bfe87a1dac1.png)


你需要

1.已经安装好宝塔面板的服务器

2.耐心

安装过程

本文采用的安装方法为源码安装法，是经作者测试后最简单最不容易出错的一个方法。

首先，下载calibre-web的文件【https://github.com/janeczku/calibre-web】，上传并解压至你的网站。

将你解压的位置复制下来，待会儿要用，比如说我的位置是在

/www/wwwroot/calibre-web-master


![](https://cdn.max-c.com/heybox/dailynews/img/fa8cfbbc2e5d60c4099bebe5e03b50bd.png)



![](https://cdn.max-c.com/heybox/dailynews/img/578b2b2791bb1dac7ddfcfe942932e72.png)



![](https://cdn.max-c.com/heybox/dailynews/img/25f3e0d20215f05e94750b12719e2823.png)






然后去软件商店下载安装Python项目管理器 


![](https://cdn.max-c.com/heybox/dailynews/img/847f3a03f28950b88163b12693f1d772.png)


 

打开后添加项目，路径是我们刚复制的，启动文件是该路径下的cps.py文件，启动方式选Python，端口选8083（记得去宝塔面板和服务器供应商的安全组开放端口），下面的选项都勾选。 


![](https://cdn.max-c.com/heybox/dailynews/img/3691d3c2bd68439e93f6e651e8a158d6.png)






如果是绿色三角，就是启动成功了。 


![](https://cdn.max-c.com/heybox/dailynews/img/67f44daa8d0cedceb337b8326fd6ebee.png)






如果你需要域名访问，就点击映射，填写你要映射的域名，他会自动帮你创建好网站


![](https://cdn.max-c.com/heybox/dailynews/img/59da228dc7899c3883558d1a2f91e894.png)






如果不需要域名访问，则在浏览器打开

你的ip:8083

即可。

之后能看到类似于这个界面，就算搭建完成了【你的初始账号一般是admin，密码是admin123】


![](https://cdn.max-c.com/heybox/dailynews/img/f60db4b8e681086b138c867d0c48ef99.png)






导入书库

首先，去calibre官网【https://calibre-ebook.com/download】下载你电脑对应版本的客户端。

创建好空白书库后将你的书库资源（txt、epub等文件）直接拖入这个窗口


![](https://cdn.max-c.com/heybox/dailynews/img/39fecb2f04c6165876e7bdac0f7b6fef.png)






可以ctrl多个书籍然后右键编辑元数据，也可以一个个编辑元数据，将你书的标签、作者、简介、评分等进行修改，直到你满意为止。 


![](https://cdn.max-c.com/heybox/dailynews/img/db6d1c400be6723d04b48e1758f7a1e1.png)




比如我是直接利用标签把书籍分类的 编辑好之后，右键一本书，打开所在目录 


![](https://cdn.max-c.com/heybox/dailynews/img/81f700ad6bdec7989a4e6d0f65d82d8b.png)






将这个文件夹（名字可能不同，找绝对路径就行）压缩打包上传至你的服务器，并解压 


![](https://cdn.max-c.com/heybox/dailynews/img/cc9acdde4457186672e4ef6c9682e995.png)






复制其目录，粘贴到之前你的书库页面中的书库配置中 


![](https://cdn.max-c.com/heybox/dailynews/img/49be9b4b7c3699736eb407a3fcc64677.png)







![](https://cdn.max-c.com/heybox/dailynews/img/9fffd3638f47471d023ed88c854fc60a.png)






这样就搭建完成了 


![](https://cdn.max-c.com/heybox/dailynews/img/3354fc359e40804e7ab66e2c26357edf.png)






SMTP邮箱设定 


![](https://cdn.max-c.com/heybox/dailynews/img/f4ba5ae86463df68c5d0255153a14cc8.png)






首先选择你要设定的smtp服务器【https://jingyan.baidu.com/article/295430f1fc28a60c7e0050f9.html】，发件人邮箱可以用你自己的邮箱。这里注意加密与未加密的端口是不一样的，详情可以百度。

然后在你的邮箱处获取你的smtp密码，我拿网易举例。


![](https://cdn.max-c.com/heybox/dailynews/img/935ddf8bbbbbe635f86b85c64d9c1cfb.png)






在设置里找到smtp


![](https://cdn.max-c.com/heybox/dailynews/img/20d89300b110dce735eecb8e981106a2.png)


然后开启这个功能得到一串密码，将它复制到之前需要填写的密码处。 


![](https://cdn.max-c.com/heybox/dailynews/img/9ce457fa77cedc80efc7637d81d13429.png)






然后保存并测试即可，测试的话需要你的管理员账号绑定好收件邮箱 


![](https://cdn.max-c.com/heybox/dailynews/img/a30690752e69a0b78f0c96f686d63ed8.png)






opds

你的opds地址就是你的书库地址/opds，ios可以使用kybook，安卓可以使用静读天下，都支持opds功能，相当于为本地书库添加了一个自定义的网络书城，还是挺方便的。

结语

至此，你的书站就基本搭建完成，怎么修改得更合自己心意，就看各位自己的了，当然，如果你只是需要一个比较纯粹的有云功能的阅读产品，我还是推荐neat Reader【https://www.neat-reader.cn/】，这是个国人开发的阅读软件，会员有10g的存书空间，可以多端同步，还是挺方便的。

不过，我还是更中意calibre

因为ui好看，以及可以装x￣ω￣=

 

本文由小黑盒作者：事件视界sky 原创
未经授权禁止转载或摘编
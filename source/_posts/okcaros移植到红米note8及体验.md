---
title: okcaros移植到红米note8及体验
tags: [okcaros]
toc: true
date: 2023-10-18 10:56:52
---

> 最近okcaros开放第三方移植了，我就简单试了一下，有点惊喜

okcaros官网 https://www.okcaros.com/zh ，实现原理是通过更改usb协议，欺骗carplay来映射安卓手机的内容，思路还是挺好的

适配过程比较简单，给kernel“打个补丁”，引入一下okcar代码，编译就完事了（实际是在AMD r7-5800上面，16G内存的虚拟机上，要跑12+小时😂

上两张图

![](/images/okcar-1.jpg)

![](/images/okcar-2.jpg)
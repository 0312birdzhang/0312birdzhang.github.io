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

> ---------------2024年04月14日 16点32分---------------

继续上次没写完的内容。代码已经合并到okcaros的仓库了，可以clone下来直接编译了，代码参见 https://github.com/okcar-os?q=ginkgo&type=all&language=&sort=

当然，既然合并到上游仓库了，自然是提供直接下载的 https://download.okcaros.com/devices/ginkgo/builds

另外，发现有windows下的安装工具了，https://okcar-cdn.okcarbox.com/app/okcaros_installer_1.0.0.exe
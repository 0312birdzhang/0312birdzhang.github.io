---
title: 使用docker编译打包sailfishos
date: 2019-05-27 14:18:52
tags: [docker, sailfishos]
---

> 开坑

1. ubuntu HA_BUILD

用官方的ubuntu镜像即可，16.04或18.04都可以，不要用最新的20.04。一般来说启动之后的镜像除了手动指定的目录是持久化的，其他的会重启后失效，所以最好自己做一个镜像，把安卓编译环境安装上。

启动时映射本地目录，当作ANDROID_ROOT目录。


2. mer MER_BUILD

3. OBS

4. gitlab ci



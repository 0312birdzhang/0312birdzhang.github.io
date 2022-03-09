---
title: Tomcat多实例session共享方案
tags: [tomcat]
toc: true
date: 2022-03-09 14:21:39
---

Tomcat实现多实例session共享的方案还挺多的，up主使用了三种，最终选择了tomcat自带的Cluster集群方案。下面来说一下这三种方案的优缺点。

> up主用的tomcat7，至于为什么还是7这么老的版本，因为高版本的对get请求有一些字符校验
> 另外，这些都是不用改java代码的，其他的没做研究

## tomcat-redis-session-manager

这个应该是最常见的方案了，我们随便一搜就是这个，但是代码有些坑。。。

如: [这个](https://github.com/janrain/tomcat-redis-session-manager) [还有这个](https://github.com/jcoleman/tomcat-redis-session-manager/issues) 等等，还有两个致命的bug，一是session保留时间过长，里面有一段[代码](https://github.com/jcoleman/tomcat-redis-session-manager/blob/5ed5859f887e0ca24704f7f69573c69b4dd61cf0/src/main/java/com/radiadesign/catalina/session/RedisSessionManager.java#L402) `session.setMaxInactiveInterval(getMaxInactiveInterval() * 1000);` ，这里多保留了1000倍的时间。二是每次访问都会有一条session记录保留，非常的耗费redis内存。

虽然上述俩bug本up主已经修复了，但是发现还会丢session，估计是redis的驱逐问题，也懒得去调试了。

## redisson

本up主发现这个的时候以为终于得救了，看一下人家的官网 https://redisson.pro/ ，还有商业版，就觉得很靠谱。事实证明还是too young too naive啊

因为突然有一天，同事说你这个接口好慢，然后我发现整个机器负载都很高了，访问网站直接卡成狗，看了一下日志，jvm崩溃了 java.lang.OutOfMemoryError: GC overhead limit exceeded

上面那个不管是丢session还是保留时间太长，但是不至于把tomcat搞死。好家伙，这个直接把jvm干崩溃了，[OOM可还行](https://github.com/redisson/redisson/issues?q=OutOfMemoryError)

## Tomcat Cluster

这里有一个很详细的教程 http://xstarcd.github.io/wiki/Java/tomcat_cluster.html ，我就不赘述了。

注意，我直接贴他的tomcat配置发现有看不见的空行还是啥的，可以去[tomcat网站](https://tomcat.apache.org/tomcat-7.0-doc/cluster-howto.html)复制。

注意2，一定要在web.xml中添加`<distributable />`

使用两天了，暂时没发现问题，有待后续观察。
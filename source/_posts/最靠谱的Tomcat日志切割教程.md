---
title: 最靠谱的Tomcat日志切割教程
date: 2017-05-22 16:32:54
tags: Tomcat
---

## 强大的logrotate

更多logrotate的说明见 http://www.linuxcommand.org/man_pages/logrotate8.html

或者这里 https://linux.cn/article-4126-1.html

在`/etc/logrotate.d/tomcat`里写入下面的内容

```
/data/logs/logpath/catalina-daemon.out {
        daily
        rotate 3
        size 100M
        nocompress
        notifempty
        missingok
        copytruncate
        create 0600 root root
}
```

测试

`logrotate --force /etc/logrotate.d/tomcat.conf`

查看是否有一个/data/logs/logpath/catalina-daemon.out.1生成

## 为什么不用cronolog?

很简单，cronolog对jsvc启动的tomcat不友好


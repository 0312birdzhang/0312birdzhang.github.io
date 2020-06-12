---
title: 'debian,ubuntu无法使用apt下载源数据的解决方法'
date: 2020-06-05 16:59:57
tags: [apt,debian,ubuntu]
---

### 现象：

不管是默认的源还是ustc的都直接提示 Connection failed，但可以ping通。
```
root@77ec78c7b3b7:/# printf "deb http://mirrors.ustc.edu.cn/debian/ buster main contrib non-free\n#deb-src http://mirrors.ustc.edu.cn/debian/ buster main contrib non-free\ndeb http://mirrors.ustc.edu.cn/debian/ buster-updates main contrib non-free\n#deb-src http://mirrors.ustc.edu.cn/debian/ buster-updates main contrib non-free\n#deb http://mirrors.ustc.edu.cn/debian-security/ buster/updates main contrib non-free\n#deb-src http://mirrors.ustc.edu.cn/debian-security/ buster/updates main contrib non-free" > /etc/apt/sources.list
root@77ec78c7b3b7:/# apt update
Err:1 http://mirrors.ustc.edu.cn/debian buster InRelease
  Connection failed [IP: 202.141.176.110 80]
Err:2 http://mirrors.ustc.edu.cn/debian buster-updates InRelease
  Connection failed [IP: 202.141.176.110 80]
Reading package lists... Done                                
Building dependency tree      
Reading state information... Done
All packages are up to date.
W: Failed to fetch http://mirrors.ustc.edu.cn/debian/dists/buster/InRelease  Connection failed [IP: 202.141.176.110 80]
W: Failed to fetch http://mirrors.ustc.edu.cn/debian/dists/buster-updates/InRelease  Connection failed [IP: 202.141.176.110 80]
W: Some index files failed to download. They have been ignored, or old ones used instead.
```
 
### 解决方法：

更改apt的默认UA

`printf 'Acquire\n{\n  http::User-Agent "Mozilla/5.0 (Windows NT 5.1; rv:25.0) \nGecko/20100101 Firefox/25.0";\n};' > /etc/apt/apt.conf`

 

### 参考：

* https://samhassell.com/apt-cant-see-sources-try-changing-the-user-agent/


### 原因:

未知。。。，在另一个网络环境下就可以，也是神奇。

P.S. 感谢公司大数据部门的同学，让我又可以水一篇了 xD (~~划掉划掉~~)
---
title: 使用Gitlab/Bitbucket等CI搭建自己的临时代理
date: 2018-12-06 13:44:20
tags: [socks5,frp]
---


> 这篇文章只是从技术层面探讨可行性，不接受一切反驳！

### 使用条件

* 一个有外网的主机(frp需要)
* gitlab或bitbucket账号


### frp服务端搭建

具体可以查看[frp github主页](https://github.com/fatedier/frp/blob/master/README_zh.md#%E4%BD%BF%E7%94%A8%E7%A4%BA%E4%BE%8B)

下载对应你操作系统版本的包（我的docker打包的客户端是0.17.0版本，想使用新版的可以自行打包）

服务端配置如下(frps.ini)：
```
[common]
bind_port = 7000
token = 123456
```

解压下载的压缩包，启动服务端： `./frps -c frps.ini`

注意开通7000及需要frp客户端映射端口(这里用到了6200)


### frp客户端

Gitlab参见 https://gitlab.com/0312birdzhang/frp_proxy

客户端配置如下(frpc.ini)：
```
[common]
server_addr = 12.13.14.15
server_port = 7000
token = 123456

[socks_proxy_6200]
type = tcp
plugin = socks5
remote_port = 6200
```

fork代码后，需要修改**server_addr**、**server_port**、**token**、**remote_port** 为你服务器相关的，然后保存即可。



Bitbucket的参考：

bitbucket-pipelines.yml
```
image: 0312birdzhang/frpc_proxy:v2

pipelines:
  default:
    - step:
        caches:
          - pip
        script:
          - cp frpc.ini /app/my_frpc.ini
          - /app/frpc -c /app/my_frpc.ini
```          

### 使用

12.13.14.15:6200 即是你的socks5代理地址
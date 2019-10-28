---
title: Windows使用frp进行远程连接
date: 2019-10-12 09:58:53
tags: [windows,frp,rdp]
---

> frp 是一个可用于内网穿透的高性能的反向代理应用，支持 tcp, udp, http, https 协议。


Github介绍： https://github.com/fatedier/frp/blob/master/README_zh.md

## 安装

从这里https://github.com/fatedier/frp/releases 下载最新的二进制安装包，服务端跟客户端都在一个压缩包里。

### 服务端

服务端跟客户端都需要一个配置文件，对于服务端配置文件如下

```
frps.ini (完整配置文件 https://github.com/fatedier/frp/blob/master/conf/frps_full.ini)
[common]
bind_port = 7000
vhost_http_port = 8888
token = your_token
```

然后启动只需要一条命令
`/usr/bin/frps -c /etc/frps/frps.ini`


最好做一下守护，如使用systemd托管
```
$ cat /etc/systemd/system/frps.service
[Unit]
Description=frpc daemon
After=syslog.target network.target
Wants=network.target
[Service]
Type=simple
ExecStart=/usr/bin/frps -c /etc/frps/frps.ini
Restart=always
RestartSec=1min
ExecStop=/usr/bin/killall frps
[Install]
WantedBy=multi-user.target
```

### 客户端

客户端同服务端也需要一份配置(frpc.ini)，如这里我们做windows的远程桌面映射
```
[common]
server_addr = 47.98.28.15
server_port = 7000
token = your_token
[rdp]
type = tcp
local_port = 3389
remote_port = 3389
```

上面的server_addr填写服务端的ip，token同服务端的token。

同样一条命令启动
`./frpc.exe -c frpc.ini`

#### 做成自启动服务

下载一个[nssm.exe](https://nssm.cc)放到frp的目录下，然后执行下面的命令(注意下对32、64版本)
`nssm.exe install frpc`

接下来会弹出一个框，在path处选择启动frpc的frpc.bat

点击Install service即可

启动 nssm.exe start frpc

## 测试

首先确保你的windows可以被远程连接。

在外网机器输入 47.98.28.15，然后输入你的用户名密码即可连接。

注意开通服务器跟客户端的3389端口，以及服务端的7000，8888端口。
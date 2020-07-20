---
title: Docker on SailfishOS
date: 2018-09-05 17:00:03
tags: [docker,sailfishos]
categories: [SailfishOS, Docker]
---

# How to install Docker on SailfishOS/如何将Docker安装到SailfishOS

This post will show you how to install Docker on SailfishOS, and some hacks need to do.

这篇文章将介绍如何将Docker安装到SailfishOS上，和需要做的一些hack。

## Prerequisites/先决条件

https://docs.docker.com/install/linux/docker-ce/binaries/#install-daemon-and-client-binaries-on-linux

* A 64-bit installation
* Version 3.10 or higher of the Linux kernel. The latest version of the kernel available for you platform is recommended.
* iptables version 1.4 or higher
* git version 1.7 or higher
* A `ps` executable, usually provided by `procps` or a similar package.
* [XZ Utils](http://tukaani.org/xz/) 4.9 or higher
* A [properly mounted](https://github.com/tianon/cgroupfs-mount/blob/master/cgroupfs-mount) cgroupfs hierarchy; a single, all-encompassing cgroup mount point is not sufficient. See Github issues #2683, #3485, #4568).

* 64位系统
* 3.10内核或更高
* iptable版本至少是1.4
* git版本至少1.7
* 可以执行`ps`
* xz工具版本至少4.9
* 正确安装的cgroupfs层次结构; 一个单一的，无所不包的cgroup挂载点是不够的。



## Check Kernel support/检查内核支持

Use this script [check-config.sh](https://github.com/moby/moby/raw/master/contrib/check-config.sh)
使用这个脚本 [check-config.sh](https://github.com/moby/moby/raw/master/contrib/check-config.sh)


```
[nemo@Sailfish ~]$ ./check-config.sh 
info: reading kernel config from /proc/config.gz ...

Generally Necessary:
- cgroup hierarchy: properly mounted [/sys/fs/cgroup]
- CONFIG_NAMESPACES: enabled
- CONFIG_NET_NS: enabled
- CONFIG_PID_NS: enabled
- CONFIG_IPC_NS: enabled
- CONFIG_UTS_NS: enabled
- CONFIG_CGROUPS: enabled
- CONFIG_CGROUP_CPUACCT: enabled
- CONFIG_CGROUP_DEVICE: enabled
- CONFIG_CGROUP_FREEZER: enabled
- CONFIG_CGROUP_SCHED: enabled
- CONFIG_CPUSETS: enabled
- CONFIG_MEMCG: enabled
- CONFIG_KEYS: enabled
- CONFIG_VETH: enabled
- CONFIG_BRIDGE: enabled
- CONFIG_BRIDGE_NETFILTER: enabled (as module)
- CONFIG_NF_NAT_IPV4: enabled
- CONFIG_IP_NF_FILTER: enabled
- CONFIG_IP_NF_TARGET_MASQUERADE: enabled
- CONFIG_NETFILTER_XT_MATCH_ADDRTYPE: enabled
- CONFIG_NETFILTER_XT_MATCH_CONNTRACK: enabled
- CONFIG_NETFILTER_XT_MATCH_IPVS: enabled
- CONFIG_IP_NF_NAT: enabled
- CONFIG_NF_NAT: enabled
- CONFIG_NF_NAT_NEEDED: enabled
- CONFIG_POSIX_MQUEUE: enabled
- CONFIG_DEVPTS_MULTIPLE_INSTANCES: enabled

Optional Features:
- CONFIG_USER_NS: enabled
- CONFIG_SECCOMP: enabled
- CONFIG_CGROUP_PIDS: missing
- CONFIG_MEMCG_SWAP: enabled
- CONFIG_MEMCG_SWAP_ENABLED: enabled
    (cgroup swap accounting is currently enabled)
- CONFIG_MEMCG_KMEM: enabled
- CONFIG_RESOURCE_COUNTERS: enabled
- CONFIG_BLK_CGROUP: enabled
- CONFIG_BLK_DEV_THROTTLING: missing
- CONFIG_IOSCHED_CFQ: enabled
- CONFIG_CFQ_GROUP_IOSCHED: missing
- CONFIG_CGROUP_PERF: enabled
- CONFIG_CGROUP_HUGETLB: missing
- CONFIG_NET_CLS_CGROUP: enabled
- CONFIG_CGROUP_NET_PRIO: enabled
- CONFIG_CFS_BANDWIDTH: missing
- CONFIG_FAIR_GROUP_SCHED: enabled
- CONFIG_RT_GROUP_SCHED: enabled
- CONFIG_IP_VS: enabled
- CONFIG_IP_VS_NFCT: enabled
- CONFIG_IP_VS_RR: enabled
- CONFIG_EXT3_FS: enabled
- CONFIG_EXT3_FS_XATTR: enabled
- CONFIG_EXT3_FS_POSIX_ACL: enabled
- CONFIG_EXT3_FS_SECURITY: enabled
- CONFIG_EXT4_FS: enabled
- CONFIG_EXT4_FS_POSIX_ACL: missing
- CONFIG_EXT4_FS_SECURITY: enabled
    enable these ext4 configs if you are using ext4 as backing filesystem
- Network Drivers:
  - "overlay":
    - CONFIG_VXLAN: enabled
      Optional (for encrypted networks):
      - CONFIG_CRYPTO: enabled
      - CONFIG_CRYPTO_AEAD: enabled
      - CONFIG_CRYPTO_GCM: enabled
      - CONFIG_CRYPTO_SEQIV: enabled
      - CONFIG_CRYPTO_GHASH: enabled
      - CONFIG_XFRM: enabled
      - CONFIG_XFRM_USER: enabled
      - CONFIG_XFRM_ALGO: enabled
      - CONFIG_INET_ESP: enabled
      - CONFIG_INET_XFRM_MODE_TRANSPORT: enabled
  - "ipvlan":
    - CONFIG_IPVLAN: missing
  - "macvlan":
    - CONFIG_MACVLAN: enabled
    - CONFIG_DUMMY: missing
  - "ftp,tftp client in container":
    - CONFIG_NF_NAT_FTP: enabled
    - CONFIG_NF_CONNTRACK_FTP: enabled
    - CONFIG_NF_NAT_TFTP: enabled
    - CONFIG_NF_CONNTRACK_TFTP: enabled
- Storage Drivers:
  - "aufs":
    - CONFIG_AUFS_FS: missing
  - "btrfs":
    - CONFIG_BTRFS_FS: enabled
    - CONFIG_BTRFS_FS_POSIX_ACL: enabled
  - "devicemapper":
    - CONFIG_BLK_DEV_DM: enabled
    - CONFIG_DM_THIN_PROVISIONING: missing
  - "overlay":
    - CONFIG_OVERLAY_FS: enabled
  - "zfs":
    - /dev/zfs: missing
    - zfs command: missing
    - zpool command: missing

Limits:
- /proc/sys/kernel/keys/root_maxkeys: 1000000

[nemo@Sailfish ~]$ 
```

Generally Necessary must be all `enabled`, if not enabled, you must enable it in your kernel defconfig, and rebuild kernel.
Generally Necessary 部分必须全部是`enabled`, 如果没有启用，必须启用然后重启编译内核。



## Download the static binary archive/下载静态二进制文件

https://download.docker.com/linux/static/stable/aarch64/

Extract the archive and put them to `/usr/bin/`


## Add nemo to docker group/将nemo用户添加到docker组

```
groupadd docker
usermod -a -G docker nemo
```


## Run Docker/启动Docker

Start docker daemon/ 启动docker守护进程  
`devel-su /usr/bin/dockerd`

Or use systemd/ 或者使用systemd

```
[Unit]
Description=Docker Application Container Engine
Documentation=https://docs.docker.com
After=network-online.target firewalld.service
Wants=network-online.target

[Service]
Type=notify
ExecStart=/usr/bin/dockerd
ExecReload=/bin/kill -s HUP $MAINPID
LimitNOFILE=infinity
LimitNPROC=infinity
LimitCORE=infinity
TimeoutStartSec=0
KillMode=process
Restart=on-failure
StartLimitBurst=3
StartLimitInterval=60s

[Install]
WantedBy=multi-user.target

```


Check version/检查版本
```
[root@Sailfish nemo]# docker version

Client:
 Version:           18.06.1-ce
 API version:       1.38
 Go version:        go1.10.3
 Git commit:        e68fc7a
 Built:             Tue Aug 21 17:20:38 2018
 OS/Arch:           linux/arm64
 Experimental:      false

Server:
 Engine:
  Version:          18.06.1-ce
  API version:      1.38 (minimum version 1.12)
  Go version:       go1.10.3
  Git commit:       e68fc7a
  Built:            Tue Aug 21 17:27:20 2018
  OS/Arch:          linux/arm64
  Experimental:     false
```


Test/测试 
`devel-su docker run hello-world` 

This command downloads a test image and runs it in a container. When the container runs, it prints an informational message and exits. / 这个命令会下载一个测试镜像，如果执行成功会打印如下信息

```
[root@Sailfish nemo]# docker run hello-world
Unable to find image 'hello-world:latest' locally
latest: Pulling from library/hello-world
255483503861: Pull complete 
Digest: sha256:4b8ff392a12ed9ea17784bd3c9a8b1fa3299cac44aca35a85c90c5e3c7afacdc
Status: Downloaded newer image for hello-world:latest

Hello from Docker!
This message shows that your installation appears to be working correctly.

To generate this message, Docker took the following steps:
 1. The Docker client contacted the Docker daemon.
 2. The Docker daemon pulled the "hello-world" image from the Docker Hub.
    (arm64v8)
 3. The Docker daemon created a new container from that image which runs the
    executable that produces the output you are currently reading.
 4. The Docker daemon streamed that output to the Docker client, which sent it
    to your terminal.

To try something more ambitious, you can run an Ubuntu container with:
 $ docker run -it ubuntu bash

Share images, automate workflows, and more with a free Docker ID:
 https://hub.docker.com/

For more examples and ideas, visit:
 https://docs.docker.com/engine/userguide/
```



## Test network mapping /测试网络映射

On one terminal/在一个终端中执行
```
[root@Sailfish nemo]# docker run -it --rm -p 6080:80 nginx:latest        
172.17.0.1 - - [05/Sep/2018:08:54:52 +0000] "GET / HTTP/1.1" 200 612 "-" "curl/7.58.0-DEV" "-"
172.17.0.1 - - [05/Sep/2018:08:55:51 +0000] "GET / HTTP/1.1" 200 612 "-" "curl/7.58.0-DEV" "-"
```

Vist on another terminal/在另一个终端中访问
```
[nemo@Sailfish ~]$ curl -s 127.0.0.1:6080
<!DOCTYPE html>
<html>
<head>
<title>Welcome to nginx!</title>
<style>
    body {
        width: 35em;
        margin: 0 auto;
        font-family: Tahoma, Verdana, Arial, sans-serif;
    }
</style>
</head>
<body>
<h1>Welcome to nginx!</h1>
<p>If you see this page, the nginx web server is successfully installed and
working. Further configuration is required.</p>

<p>For online documentation and support please refer to
<a href="http://nginx.org/">nginx.org</a>.<br/>
Commercial support is available at
<a href="http://nginx.com/">nginx.com</a>.</p>

<p><em>Thank you for using nginx.</em></p>
</body>
</html>
[nemo@Sailfish ~]$ 
```

## TODO 

Wayland forward /wayland转发

Reference/参考:
* https://unix.stackexchange.com/questions/330366/how-can-i-run-a-graphical-application-in-a-container-under-wayland
* http://fabiorehm.com/blog/2014/09/11/running-gui-apps-with-docker/


Have fun ;)
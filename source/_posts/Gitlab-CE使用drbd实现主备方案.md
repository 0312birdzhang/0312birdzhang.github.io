---
title: Gitlab CE使用drbd实现主备方案
date: 2021-04-16 16:19:56
tags: [gitlab, drbd]
---

### 痛点

由于Gitlab社区版是不提供高可用等方案的，只能定时备份出来然后出问题了再导入，有时候会丢失数据，而且耗时随着备份文件大小增加，后期维护成本高。

## 解决思路

在搜索了大量的方案之后，只有使用drbd的才是靠谱的，而且比较容易跟现有的结合，值得尝试。

### 安装drbd

这里都是参考了 csdn博主的 https://blog.csdn.net/allway2/article/details/102478719

<details>
<summary>DRBD使用LVM逻辑卷作为后端设备创建XFS文件系统在线添加磁盘扩容操作过程</summary>


#### 0.服务器环境信息

drbd1    192.168.111.132    CentOS 7
drbd2    192.168.111.190    CentOS 7


#### 1、禁用SELinux
在两个节点执行： `# setenforce 0`

##### 永久关闭
可以修改配置文件/etc/selinux/config,将其中SELINUX设置为disabled。

``` 
[root@localhost ~]# cat /etc/selinux/config   
   
# This file controls the state of SELinux on the system.  
# SELINUX= can take one of these three values:  
#     enforcing - SELinux security policy is enforced.  
#     permissive - SELinux prints warnings instead of enforcing.  
#     disabled - No SELinux policy is loaded.  
#SELINUX=enforcing  
SELINUX=disabled  
# SELINUXTYPE= can take one of three two values:  
#     targeted - Targeted processes are protected,  
#     minimum - Modification of targeted policy. Only selected processes are protected.   
#     mls - Multi Level Security protection.  
SELINUXTYPE=targeted

# sestatus  
SELinux status:                 disabled
```

关闭firewall：
```
systemctl stop firewalld.service #停止firewall
systemctl disable firewalld.service #禁止firewall开机启动
```

设置主机名：

```
hostnamectl set-hostname drbd1
hostnamectl set-hostname drbd2
```

#### 2、安装DRBD

在两个节点执行：
```
# rpm --import https://www.elrepo.org/RPM-GPG-KEY-elrepo.org
# rpm -Uvh http://www.elrepo.org/elrepo-release-7.0-3.el7.elrepo.noarch.rpm
# yum install drbd90-utils kmod-drbd90
# lsmod | grep -i drbd
# modprobe drbd
# echo drbd > /etc/modules-load.d/drbd.conf
```

#### 3、配置DRBD

在两个节点执行：
```
# mv /etc/drbd.d/global_common.conf /etc/drbd.d/global_common.conf.orig
# vi /etc/drbd.d/global_common.conf

global {
 usage-count no;
}
common {
 net {
  protocol C;
 }
}


# vi /etc/drbd.d/drbd0.res

resource drbd0 {
        disk /dev/drbdvg/drbdlv;
        device /dev/drbd0;
        meta-disk internal;
        on hostname1 {
                address 192.168.111.132:7789;
        }
        on hostname2 {
                address 192.168.111.190:7789;
        }
}
```

```
# pvcreate /dev/sdb
# vgcreate drbdvg /dev/sdb
# lvcreate -l 100%VG -n drbdlv drbdvg
# lvscan
# drbdadm create-md drbd0

# systemctl start drbd
# drbdadm status
# cat /proc/drbd
```

在主节点执行：
```
# drbdadm primary drbd0 --force

# mkfs.xfs /dev/drbd0
# mount /dev/drbd0 /mnt
# touch /mnt/file{1..5}
# ls -l /mnt/
# df -hT
# vgdisplay
# pvdisplay
# lvdisplay
```
#### 4、在线扩容
在两个节点执行：
```
# lsblk
# pvcreate /dev/sdc
# pvdisplay
# vgdisplay
# vgextend drbdvg /dev/sdc
# lvs
# lvdisplay
# lvextend -l+100%FREE /dev/drbdvg/drbdlv
# lvs
```
等待数据同步完成
```
# watch drbdadm status
```
在主节点执行：
```
# drbdadm resize drbd0

# xfs_growfs /mnt
# df -hT
```
扩容完成，等待扩容数据同步完成
`# watch drbdadm status`

同步完成后可以进行切换测试

在主节点执行：
`# umount /mnt/`

在从节点执行：
```
# mount /dev/drbd0 /mnt
# ls -l /mnt/
# df -hT
# touch /mnt/file{11..15}
# ls -l /mnt/
# umount /mnt
```

在主节点执行：
```
# mount /dev/drbd0 /mnt
# ls -l  /mnt
```
</details>

### 应用到Gitlab

如果已经在运行了，那可以在运行的机器上挂载另外一块硬盘，新开一台机器，这俩作为drbd的主备，将运行的gitlab data数据rsync到drbd管理的那块盘上即可

然后改一下gitlab的data位置，重启一下或者reconfigure一下即可。

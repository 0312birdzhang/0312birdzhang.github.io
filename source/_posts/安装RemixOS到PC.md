---
title: 安装RemixOS到PC
date: 2017-05-26 16:01:48
tags: [android,x86,remix]
---

# ！一定要用UEFI方式启动，前提是64位的

## 下载镜像

https://www.fosshub.com/Remix-OS.html

## 刻录到U盘

解压之后有一个iso文件一个exe文件，推荐用ultraiso安装（用那个exe会把U盘分成三个区。。。有病吗？）

## 修改参数

U盘开机启动之后，选择"Resident/Guest mode"，按TAB键或e键，在命令最后添加"INSTALL=2"，删掉"USB_DATA_PARTITION=1"

接下来系统会安装到硬盘上。

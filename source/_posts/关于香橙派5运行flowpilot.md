---
title: 关于香橙派5运行flowpilot
tags: [rk3588]
toc: true
date: 2023-10-18 10:04:37
---

> 香橙派5是一款使用瑞芯微rk3588的开发板，有3个usb接口（1个type-c和type-a公用，虽然4个其实3个），一个hdmi接口，一个千兆网口，等等

废话不多说，下面是如何安装flowpilot


## 前置条件

* 起码一个usb摄像头
* 一块屏幕，HDMI的或者mipi dsi的都行
* 其他的就是能让Ubuntu系统启动所必须的硬件了，如硬盘或emmc或sd卡，散热装置等


## 安装系统

这里我使用的是 https://github.com/Joshua-Riek/ubuntu-rockchip

如果你是用sd卡，那么只需要把系统dd进去即可
其他的参考官方的烧录方法，此处不赘述

## 安装flowpilot

这里基本是按照 https://github.com/flowdriveai/flowpilot/wiki/Installation 方法进行的，除此之外还要安装一些额外的包

```
sudo apt install ffmpeg libavformat-dev libavcodec-dev libswscale-dev \
libssl-dev libcurl4-openssl-dev ocl-icd-opencl-dev libgflags-dev \
libstdc++-12-dev libprotobuf-dev protobuf-compiler 
```

源码可以参考我更改的fork https://github.com/0312birdzhang/flowpilot ，主要修改了一些兼容性，以及替换了opencl为系统自带的,还有就是编译了aarch64上面的几个libraries

配置摄像头和车型，更改 `launch_flowpilot_new.sh`，进入flowpilot的目录下，运行`pipenv shell`，然后执行`launch_flowpilot_new.sh`即可

## 体验

总体来说只能说跑起来了，离日常使用还比较遥远，例如设备发热严重（没有用到rknpu，使用tnn跑性能差点，需要写JNI来调用rknpu跑，暂时没精力研究这部分了）、还没有驾驶员监控、上游进度缓慢等等，所以我也转向原生openpilot上了。

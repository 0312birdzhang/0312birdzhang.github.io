---
title: awk 计算一列的和
date: 2017-05-31 11:46:07
tags: [unix]
---

`awk '{sum += $10};END {print sum}'`

例如想计算nginx日志中206下载总数据和，则用
`cat xxx.access.log|grep " 206 " |awk '{sum += $10};END {print sum}'`
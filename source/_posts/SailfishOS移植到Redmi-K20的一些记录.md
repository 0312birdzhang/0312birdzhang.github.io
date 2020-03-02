---
title: SailfishOS移植到Redmi_K20的一些记录
date: 2019-12-30 11:33:17
tags: [sailfish,redmi,davinci,hadk,k20,lineage-16.0,hybris-16.0,xiaomi,9t]
---

源码地址：https://github.com/sailfish-on-davinci

真机演示：https://www.youtube.com/watch?v=J_3RLota6pY

K20出厂即是Android Pie系统，与其他升级上去的不一样，需要做一些处理

禁用boot校验 avb，然后才可以刷
`fastboot --disable-verity --disable-verification flash vbmeta vbmeta.img`

vbmeta.img 从底包里面提取

... 未完待续
---
title: 记录一次Signal使用代理的过程
tags: [signal]
toc: true
date: 2022-12-08 10:14:46
---

在网上找了很多方法，按照传统的思路，在cmd里面设置如下命令然后启动

```
set HTTP_PROXY=http://127.0.0.1:1081
set HTTPS_PROXY=http://127.0.0.1:1081
```

结果并不行，然后我发现了这个 https://github.com/signalapp/Signal-Desktop/pull/1855

```
set HTTPS_PROXY=http://127.0.0.1:1081
set WSS_PROXY=http://127.0.0.1:1081
set ALL_PROXY=http://127.0.0.1:1081
```

然后将Signal.exe拖进cmd，enter后就可以正常了。
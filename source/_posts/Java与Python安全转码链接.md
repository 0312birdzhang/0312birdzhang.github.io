---
title: Java与Python安全转码链接
date: 2017-08-21 18:26:45
tags: Java,Python
---

### Java

```
String OriginUrl = "https://meijumao.cn/yunparse/index.php?url=//美剧/周一/GOT权游/S07/Online/02按时发达的十分.mp4~bdyun";
URL repoUrl = new URL(OriginUrl);
URI uri;
try {
    uri = new URI(repoUrl.getProtocol(), repoUrl.getUserInfo(), repoUrl.getHost(), repoUrl.getPort(), repoUrl.getPath(), repoUrl.getQuery(), repoUrl.getRef());
    System.out.println(uri.toASCIIString());
} catch (URISyntaxException e) {
}
```

### Python

python3:
```
import string
import urllib.parse

url = "https://meijumao.cn/yunparse/index.php?url=//美剧/周一/GOT权游/S07/Online/02按时发达的十分.mp4~bdyun"
print(urllib.parse.quote(url,safe=string.printable))

```

python2:
```
import string
from urllib import quote

url = "https://meijumao.cn/yunparse/index.php?url=//美剧/周一/GOT权游/S07/Online/02按时发达的十分.mp4~bdyun"
print urllib.parse.quote(url,safe=string.printable)

```

结果 `'https://meijumao.cn/yunparse/index.php?url=//%E7%BE%8E%E5%89%A7/%E5%91%A8%E4%B8%80/GOT%E6%9D%83%E6%B8%B8/S07/Online/02%E6%8C%89%E6%97%B6%E5%8F%91%E8%BE%BE%E7%9A%84%E5%8D%81%E5%88%86.mp4~bdyun`
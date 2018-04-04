---
title: 用Python抓取王垠的博客
date: 2017-05-24 17:22:42
tags: python2
---

## 直接上代码（~~由于他博客是异步的，所以我们要用mechanize~~）

```
#!/usr/bin/env python
# -*- coding: utf-8 -*-
'''
Created on 2017年5月24日

@author: BirdZhang
'''
from bs4 import BeautifulSoup
import mechanize
import cookielib
from wyblog import BLOG_URL

class NoHistory(object): 
    def add(self, *a, **k): pass 
    def clear(self): pass 
    
def getBrowers():
    br = mechanize.Browser(history=NoHistory())
    #options
    br.set_handle_equiv(True)
    #br.set_handle_gzip(True)
    br.set_handle_redirect(True)
    br.set_handle_referer(True)
    br.set_handle_robots(False)
    cj = cookielib.LWPCookieJar()  
    br.set_cookiejar(cj)##关联cookies  
    br.set_handle_refresh(mechanize._http.HTTPRefreshProcessor(), max_time=1)
    br.set_debug_http(False)
    br.set_debug_redirects(False)
    br.set_debug_responses(False)
    br.addheaders = [("User-agent","Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2883.87 Safari/537.36")]
    return br

            
if __name__ == "__main__":
    br = getBrowers()
    r = br.open(BLOG_URL)
    html = r.read()
#     print html
    soup = BeautifulSoup(html,"html5lib")
    lis = soup.find_all(name='li',attrs={
                                               "class":"list-group-item title"
                                               })
    for i in lis:
        print i.a["href"]," ".join(i.a.contents)
```        

剩下的自己该干嘛干嘛吧


### 后面干脆撸了一个旗鱼的客户端

https://github.com/0312birdzhang/harbour-blogofwy
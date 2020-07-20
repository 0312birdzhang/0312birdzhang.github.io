---
title: Nginx获取用户真实IP
date: 2018-09-12 11:10:54
tags: [nginx,openresty]
categories: [Nginx]
---

首先强调的是，这里需要两层nginx，用户访问nginx1，转发到nginx2(192.168.1.111)，nginx2到真实后端。

### nginx1 配置

```
server{
    ...
    listen 8888;
    location /test {
        proxy_set_header Host $http_host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forward-For $remote_addr;
        proxy_pass http://nginx2:8888/test2;
    }
}
```


### nginx2 配置

```
server{
    ...
    listen 8888;
    location /test2 {
        proxy_set_header  X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header  X-real-ip $remote_addr;
        default_type text/html;
        return 200 'This is text!';
    }
```

### 测试

用户访问
```
curl -i -H "X-Forwarded-For: 110.110.110.110" -H "X-real-ip: 110.110.110.110" -s nginx1:8888/test -v
```

nginx1 日志：
```
192.168.1.110 0.000 - [12/Sep/2018:11:01:51 +0800] "GET /test HTTP/1.1" 200 13 - "-" "curl/7.19.7 (x86_64-redhat-linux-gnu) libcurl/7.19.7 NSS/3.19.1 Basic ECC zlib/1.2.3 libidn/1.18 libssh2/1.4.2" 110.110.110.110 110.110.110.110
```

nginx2 日志：
```
192.168.1.111 0.000 - [12/Sep/2018:11:01:51 +0800] "GET /test2 HTTP/1.1" 200 13 - "-" "curl/7.19.7 (x86_64-redhat-linux-gnu) libcurl/7.19.7 NSS/3.19.1 Basic ECC zlib/1.2.3 libidn/1.18 libssh2/1.4.2" 192.168.1.110 110.110.110.110
```
其中192.168.1.111为nginx1的ip

可以看到，在nginx2中可以拿`X-real-ip`获取用户的真实ip，在后端中可以拿这个头信息。

**注意！必须要规定好nginx是在架构的哪一层级，根据所处的层级配置，否则该方法无效。**
---
title: 使用openresty搭一个类似ip.cn的接口
date: 2018-06-05 10:25:52
tags: [openresty,ip]
---


### Openresty是什么

OpenResty® 是一个基于 Nginx 与 Lua 的高性能 Web 平台，其内部集成了大量精良的 Lua 库、第三方模块以及大多数的依赖项。用于方便地搭建能够处理超高并发、扩展性极高的动态 Web 应用、Web 服务和动态网关。

官网 https://openresty.org/cn/

Openresty解决了nginx不能很好的添加一些逻辑判断的痛点，而且又不失性能。

### 接口代码

代码简单到不能再简单了，就三行

```lua
local ip = ngx.var.remote_addr
ngx.header["Content-Type"] = "text/plain charset=utf-8"
ngx.say(ip)
```

##### nginx.conf配置：

```
...
http
{
    ...
    lua_package_path "/usr/local/openresty/script/waf/?.lua;/usr/local/openresty/lualib/?.lua";
    ...

```
#### vhost配置

```
server
{
        listen       80;
        server_name ip.testing.cn;
        index index.html index.htm index.php;
        charset utf-8;
# 原生nginx的方式，貌似更简单...        
#        location / {
#                default_type text/plain;
#                return 200 $remote_addr;
#        }
        location /{
            content_by_lua_block {
                local ip = ngx.var.remote_addr
                ngx.header["Content-Type"] = "text/plain charset=utf-8"
                ngx.say(ip)
            }
        }

}
```
---
title: 使用Openresty将pastebin内容格式化显示
date: 2018-06-25 15:09:18
tags: [lua,openresty,nginx,pastebin]
---


#### 前情提要

这里用的 [https://github.com/solusipse/fiche](https://github.com/solusipse/fiche) 的pastebin服务端，功能不多但是贴一些代码或者日志足够了


#### 痛点

fiche将贴的内容保存为文件，然后用nginx显示，如下：
```
server {
    listen 80;
    server_name mysite.com www.mysite.com;
    charset utf-8;

    location / {
            root /home/www/code/;
            index index.txt index.html;
    }
}
```
这样显示出来的文本在行数多的时候就看瞎眼了 @_@


#### 解决痛点

我们可以用openresty将要显示的文本提前拼凑成html，html中用google的code prettify格式化处理。
对于用curl请求的我们不做处理，直接返回纯文本。

lua代码如下：

```lua
local headers = ngx.req.get_headers()
local reqUri = ngx.var.request_uri
local uri = ngx.var.uri
local userAgent = headers["user-agent"]
local codePath = "/data/fiche/code"

if uri == "/" then
  ngx.say("Welcome to p.qiyuos.cn")
  ngx.exit(200)
end

if uri == "/favicon.ico" then
  ngx.exit(200)
end

local function file_exists(path)
  local file = io.open(path, "rb")
  if file then file:close() end
  return file ~= nil
end

--读取文件到内存
local function readFile2Mem(file)
  local fp = io.open(file,"r")
  if fp then
    return fp:read("*all")
  end
end

local codeBeauty1 = [[
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<script src="https://cdn.bootcss.com/prettify/r298/run_prettify.min.js?autoload=true&amp;lang=html"></script>
<style type="text/css">
body {
  background: #fff;
}
pre.prettyprint {
  background-color: #eee;
}
.prettyprint ol.linenums > li { list-style-type: decimal; }
.pln{color:#000}@media screen{.str{color:#080}.kwd{color:#008}.com{color:#800}.typ{color:#606}.lit{color:#066}.clo,.opn,.pun{color:#660}.tag{color:#008}.atn{color:#606}.atv{color:#080}.dec,.var{color:#606}.fun{color:red}}@media print,projection{.kwd,.tag,.typ{font-weight:700}.str{color:#060}.kwd{color:#006}.com{color:#600;font-style:italic}.typ{color:#404}.lit{color:#044}.clo,.opn,.pun{color:#440}.tag{color:#006}.atn{color:#404}.atv{color:#060}}pre.prettyprint{padding:2px;border:1px solid #888}ol.linenums{margin-top:0;margin-bottom:0}li.L0,li.L1,li.L2,li.L3,li.L5,li.L6,li.L7,li.L8{list-style-type:none}li.L1,li.L3,li.L5,li.L7,li.L9{background:#eee}
</style>
</head>
<body>
<pre class="prettyprint linenums" id="quine">
]]
local codeBeauty2 = [[
</pre>
<script type="text/javascript">//<![CDATA[
(function () {
  function htmlEscape(s) {
    return s;
//      .replace(/&/g, '&amp;')
//      .replace(/</g, '&lt;')
//      .replace(/>/g, '&gt;');
  }
  // this page's own source code
  var quineHtml = htmlEscape(
    document.getElementById("quine").innerHTML
  );
  // Highlight the operative parts:
  quineHtml = quineHtml.replace(
    /&lt;script src[\s\S]*?&gt;&lt;\/script&gt;|&lt;!--\?[\s\S]*?--&gt;|&lt;pre\b[\s\S]*?&lt;\/pre&gt;/g,
    '<span class="operative">$&<\/span>');
  // insert into PRE
  document.getElementById("quine").innerHTML = quineHtml;
})();
//\]\]>
</script>
</body>
</html>
]]

if not file_exists(codePath .. uri .. "/index.txt") then
  ngx.exit(404)
end

local paste = readFile2Mem(codePath .. uri .. "/index.txt")
if not userAgent or string.len(userAgent) < 20 or not string.match(userAgent, "Mozilla") then
  ngx.say(paste)
  ngx.exit(200)
else
  ngx.say(codeBeauty1 .. paste .. codeBeauty2)
  ngx.exit(200)
end
```

nginx 配置如下：
```
server {
    listen 80;
    server_name mysite.com www.mysite.com;
    charset utf-8;
    location / {
        default_type text/html;
        content_by_lua_file "/usr/local/openresty/scripts/fiche.lua";
    }
}
```



#### 最后

代码还不完善，可能存在一些bug，欢迎提出
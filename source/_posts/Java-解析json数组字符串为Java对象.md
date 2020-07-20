---
title: Java 解析json数组字符串为Java对象
date: 2017-06-02 17:57:21
tags: [Java,json]
categories: [Java]
---

套用罗锤子的话：这可能是最方便快捷的方式了


json字符串：
```
[{ "number" : "3",
  "title" : "hello_world"  
},
{ "number" : "2",
  "title" : "hello_world"  
}]
```

Java代码：
```
class Wrapper{
    int number;
    String title;       
}

Gson gson = new Gson();
Wrapper[] data = gson.fromJson(idcstring, Wrapper[].class);
```
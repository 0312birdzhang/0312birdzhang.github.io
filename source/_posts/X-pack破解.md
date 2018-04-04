---
title: X-pack破解
---

> 原文链接：http://blog.csdn.net/mvpboss1004/article/details/65445023


### 5.4.2版本也适用

[首先完成原版X-Pack在Elastic上的安装。](http://blog.csdn.net/mvpboss1004/article/details/65445023)


下载x-pack-5.2.0.zip，找到x-pack-5.2.0.jar。这里使用JD-GUI是无法反编译的，我使用的是[Luyten](https://github.com/deathmarine/Luyten/releases/tag/v0.5.0)进行反编译。


将`org.elasticsearch/license/LicenseVerifier.class`反编译并保存出来。这个类是检查license完整性的类，我们使其始终返回true，就可以任意修改license并导入。将其改为：

```
package org.elasticsearch.license;
 
import java.nio.*;
import java.util.*;
import java.security.*;
import org.elasticsearch.common.xcontent.*;
import org.apache.lucene.util.*;
import org.elasticsearch.common.io.*;
import java.io.*;
 
public class LicenseVerifier
{
    public static boolean verifyLicense(final License license, final byte[] encryptedPublicKeyData) {
        return true;
    }
 
    public static boolean verifyLicense(final License license) {
        return true;
    }
}
```

然后需要重新编译class文件。注意这里我们无需编译整个工程，将原来的x-pack-5.2.0.jar和依赖包加入CLASSPATH，即可完成单个文件的编译。实际上只用到了3个依赖包，如果是用RPM或DEB安装的，直接运行：

`javac -cp "/usr/share/elasticsearch/lib/elasticsearch-5.2.0.jar:/usr/share/elasticsearch/lib/lucene-core-6.4.0.jar:/usr/share/elasticsearch/plugins/x-pack/x-pack-5.2.0.jar" LicenseVerifier.java`

如果是windows，只需要将xpack解压后的elasticsearch里面的jar包跟上述三个jar放在同一目录下，运行 `javac -cp ".;*" LicenseVerifier.java` 即可

把x-pack-5.2.0.jar解压到x-pack-5.2.0目录，替换org/elasticsearch/license/LicenseVerifier.class文件，在x-pack-5.2.0目录执行下面的命令打包

`jar cvf x-pack-5.2.0.jar .`

申请一个免费[license](https://license.elastic.co/registration)。下载后修改，例如：

```
{"license":{"uid":"9a33d9f0-7243-44d1-9baf-ee2d39e50c64","type":"platinum","issue_date_in_millis":1488931200000,"expiry_date_in_millis":2690553599999,"max_nodes":100,"issued_to":"tsupport tsupport (flamingo)","issuer":"Web Form","signature":"AAAAAwAAAA37v5DFf/zOWhGDrRslAAABmC9ZN0hjZDBGYnVyRXpCOW5Bb3FjZDAxOWpSbTVoMVZwUzRxVk1PSmkxaktJRVl5MUYvUWh3bHZVUTllbXNPbzBUemtnbWpBbmlWRmRZb25KNFlBR2x0TXc2K2p1Y1VtMG1UQU9TRGZVSGRwaEJGUjE3bXd3LzRqZ05iLzRteWFNekdxRGpIYlFwYkJiNUs0U1hTVlJKNVlXekMrSlVUdFIvV0FNeWdOYnlESDc3MWhlY3hSQmdKSjJ2ZTcvYlBFOHhPQlV3ZHdDQ0tHcG5uOElCaDJ4K1hob29xSG85N0kvTWV3THhlQk9NL01VMFRjNDZpZEVXeUtUMXIyMlIveFpJUkk2WUdveEZaME9XWitGUi9WNTZVQW1FMG1DenhZU0ZmeXlZakVEMjZFT2NvOWxpZGlqVmlHNC8rWVVUYzMwRGVySHpIdURzKzFiRDl4TmM1TUp2VTBOUlJZUlAyV0ZVL2kvVk10L0NsbXNFYVZwT3NSU082dFNNa2prQ0ZsclZ4NTltbU1CVE5lR09Bck93V2J1Y3c9PQAAAQB7t2MGynWa4RAJdpnxI/oqz8BGcikZAv9eqCRgB7BIeT/TGKwep9Q3/aQtlO7mHNGOJWiXKBh13MJezlcioV5aD+gCfv897IytifaDS9ZUx4gtQwYoxtBkX3npQpQpqTEeLghqu3+/uJLEAHWCebmIJgjWWICNNs49ec076FDQmOGHnjA9MCLjBtbDGPqG/nYslDRpvROsirhKoVsm8ozY+yGjLsq2cfDJazaAgy/L6/QZPoeB+M44vTfwA02VJemGONqm9s7mavHdL0NElwGljlcxU4HAS7TbX3K4sJclFDrl4aVd00zqndDjdgKM1WHmVy11PboQGXwMKHqioSRt","start_date_in_millis":1488931200000}}
```

这里，platinum表示白金版，可以使用所有功能。其他的如expiry_date_in_millis、max_nodes等根据自己需要修改即可。

把该license导入集群即可，破解结果如下： (图就不贴了)
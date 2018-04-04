---
title: Tomcat信任https网站
---


## 在使用微信发送告警的时候出现无法使用https网址的问题，解决方式如下
 
### 导出微信的证书
 
`openssl s_client -connect qyapi.weixin.qq.com:443 2>&1 |sed -ne '/-BEGIN CERTIFICATE-/,/-END CERTIFICATE-/p' > weixin.crt`
 
使用<a href="/files/SSLPoke.class">SSLPoke.class</a>确认是否还有上层证书，如果存在也导入

`java -Djavax.net.debug=ssl  SSLPoke qyapi.weixin.qq.com 443`

看到有类似下面的则表明有上层证书:

```
AuthorityInfoAccess [
  [
   accessMethod: ocsp
   accessLocation: URIName: http://gn.symcd.com
,
   accessMethod: caIssuers
   accessLocation: URIName: http://gn.symcb.com/gn.crt
]
]
```

将http://gn.symcb.com/gn.crt下载下来，并导入
`sudo keytool -import -v -trustcacerts -alias gnsymcb -keystore $JAVA_HOME/jre/lib/security/jssecacerts -file gn.crt`


### 导入到jdk中
`sudo keytool -import -v -trustcacerts -alias qyapiweixin -keystore $JAVA_HOME/jre/lib/security/jssecacerts -file weixin.crt`

### 更新证书

需要先删除再导入新的
```
sudo keytool -delete -keystore $JAVA_HOME/jre/lib/security/cacerts -alias qyapiweixin    
sudo keytool -import -v -trustcacerts -alias qyapiweixin -keystore $JAVA_HOME/jre/lib/security/cacerts -file weixin.crt
```
 
### 指定tomcat使用证书(非必须)

```
vim /usr/local/apache-tomcat-8.5.6/bin/setenv.sh
JAVA_OPTS="-Djava.awt.headless=true -Dfile.encoding=UTF-8 -server -Xms2048m -Xmx2048m -XX:NewSize=512m -XX:MaxNewSize=512m -XX:PermSize=512m -XX:MaxPermSize=512m -XX:+DisableExplicitGC -Djavax.net.ssl.trustStore=/usr/local/java/jdk8/jre/lib/security/jssecacerts"
```

或者在 /usr/local/apache-tomcat-8.5.6/conf/server.xml的ssl配置部分指定keystore，如下

```
<Connector port="443" protocol="org.apache.coyote.http11.Http11Protocol"
              maxThreads="150" SSLEnabled="true" scheme="https" secure="true"
              clientAuth="false" sslProtocol="TLS"
              URIEncoding="utf-8"
              keystoreFile="/usr/local/java/jdk7/jre/lib/security/jssecacerts"
              keystorePass="flamingo@1"
              />
``` 

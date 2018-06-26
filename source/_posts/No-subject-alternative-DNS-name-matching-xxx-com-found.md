---
title: No subject alternative DNS name matching xxx.com found
date: 2018-06-26 13:56:40
tags: cas,java,https,crt
---

[TOC]

#### 故事经过 TLDR;

故事太长，可以直接看[这里](#解决方法) 解决

昨天下午，突然有同事说OA打不开了，打开页面一看出现如下错误：

```
500 Servlet Exception
[show] java.security.cert.CertificateException: No subject alternative DNS name
matching xxx.com found.

java.lang.RuntimeException: javax.net.ssl.SSLHandshakeException: java.security.cert.CertificateException:
No subject alternative DNS name matching xxx.com found.
	at org.jasig.cas.client.util.CommonUtils.getResponseFromServer(CommonUtils.java:328)
	at org.jasig.cas.client.util.CommonUtils.getResponseFromServer(CommonUtils.java:291)
	at org.jasig.cas.client.validation.AbstractCasProtocolUrlBasedTicketValidator.retrieveResponseFromServer(AbstractCasProtocolUrlBasedTicketValidator.java:32)
	at org.jasig.cas.client.validation.AbstractUrlBasedTicketValidator.validate(AbstractUrlBasedTicketValidator.java:187)
	at org.jasig.cas.client.validation.AbstractTicketValidationFilter.doFilter(AbstractTicketValidationFilter.java:164)
	at com.caucho.server.dispatch.FilterFilterChain.doFilter(FilterFilterChain.java:87)
	at com.xxx.plugin.AuthenticationFilter.doFilter(AuthenticationFilter.java:163)
	at com.caucho.server.dispatch.FilterFilterChain.doFilter(FilterFilterChain.java:87)
	at org.jasig.cas.client.session.SingleSignOutFilter.doFilter(SingleSignOutFilter.java:65)
	at com.caucho.server.dispatch.FilterFilterChain.doFilter(FilterFilterChain.java:87)
	at com.caucho.server.webapp.WebAppFilterChain.doFilter(WebAppFilterChain.java:187)
	at com.caucho.server.dispatch.ServletInvocation.service(ServletInvocation.java:265)
	at com.caucho.server.http.HttpRequest.handleRequest(HttpRequest.java:273)
	at com.caucho.server.port.TcpConnection.run(TcpConnection.java:682)
	at com.caucho.util.ThreadPool$Item.runTasks(ThreadPool.java:730)
	at com.caucho.util.ThreadPool$Item.run(ThreadPool.java:649)
	at java.lang.Thread.run(Thread.java:662)
Caused by: javax.net.ssl.SSLHandshakeException: java.security.cert.CertificateException:
No subject alternative DNS name matching xxx.com found.
	at com.sun.net.ssl.internal.ssl.Alerts.getSSLException(Alerts.java:174)
	at com.sun.net.ssl.internal.ssl.SSLSocketImpl.fatal(SSLSocketImpl.java:1699)
	at com.sun.net.ssl.internal.ssl.Handshaker.fatalSE(Handshaker.java:241)
	at com.sun.net.ssl.internal.ssl.Handshaker.fatalSE(Handshaker.java:235)
```

内心中第一反应是证书的问题，于是赶紧上cas服务器查看日志，一切正常😵
然后上OA的服务器，将证书导入，重启服务，该是什么错还是什么错。。。

上谷歌一查，应该是匹配不到证书里的DNS名，但是确实是有的呀。

由于还有其他java系统接入了CAS登录，都是正常的，于是开始怀疑是OA那台的有问题，开始查看是不是有人最近改动过什么

然鹅并没有。。。

然后查看OA的日志（用的Resin中间件。。。
发现如下错误：

```
[17:00:15.288] {http--8080-6$1533061820} java.lang.RuntimeException: javax.net.ssl.SSLHandshakeException: java.security.cert.CertificateException: No subject alternative DNS name matching auth.corp.flamingo-inc.com found.
[17:00:15.288] {http--8080-6$1533061820} 	at org.jasig.cas.client.util.CommonUtils.getResponseFromServer(CommonUtils.java:295)
[17:00:15.288] {http--8080-6$1533061820} 	at org.jasig.cas.client.validation.AbstractCasProtocolUrlBasedTicketValidator.retrieveResponseFromServer(AbstractCasProtocolUrlBasedTicketValidator.java:33)
[17:00:15.288] {http--8080-6$1533061820} 	at org.jasig.cas.client.validation.AbstractUrlBasedTicketValidator.validate(AbstractUrlBasedTicketValidator.java:178)
[17:00:15.288] {http--8080-6$1533061820} 	at org.jasig.cas.client.validation.AbstractTicketValidationFilter.doFilter(AbstractTicketValidationFilter.java:132)
[17:00:15.288] {http--8080-6$1533061820} 	at com.caucho.server.dispatch.FilterFilterChain.doFilter(FilterFilterChain.java:87)
[17:00:15.288] {http--8080-6$1533061820} 	at com.xxx.plugin.AuthenticationFilter.doFilter(AuthenticationFilter.java:163)
[17:00:15.288] {http--8080-6$1533061820} 	at com.caucho.server.dispatch.FilterFilterChain.doFilter(FilterFilterChain.java:87)
[17:00:15.288] {http--8080-6$1533061820} 	at org.jasig.cas.client.session.SingleSignOutFilter.doFilter(SingleSignOutFilter.java:110)
[17:00:15.288] {http--8080-6$1533061820} 	at com.caucho.server.dispatch.FilterFilterChain.doFilter(FilterFilterChain.java:87)
[17:00:15.288] {http--8080-6$1533061820} 	at com.caucho.server.webapp.WebAppFilterChain.doFilter(WebAppFilterChain.java:187)
[17:00:15.288] {http--8080-6$1533061820} 	at com.caucho.server.dispatch.ServletInvocation.service(ServletInvocation.java:265)
[17:00:15.288] {http--8080-6$1533061820} 	at com.caucho.server.http.HttpRequest.handleRequest(HttpRequest.java:273)
[17:00:15.288] {http--8080-6$1533061820} 	at com.caucho.server.port.TcpConnection.run(TcpConnection.java:682)
[17:00:15.288] {http--8080-6$1533061820} 	at com.caucho.util.ThreadPool$Item.runTasks(ThreadPool.java:730)
[17:00:15.288] {http--8080-6$1533061820} 	at com.caucho.util.ThreadPool$Item.run(ThreadPool.java:649)
[17:00:15.288] {http--8080-6$1533061820} 	at java.lang.Thread.run(Thread.java:662)
[17:00:15.288] {http--8080-6$1533061820} Caused by: javax.net.ssl.SSLHandshakeException: java.security.cert.CertificateException: No subject alternative DNS name matching auth.corp.flamingo-inc.com found.
[17:00:15.288] {http--8080-6$1533061820} 	at com.sun.net.ssl.internal.ssl.Alerts.getSSLException(Alerts.java:174)
[17:00:15.288] {http--8080-6$1533061820} 	at com.sun.net.ssl.internal.ssl.SSLSocketImpl.fatal(SSLSocketImpl.java:1699)
[17:00:15.288] {http--8080-6$1533061820} 	at com.sun.net.ssl.internal.ssl.Handshaker.fatalSE(Handshaker.java:241)
[17:00:15.288] {http--8080-6$1533061820} 	at com.sun.net.ssl.internal.ssl.Handshaker.fatalSE(Handshaker.java:235)
[17:00:15.288] {http--8080-6$1533061820} 	at com.sun.net.ssl.internal.ssl.ClientHandshaker.serverCertificate(ClientHandshaker.java:1206)
[17:00:15.288] {http--8080-6$1533061820} 	at com.sun.net.ssl.internal.ssl.ClientHandshaker.processMessage(ClientHandshaker.java:136)
[17:00:15.288] {http--8080-6$1533061820} 	at com.sun.net.ssl.internal.ssl.Handshaker.processLoop(Handshaker.java:593)
[17:00:15.288] {http--8080-6$1533061820} 	at com.sun.net.ssl.internal.ssl.Handshaker.process_record(Handshaker.java:529)
[17:00:15.288] {http--8080-6$1533061820} 	at com.sun.net.ssl.internal.ssl.SSLSocketImpl.readRecord(SSLSocketImpl.java:893)
[17:00:15.288] {http--8080-6$1533061820} 	at com.sun.net.ssl.internal.ssl.SSLSocketImpl.performInitialHandshake(SSLSocketImpl.java:1138)
[17:00:15.288] {http--8080-6$1533061820} 	at com.sun.net.ssl.internal.ssl.SSLSocketImpl.startHandshake(SSLSocketImpl.java:1165)
[17:00:15.288] {http--8080-6$1533061820} 	at com.sun.net.ssl.internal.ssl.SSLSocketImpl.startHandshake(SSLSocketImpl.java:1149)
[17:00:15.288] {http--8080-6$1533061820} 	at sun.net.www.protocol.https.HttpsClient.afterConnect(HttpsClient.java:434)
[17:00:15.288] {http--8080-6$1533061820} 	at sun.net.www.protocol.https.AbstractDelegateHttpsURLConnection.connect(AbstractDelegateHttpsURLConnection.java:166)
[17:00:15.288] {http--8080-6$1533061820} 	at sun.net.www.protocol.http.HttpURLConnection.getInputStream(HttpURLConnection.java:1172)
[17:00:15.288] {http--8080-6$1533061820} 	at sun.net.www.protocol.https.HttpsURLConnectionImpl.getInputStream(HttpsURLConnectionImpl.java:234)
[17:00:15.288] {http--8080-6$1533061820} 	at org.jasig.cas.client.util.CommonUtils.getResponseFromServer(CommonUtils.java:281)
[17:00:15.288] {http--8080-6$1533061820} 	... 15 more
[17:00:15.288] {http--8080-6$1533061820} Caused by: java.security.cert.CertificateException: No subject alternative DNS name matching auth.corp.flamingo-inc.com found.
[17:00:15.288] {http--8080-6$1533061820} 	at sun.security.util.HostnameChecker.matchDNS(HostnameChecker.java:193)
[17:00:15.288] {http--8080-6$1533061820} 	at sun.security.util.HostnameChecker.match(HostnameChecker.java:77)
[17:00:15.288] {http--8080-6$1533061820} 	at com.sun.net.ssl.internal.ssl.X509TrustManagerImpl.checkIdentity(X509TrustManagerImpl.java:264)
[17:00:15.288] {http--8080-6$1533061820} 	at com.sun.net.ssl.internal.ssl.X509TrustManagerImpl.checkServerTrusted(X509TrustManagerImpl.java:250)
[17:00:15.288] {http--8080-6$1533061820} 	at com.sun.net.ssl.internal.ssl.ClientHandshaker.serverCertificate(ClientHandshaker.java:1185)
```


开始怀疑是我写的AuthenticationFilter的锅，于是用了个新版本的cas-client-core，依然不行

开始升级jdk，由于是windows，直接安装的exe，然后改了启动脚本里面的JAVA_HOME，重启依然发现不行。。。 (((φ(◎ロ◎;)φ)))

于是暂时回退到了没有用CAS接入的版本，下班了。。。


今天回来不甘心啊，继续尝试解决

既然证书找不到xxx.com，那我换台nginx直接写host试试？

更新了一下测服nginx的证书，OA主机指定测服nginx ip

然后！！！！ 可以了！！！！ 😭

然后跟同事调试了一会，发现他昨天下午添加了一个域名abc.com，然后导致了default_server不是adc.com了。。。



#### 解决方法

更新一下jdk就可以了（摊手），OA用的是jdk1.6，jdk1.6旧版本不支持SNI，至于什么是SNI等，看这里 https://github.com/ditunes/blog/issues/13

之前没成功是因为windows的服务里面写死了jdk的路径。。。
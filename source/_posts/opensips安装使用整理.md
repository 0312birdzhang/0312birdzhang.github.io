---
title: opensips安装使用整理
date: 2018-01-29 16:36:17
tags: opensips,voip,sip
---

> 部分内容来自 https://github.com/Ci-Jie/OpenSIPS ，其他的很多教程都是坑！！！

## 安装opensips

* CentOS release 6.9 (Final) (内核 4.10.4)
* MySQL 5.6
* Opensips 2.1

#### 安装依赖库等

`sudo yum -y install mysql mysql-server mysql-devel git make bison libdbi-dbd-mysql` (具体还有什么忘记了，不能重现当时安装的了，后面缺什么再装吧)

#### 检出代码

`cd ~/ && git clone https://github.com/OpenSIPS/opensips.git -b 2.1 opensips_2_1`

#### 修改配置开启mysql支持

`vim ~/opensips_2_1/Makefile.conf.tmplate` ,移除`exclude_modules`中db_mysql

#### 安装opensips

```bash
cd ~/opensips_2_1
sudo make all
sudo make install
```

#### 安裝完后，修改部分opensipsctlrc文件，如下：

`sudo vim /usr/local/etc/opensips/opensipsctlrc`

将DB开头的修改为自己的mysql连接情况（事先创建好opensips用户，或者偷懒用root，但是一定要注意安全），SIP_DOMAIN修改为主机ip
```
## your SIP domain
SIP_DOMAIN=yourip
## chrooted directory
# $CHROOT_DIR="/path/to/chrooted/directory"
## database type: MYSQL, PGSQL, ORACLE, DB_BERKELEY, or DBTEXT, 
## by default none is loaded
# If you want to setup a database with opensipsdbctl, you must at least specify
# this parameter.
DBENGINE=MYSQL
## database host
DBHOST=localhost
## database name (for ORACLE this is TNS name)
DBNAME=opensips
# database path used by dbtext or db_berkeley
DB_PATH="/usr/local/etc/opensips/dbtext"
## database read/write user
DBRWUSER=opensips
## password for database read/write user
DBRWPW="opensipsrw"
## database super user (for ORACLE this is 'scheme-creator' user)
DBROOTUSER="root"
# user name column
USERCOL="username"
```

#### 初始化mysql数据库表

`sudo /usr/local/sbin/opensipsdbctl create`，会提示输入root密码，然后会出现下面的提示
```
MySQL password for root: 
INFO: test server charset
INFO: creating database opensips ...
INFO: Core OpenSIPS tables succesfully created.
Install presence related tables? (y/n): y  
INFO: creating presence tables into opensips ...
INFO: Presence tables succesfully created.
Install tables for imc cpl siptrace domainpolicy carrierroute userblacklist? (y/n): y
INFO: creating extra tables into opensips ...
INFO: Extra tables succesfully created.
```

> 如果出现 `ERROR: database engine not specified, please setup one in the config script`，看看是否有执行权限


#### 自定义监听端口及协议

可以通过修改`/usr/local/etc/opensips/opensips.cfg`文件，修改`listen=`，注意这里的ip要用外网ip，udp改为tcp可以使用keepalive，让手机长时间在线。我的配置如下：
```
advertised_address=myip
alias=myip
...
listen=tcp:myip:5060   # CUSTOMIZE ME
tcp_connection_lifetime=3600
tcp_connect_timeout=5000
tcp_keepalive=1
tcp_keepcount=30
tcp_keepidle=60
tcp_keepinterval = 60
```


#### 新增domain到数据库

> 这个domain就是上面填写的ip地址，创建用户的时候也要用到。

用root连接mysql，选择opensips库，插入一条记录`INSERT INTO opensips.domain(domain) VALUES('your ip');`(注意修改为自己的ip)


#### opensips操作

启动 `/usr/local/sbin/opensipsctl start`

停止 `/usr/local/sbin/opensipsctl stop`

重启 `/usr/local/sbin/opensipsctl restart`


#### 创建用户

`/usr/local/sbin/opensipsctl add user@myourip password`

这里的user就是号码，尽量用数字（键盘上没有字母啊）

### 客户端

* PC 
  * Zoiper
  * Linphone
* Ios
  * Zoiper

其他未测试，可以到 http://www.voip-info.org/wiki/view/Open+Source+VOIP+Software 查找


#### ios端配置（尽量后台运行）

如图所示：

![微信图片_20180129170327.jpg](https://i.loli.net/2018/01/29/5a6ee3c84b5b4.jpg)
![微信图片_20180129170352.jpg](https://i.loli.net/2018/01/29/5a6ee3c86f20d.jpg)
![微信图片_20180129170357.jpg](https://i.loli.net/2018/01/29/5a6ee3c876295.jpg)
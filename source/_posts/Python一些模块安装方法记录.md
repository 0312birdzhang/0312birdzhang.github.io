---
title: Python一些模块安装方法记录
date: 2017-05-27 17:54:08
tags: python
---

首先需要安装pip模块，如果yum中没有，则需要用 <a href="/files/get-pip.py">get-pip.py</a>安装

`sudo python get-pip.py` 安装

### web.py

`sudo pip install web.py`


### mysql.connector

```
wget http://cdn.mysql.com/Downloads/Connector-Python/mysql-connector-python-1.0.11.zip 
unzip mysql-connector-python-1.0.11.zip 
cd mysql-connector-python-1.0.11  
sudo python setup.py install 
```

### pytds（连接mssql）

```
sudo pip install python-tds
#sudo pip install bitarray
```

### anjuke(中文转拼音)

`sudo pip install pinyin4py`


### Python2.7安装

这样安装之后不会与之前的python2.6版本有冲突，3.x版本同理

```
wget https://www.python.org/ftp/python/2.7.8/Python-2.7.8.tgz
tar xf Python-2.7.8.tgz
cd Python-2.7.8
./configure --prefix=/usr/local
make && make install
```
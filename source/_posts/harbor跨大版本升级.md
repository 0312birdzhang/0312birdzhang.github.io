---
title: harbor跨大版本升级
date: 2019-04-15 10:22:18
tags: [docker,kubernetes,vmvare]
---

**注意：必须是用域名的方式(也就是有内网的dns)，如果以前用ip，则本方法无效！**

Harbor1.2之前的版本不能直接升级到新版本，想要升级到最新版并且业务不中断，可以采用如下方式。

大体流程如下：

B机器搭一个新harbor ->  手动将旧harbor的镜像push到新harbor -> 更改A域名指向到B主机ip ->

   测试B的harbor服务是否正常 -> 铲掉A上的旧harbor  ->  在A上重新搭建harbor  ->  B机器上的harbor同步到A上的harbor 

   测试A的harbor服务是否正常 ->  改回A域名指向A主机 -> 删掉B上的同步。

 

手动push旧harbor镜像到新harbor所用到的脚本：
pip install python_harborclient
get_all.py:

```
#!/usr/bin/python
from registry import RegistryApi
api = RegistryApi('admin', 'password', 'http://pk8stemp02.rmz.flamingo-inc.com:8888')
maxsize = 65536
repos = api.getRepositoryList(maxsize)
repositories = repos.get('repositories')
for repo in repositories:
    tags = api.getTagList(repo).get('tags')
    if tags:
        for tag in tags:
            print(repo + ":" +tag)
```            
```
python get_all.py > all_repos.txt
allimages=$(cat all_repos.txt)
ORIGIN_HOST="pk8snode01.rmz.flamingo-inc.com:8888" #旧harbor
BACK_HOST="pk8stemp02.rmz.flamingo-inc.com:8888" #新harbor
#提前登录一下
#docker login $BACK_HOST
for image in ${allimages}; do
  docker pull ${ORIGIN_HOST}/$image
  docker tag ${ORIGIN_HOST}/$image ${BACK_HOST}/$image
  docker push ${BACK_HOST}/$image
  sleep 1
  echo $image "done"
done
```
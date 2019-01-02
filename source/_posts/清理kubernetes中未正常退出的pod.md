---
title: 清理kubernetes中未正常退出的pod
date: 2018-07-03 11:22:44
tags: [kubernetes,k8s,docker,Terminating]
---

长时间运行的k8s节点可能会存在某些pod不自动退出，一直处于`Terminating`的状态
于是我们可以用这个脚本定时进行清理

```
#!/bin/bash
#############################
### clean terminated pods ###
### run at you own risk ! ###
#############################
export PATH=/usr/local/cfssl/bin:/usr/local/docker/:/usr/local/kubernetes/:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/root/bin
getns(){
  namespaces=`kubectl get namespaces|grep -v "NAME"|awk '{print $1}'`
  for n in ${namespaces};
  do
    pods_str=`kubectl get pods -n ${n}|grep "Terminating"`
    IFS=$'\n' read -rd '' -a pods  <<<"$pods_str"
    if [ -n "$pods" ]; then
      getpod ${n} $pods;
    fi
  done
}
getpod(){
 ns=$1;
 for podinfo in $2;
 do
  pod=`echo $podinfo|awk '{print $1}'`
  delpod $pod $ns;
 done
}
delpod(){
   echo "kubectl delete pods $1 -n $2 --grace-period=0 --force"
   kubectl delete pods $1 -n $2 --grace-period=0 --force
}
main(){
  getns
}
main
```

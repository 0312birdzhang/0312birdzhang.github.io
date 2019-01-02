---
title: 自动清理k8s中的容器、卷、镜像
date: 2017-12-08 17:57:35
tags: [kubernetes,k8s,docker]
---

> 镜像源码 https://github.com/meltwater/docker-cleanup

#### 注意：这个镜像会将所有已经退出的容器、未使用的镜像和data-only的容器，除非你将他们加到保存的变量中。注意正确配置docker api的版本，以免删除所有的镜像。小心挂载 /var/lib/docker，因为如果挂载后没有使用的话，也会被当作未使用的卷删掉。

支持的变量

  * **CLEAN_PERIOD=1800** - Interval in seconds to sleep after completing a cleaning run. Defaults to 1800 seconds = 30 minutes.
  * **DELAY_TIME=1800** - Seconds to wait before removing exited containers and unused images. Defaults to 1800 seconds = 30 minutes.
  * **KEEP_IMAGES** - List of images to avoid cleaning, e.g. "ubuntu:trusty, ubuntu:latest". Defaults to clean all unused images.
  * **KEEP_CONTAINERS** - List of images for exited or dead containers to avoid cleaning, e.g. "ubuntu:trusty, ubuntu:latest".
  * **KEEP_CONTAINERS_NAMED** - List of names for exited or dead containers to avoid cleaning, e.g. "my-container1, persistent-data".
  * **LOOP** - Add the ability to do non-looped cleanups, run it once and exit. Options are true, false. Defaults to true to run it forever in loops.
  * **DEBUG** - Set to 1 to enable more debugging output on pattern matches
  * **DOCKER_API_VERSION** - The docker API version to use. This defaults to 1.20, but you can override it here in case the docker version on your host differs from the one that is installed in this container. You can find  - this on your host system by running `docker version --format '{{.Client.APIVersion}}'`.

对于即使已经不运行了也不想清理的镜像，使用KEEP_IMAGES变量处理，此处我们添写： `vmware/harbor-*:*,*calico:*,*registry:*,*kubernetes-dashboard-amd64:*,*nginx-ingress-controller:*,*cvallance/mongo-k8s-sidecar:*`

docker-cleanup-daemonset.yaml 配置如下：
```
apiVersion: extensions/v1beta1
kind: DaemonSet
metadata:
  labels:
    name: clean-up
  name: clean-up
  namespace: kube-system
spec:
  updateStrategy:
    type: "RollingUpdate"
    rollingUpdate:
      maxUnavailable: 1
  template:
    metadata:
      labels:
        app: clean-up
    spec:
      tolerations:
        - key: "LB"
          operator: "Exists"
          effect: "NoExecute"
      volumes:
        - name: docker-sock
          hostPath:
            path: /var/run/docker.sock
        - name: docker-directory
          hostPath:
            path: /data/kubernetes/docker
      containers:
        - image: meltwater/docker-cleanup:latest
          name: clean-up
          env:
            - name: CLEAN_PERIOD
              value: "1800"
            - name: DELAY_TIME
              value: "60"
            - name: DOCKER_API_VERSION
              value: "1.29"
            - name: KEEP_IMAGES
              value: "vmware/harbor-*:*,*calico:*,*registry:*,*kubernetes-dashboard-amd64:*,*nginx-ingress-controller:*,*cvallance/mongo-k8s-sidecar:*"
          volumeMounts:
            - mountPath: /var/run/docker.sock
              name: docker-sock
              readOnly: false
            - mountPath: /var/lib/docker
              name: docker-directory
              readOnly: false
```
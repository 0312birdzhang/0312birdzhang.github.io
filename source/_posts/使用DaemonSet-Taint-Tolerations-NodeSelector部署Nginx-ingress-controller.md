---
title: 使用DaemonSet+Taint/Tolerations+NodeSelector部署Nginx ingress controller
date: 2017-12-08 17:49:25
tags: [kubernetes,k8s,docker]
---

> 使用DaemonSet+NodeSelector+Tolerations的方式定义Nginx Ingress Controller，给专门节点打上Label+Taint，使得这些专门节点只运行Nginx Ingress Controller，而不会调度和运行其他业务容器，只用来做代理节点。


- 在Kuberntes Cluster中准备N个节点，我们称之为代理节点。在这N个节点上只部署Nginx Ingress Controller（简称NIC）实例，不会跑其他业务容器。

- 给代理节点打上NoExecute Taint，防止业务容器调度或运行在这些节点。

    `kubectl taint nodes 10.8.8.234 LB=NIC:NoExecute`

- 给代理节点打上Label，让NIC只部署在打了对应Lable的节点上。    
    `kubectl label nodes 10.8.8.234 LB=NIC`

- 修改calico-node配置，让calico可以在NoExecute节点上运行

    ```
    spec:
    ...
    spec:
      tolerations:
      - key: "LB"
        operator: "Exists"
        effect: "NoExecute"
    ```    

- 定义DaemonSet Yaml文件，注意加上Tolerations和Node Selector。(注意先创建serviceAccount、role等)    
    
    ```
    apiVersion: extensions/v1beta1
    kind: DaemonSet
    metadata:
    annotations:
        deployment.kubernetes.io/revision: "4"
    labels:
        k8s-app: nginx-ingress-controller
    name: nginx-ingress-controller
    namespace: kube-system
    spec:
    selector:
        matchLabels:
        k8s-app: nginx-ingress-controller
    template:
        metadata:
        annotations:
            prometheus.io/port: "10254"
            prometheus.io/scrape: "true"
        creationTimestamp: null
        labels:
            k8s-app: nginx-ingress-controller
        spec:
        # 加上对应的Node Selector
        nodeSelector:
            LB: NIC
        # 加上对应的Tolerations
        tolerations:
        - key: "LB"
            operator: "Equal"
            value: "NIC"
            effect: "NoExecute"
        containers:
        - args:
            - /nginx-ingress-controller
            - --default-backend-service=$(POD_NAMESPACE)/default-http-backend
            - --tcp-services-configmap=$(POD_NAMESPACE)/nginx-tcp-ingress-configmap
            - --configmap=$(POD_NAMESPACE)/nginx-configuration
            env:
            - name: POD_NAME
            valueFrom:
                fieldRef:
                apiVersion: v1
                fieldPath: metadata.name
            - name: POD_NAMESPACE
            valueFrom:
                fieldRef:
                apiVersion: v1
                fieldPath: metadata.namespace
            image: dceph02.rmz.flamingo-inc.com:8888/mynginx/nginx-ingress-controller:0.9.0-beta.11
            imagePullPolicy: IfNotPresent
            livenessProbe:
            failureThreshold: 3
            httpGet:
                path: /healthz
                port: 10254
                scheme: HTTP
            initialDelaySeconds: 10
            periodSeconds: 10
            successThreshold: 1
            timeoutSeconds: 1
            name: nginx-ingress-controller
            ports:
            - containerPort: 80
            hostPort: 80
            protocol: TCP
            - containerPort: 443
            hostPort: 443
            protocol: TCP
            readinessProbe:
            failureThreshold: 3
            httpGet:
                path: /healthz
                port: 10254
                scheme: HTTP
            periodSeconds: 10
            successThreshold: 1
            timeoutSeconds: 1
            resources: {}
        hostNetwork: true
        serviceAccount: ingress
        serviceAccountName: ingress
        ```
    
- 创建default backend服务

    ```
    apiVersion: extensions/v1beta1
    kind: Deployment
    metadata:
    name: default-http-backend
    labels:
        k8s-app: default-http-backend
    namespace: kube-system
    spec:
    replicas: 1
    template:
        metadata:
        labels:
            k8s-app: default-http-backend
        spec:
        terminationGracePeriodSeconds: 60
        containers:
        - name: default-http-backend
            # Any image is permissable as long as:
            # 1. It serves a 404 page at /
            # 2. It serves 200 on a /healthz endpoint
            image: gcr.io/google_containers/defaultbackend:1.0
            livenessProbe:
            httpGet:
                path: /healthz
                port: 8080
                scheme: HTTP
            initialDelaySeconds: 30
            timeoutSeconds: 5
            ports:
            - containerPort: 8080
            resources:
            limits:
                cpu: 10m
                memory: 20Mi
            requests:
                cpu: 10m
                memory: 20Mi
    ---
    apiVersion: v1
    kind: Service
    metadata:
    name: default-http-backend
    namespace: kube-system
    labels:
        k8s-app: default-http-backend
    spec:
    ports:
    - port: 80
        targetPort: 8080
    selector:
        k8s-app: default-http-backend
    ```
根据default-backend.yaml创建对应的Deployment和Service。 `kubectl create -f default-backend.yaml`

- 根据DaemonSet Yaml创建NIC DaemonSet，启动NIC。

    `kubectl create -f nginx-ingress-daemonset.yaml`

至此，NIC已经运行在代理节点上了，下面为测试内容。

- (选择性)确认NIC启动成功后，创建测试用的服务。

    ```
    kubectl run echoheaders --image=gcr.io/google_containers/echoserver:1.8 --replicas=1 --port=8080
    kubectl expose deployment echoheaders --port=80 --target-port=8080 --name=echoheaders-x
    kubectl expose deployment echoheaders --port=80 --target-port=8080 --name=echoheaders-y
    ```
创建测试用的Ingress Object

    ```
    apiVersion: extensions/v1beta1
    kind: Ingress
    metadata:
    name: echomap
    namespace: default
    spec:
    rules:
    - host: foo.bar.com
        http:
        paths:
        - backend:
            serviceName: echoheaders-x
            servicePort: 80
            path: /foo
    - host: bar.baz.com
        http:
        paths:
        - backend:
            serviceName: echoheaders-y
            servicePort: 80
            path: /bar
        - backend:
            serviceName: echoheaders-x
            servicePort: 80
            path: /foo
    ```

- (选择性)查看ingress的代理地址

    ```
    [root@host ~]# kubectl describe ing echomap
    Name:                   echomap
    Namespace:              default
    Address:                10.8.8.234
    Default backend:        default-http-backend:80 (172.254.109.193:8080)
    Rules:
    Host          Path    Backends
    ----          ----    --------
    foo.bar.com
                    /foo    echoheaders-x:80 (<none>)
    bar.baz.com
                    /bar    echoheaders-y:80 (<none>)
                    /foo    echoheaders-x:80 (<none>)
    Annotations:
    Events:
    FirstSeen     LastSeen        Count   From                    SubObjectPath   Type            Reason  Message
    ---------     --------        -----   ----                    -------------   --------        ------  -------
    35m           35m             1       ingress-controller                      Normal          CREATE  Ingress default/echomap
    35m           35m             1       ingress-controller                      Normal          UPDATE  Ingress default/echomap
    ```

- 测试

    ```
    [root@host ~]# curl 10.8.8.234/foo -H 'Host: foo.bar.com'
 
    Hostname: echoheaders-1076692255-p1ndv
    Pod Information:
            -no pod information available-
    Server values:
            server_version=nginx: 1.13.3 - lua: 10008
    Request Information:
            client_address=172.254.246.192
            method=GET
            real path=/foo
            query=
            request_version=1.1
            request_uri=http://foo.bar.com:8080/foo
    Request Headers:
            accept=*/*
            connection=close
            host=foo.bar.com
            user-agent=curl/7.29.0
            x-forwarded-for=10.8.8.234
            x-forwarded-host=foo.bar.com
            x-forwarded-port=80
            x-forwarded-proto=http
            x-original-uri=/foo
            x-real-ip=10.8.8.234
            x-scheme=http
    Request Body:
            -no body in request-
    
    [root@dceph04 ~]# curl 10.8.8.234/foo -H 'Host: bar.baz.com'
    
    Hostname: echoheaders-1076692255-p1ndv
    Pod Information:
            -no pod information available-
    Server values:
            server_version=nginx: 1.13.3 - lua: 10008
    Request Information:
            client_address=172.254.246.192
            method=GET
            real path=/foo
            query=
            request_version=1.1
            request_uri=http://bar.baz.com:8080/foo
    Request Headers:
            accept=*/*
            connection=close
            host=bar.baz.com
            user-agent=curl/7.29.0
            x-forwarded-for=10.8.8.234
            x-forwarded-host=bar.baz.com
            x-forwarded-port=80
            x-forwarded-proto=http
            x-original-uri=/foo
            x-real-ip=10.8.8.234
            x-scheme=http
    Request Body:
            -no body in request-
    ```


### 参考
    https://my.oschina.net/jxcdwangtao/blog/1523812                

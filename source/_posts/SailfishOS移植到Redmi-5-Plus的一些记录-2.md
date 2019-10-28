---
title: SailfishOS移植到Redmi-5-Plus的一些记录(2)
date: 2019-06-13 10:06:52
tags: [sailfish,redmi,vince,hadk,redmi5plus,lineage-15.1,hybris-15.1]
---


接上 http://birdzhang.xyz/2018/03/30/SailfishOS%E7%A7%BB%E6%A4%8D%E5%88%B0Redmi-5-Plus%E7%9A%84%E4%B8%80%E4%BA%9B%E8%AE%B0%E5%BD%95/

本文章主要针对 hybris 15.1的移植

## 挑选设备源码

mer-hybris的android hybris-15.1是基于lineageos的，所以我们在没有官方/非官方lineageos用的时候,也要找基于lineage的第三方rom，如国内的Mokee，国外的OmniROM等，只需要稍微改一点devicetree就可以用了

## 适配hybris-15.1的一些更改

### 一、Failed to initialize property area

目前的解决方法是注释掉这个, 还有可能是没有关闭selinux或者没有初始化sailfish所需要的android init rc文件有关

`system/core/init/property_service.cpp`, 将72行的`exit(1);`注释掉

### 二、kernel,device部分

1. 内核部分主要需要注意的是你的设备是否是有 `/vendor`分区的，project treble的都会有一个单独的`/vendor`分区，这个需要注意。

    可以通过这个里查看 `arch/arm/boot/dts/qcom/msm8953.dtsi` (根据你自己cpu来区分，找不到的话就用grep找一下)

    如下，可以看到有vendor跟system分区单独挂载,这个地方可以看[谷歌对system-as-root的说明](https://source.android.com/devices/bootloader/system-as-root)便于理解

    ```
            firmware: firmware {
                    android {
                            compatible = "android,firmware";
                            fstab {
                                    compatible = "android,fstab";
                                    vendor {
                                            compatible = "android,vendor";
                                            dev = "/dev/block/platform/soc/7824900.sdhci/by-name/cust";
                                            type = "ext4";
                                            mnt_flags = "ro,barrier=1,discard";
                                            fsmgr_flags = "wait";
                                            status = "ok";
                                    };
                                    system {
                                            compatible = "android,system";
                                            dev = "/dev/block/platform/soc/7824900.sdhci/by-name/system";
                                            type = "ext4";
                                            mnt_flags = "ro,barrier=1,discard";
                                            fsmgr_flags = "wait";
                                            status = "ok";
                                    };
    ```

    也可以通过device tree的 `fstab.qcom` 查看，如果没有，需要加上去（至少在vince上面是这样，因为后面的dhd要靠这个来判断）,如我的需要加这两行

    ```
    /dev/block/bootdevice/by-name/system            /system                 ext4    ro,barrier=1                                                    wait,recoveryonly
    /dev/block/bootdevice/by-name/cust              /vendor                 ext4    ro,barrier=1                                                    wait,recoveryonly
    ```

    有的设备`/dev/block/bootdevice/by-name/system`挂载到`/`下面(对应下面的dhd部分的makefstab_skip_entries)，而我的设备`/vendor`是来自`/cust`（也是迷 @_@


2. device tree部分注释掉启用full treble的部分

    如我的设备需要把下面这些注释掉，否则selinux的政策文件会安装到`/vendor`下面，不会在根目录下产生，sfos需要在根下面有。

    > 扩展阅读： https://source.android.com/security/selinux?hl=zh_cn

    ```
    # Treble
    #BOARD_PROPERTY_OVERRIDES_SPLIT_ENABLED := true
    #PRODUCT_FULL_TREBLE_OVERRIDE := true
    #PRODUCT_COMPATIBILITY_MATRIX_LEVEL_OVERRIDE := 27
    #BOARD_VNDK_VERSION := current
    #BOARD_VNDK_RUNTIME_DISABLE := true
    ```

### 三、dhd，dhc部分

https://wiki.merproject.org/wiki/Adaptations/faq-hadk 搜索 `15.1`也会找到一些需要注意的地方

修改dhd的spec文件，添加

```
# On Android 8 the system partition is (intended to be) mounted on /.
%define makefstab_skip_entries / /vendor /dev/stune /dev/cpuset /sys/fs/pstore /dev/cpuctl
```

*也不一定全部要加上，我的设备/system，/vendor就不自动挂载，需要改成这样, 可以先不加然后telnet上去看看这里目录下有没有文件吧*

```
%define makefstab_skip_entries /dev/stune /dev/cpuset /sys/fs/pstore /dev/cpuctl
```

这样会生成`system.mount`和`vendor.mount`，启动systemd的时候会挂载上


对于有些设备可能提示`kgsl kgsl-3d0: |_load_firmware| request_firmware(a530_pm4.fw) failed: -2`，需要做一个软链到 `/lib/firmware`

https://github.com/mer-hybris/droid-config-sony-nile/blob/91c15efb576c29a9d41cc4cd1d40c62ddcce9824/sparse/lib/firmware


## 调试

~~暂无很详细的，主要是看dmesg，journalctl等看看把出错的都修了。~~

### 通话声音

如果可以打通电话但是没有声音，则需要 `pulseaudio-modules-droid-hidl` 1.0版本（截止2019-09-24），然后配合新的ril配置文件 https://github.com/mer-hybris/droid-config-sony-nile/tree/master/sparse/etc/ofono

### 界面crash

看dmesg/logcat/journactl里面是不是有binder的信息，打补丁吧，至于打哪些只能靠猜（大雾
---
title: SailfishOS移植到Redmi 5 Plus的一些记录
date: 2018-03-30 14:28:28
tags: sailfish,redmi,vince,hadk
---

# 移植旗鱼系统到红米5p的过程记录

## 准备工作

* 一台红米5p手机，解锁过并且刷了lineageos
* 有梯子
* 一台内存起码8G的电脑，Ubuntu 系统，硬盘起码40GB大小，或者更高。
* [SailfishOS-HardwareAdaptationDevelopmentKit-2.0.1](https://sailfishos.org/wp-content/uploads/2017/09/SailfishOS-HardwareAdaptationDevelopmentKit-2.0.1.pdf) HADK文档
* 最关键的，一颗善于折腾的心和善于搜索的你



## 搭建环境

### Android编译环境(HADK 第4章)

> 需要先配置一下hadk的环境变量，一共三个文件，可以参考这里： https://github.com/CancroSailors/sailfish-build-environment

然后`source ~/.hadk.env`一下

#### 1. 安装git等

`sudo apt-get install git`

#### 2. 同步CM的代码

##### 配置git的用户名跟邮箱，填自己的就行，随便填也行

```
git config --global user.name "Your Name"
git config --global user.email "you@example.com"
```

##### 创建检出代码的目录，所在的盘空间要足够

```
sudo mkdir -p $ANDROID_ROOT
sudo chown -R $USER $ANDROID_ROOT
cd $ANDROID_ROOT
repo init -u git://github.com/mer-hybris/android.git -b hybris-14.1
```

##### 配置你的设备的仓库，这里是vince

```
mkdir $ANDROID_ROOT/.repo/local_manifests
cat <<'EOF' >> $ANDROID_ROOT/.repo/local_manifests/vince.xml
<?xml version="1.0" encoding="UTF-8"?>
<manifest>
  <project path="device/xiaomi/vince" name="Sailfish-On-Vince/device_xiaomi_vince" revision="cm-14.1" />
  <project path="vendor/xiaomi/vince" name="Sailfish-On-Vince/vendor_xiaomi_vince" revision="cm-14.1" />
  <project path="kernel/xiaomi/vince" name="Sailfish-On-Vince/kernel_xiaomi_msm8953" revision="cm-14.1" />
  <project path="hybris/droid-hal-version-vince" name="0312birdzhang/droid-hal-version-vince" revision="master" />
  <project path="hybris/droid-config-vince" name="0312birdzhang/droid-config-vince" revision="master" />
  <project path="rpm" name="0312birdzhang/droid-hal-vince" revision="master" />
</manifest>
EOF
```

##### 同步代码

`repo sync --fetch-submodules`

出错就多同步几次


### Mer编译环境


> 参见官方教程： https://sailfishos.org/wiki/Platform_SDK_Installation

安装Platform SDK
```
export PLATFORM_SDK_ROOT=/srv/mer
curl -k -O http://releases.sailfishos.org/sdk/installers/latest/Jolla-latest-SailfishOS_Platform_SDK_Chroot-i486.tar.bz2 ;
sudo mkdir -p $PLATFORM_SDK_ROOT/sdks/sfossdk ;
sudo tar --numeric-owner -p -xjf Jolla-latest-SailfishOS_Platform_SDK_Chroot-i486.tar.bz2 -C $PLATFORM_SDK_ROOT/sdks/sfossdk  ;
echo "export PLATFORM_SDK_ROOT=$PLATFORM_SDK_ROOT" >> ~/.bashrc
echo 'alias sfossdk=$PLATFORM_SDK_ROOT/sdks/sfossdk/mer-sdk-chroot' >> ~/.bashrc ; exec bash ;
echo 'PS1="PlatformSDK $PS1"' > ~/.mersdk.profile ;
echo '[ -d /etc/bash_completion.d ] && for i in /etc/bash_completion.d/*;do . $i;done'  >> ~/.mersdk.profile ;
sfossdk
```

另开一个终端，输入`sfossdk`，进入mer下
> 安装targets，官方教程：https://sailfishos.org/wiki/Platform_SDK_Target_Installation

其实就是执行下面的命令，要下载这三个包，过程有些慢
```
sdk-assistant create xiaomi-vince-latest http://releases.sailfishos.org/sdk/latest/Jolla-latest-Sailfish_SDK_Tooling-i486.tar.bz2
sdk-assistant create xiaomi-vince-armv7hl http://releases.sailfishos.org/sdk/latest/Jolla-latest-Sailfish_SDK_Target-armv7hl.tar.bz2
sdk-assistant create xiaomi-vince-i486 http://releases.sailfishos.org/sdk/latest/Jolla-latest-Sailfish_SDK_Target-i486.tar.bz2
```

安装打包的工具
```sudo zypper in android-tools createrepo zip```


## 修改fixup-mountpoints

文件在`hybris/hybris-boot/fixup-mountpoints`，添加你的设备的，这里是vince。
adb到手机上，输入`ls -l /dev/block/platform/*/by-name/`, 获取分区信息

## 编译hybris-hal

```
cd $ANDROID_ROOT
source build/envsetup.sh
export USE_CCACHE=1
breakfast $DEVICE
make -j4 hybris-hal
```
期间可能会报错，谷歌搜一下

## 验证Kernel

```
cd $ANDROID_ROOT
hybris/mer-kernel-check/mer_verify_kernel_config ./out/target/product/$DEVICE/obj/KERNEL_OBJ/.config
```
出现WARNING或者ERROR，将提示的加入到你的defconfig中，我的在`kernel/xiaomi/vince/arch/arm64/configs/lineageos_vince_defconfig`中
然后执行`make hybris-root`后重新验证。没有出现`ERROR`后可以执行`make hybris-recovery`


## 打包dhd（HADK 第7章）

再开一个终端，输入`sfossdk`，进入mer打包环境下

```
cd $ANDROID_ROOT
rpm/dhd/helpers/build_packages.sh
```


## 镜像制作

```
cd $ANDROID_ROOT
HA_REPO="repo --name=adaptation-community-common-$DEVICE-@RELEASE@"
HA_DEV="repo --name=adaptation-community-$DEVICE-@RELEASE@"
KS="Jolla-@RELEASE@-$DEVICE-@ARCH@.ks"
sed \
"/$HA_REPO/i$HA_DEV --baseurl=file:\/\/$ANDROID_ROOT\/droid-local-repo\/$DEVICE" \
$ANDROID_ROOT/hybris/droid-configs/installroot/usr/share/kickstarts/$KS \
> $KS
```
如果提示在`$ANDROID_ROOT/hybris/droid-configs/installroot/usr/share/kickstarts/$KS`下找不到文件，那么去`hybris/droid-configs`下执行下面的命令，然后重新生成ks文件
```
mb2 -t xiaomi-vince-armv7hl rpm
```

```
RELEASE=2.1.4.13
EXTRA_NAME=-alpha1
hybris/droid-configs/droid-configs-device/helpers/process_patterns.sh
sudo mic create fs --arch=$PORT_ARCH \
--tokenmap=ARCH:$PORT_ARCH,RELEASE:$RELEASE,EXTRA_NAME:$EXTRA_NAME \
--record-pkgs=name,url \
--outdir=sfe-$DEVICE-$RELEASE$EXTRA_NAME \
--pack-to=sfe-$DEVICE-$RELEASE$EXTRA_NAME.tar.bz2 \
$ANDROID_ROOT/Jolla-@RELEASE@-$DEVICE-@ARCH@.ks
```


## 刷机

```
Follow Instructions Carefully otherwise you will get error :
Wipe cache, dalvic cache,system,data
Format data (to remove encryption support)
Reboot into recovery again
Flash Bootloader(Once)-Flash ROM-Flash Gapps
Done-Reboot Now
Enjoy the clean rom
```
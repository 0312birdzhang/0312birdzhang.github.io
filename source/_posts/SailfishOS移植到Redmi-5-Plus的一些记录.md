---
title: SailfishOS移植到Redmi 5 Plus的一些记录
date: 2018-03-30 14:28:28
tags: [sailfish,redmi,vince,hadk,redmi5plus]
categories: [SailfishOS]
---

# 移植旗鱼系统到红米5p的过程记录


## !!!可以去ホロ 🐺的博客看看更详细的!!!
  https://blog.yoitsu.moe/category/sailfish.html

## 准备工作

* 一台红米5p手机，解锁过并且刷了lineageos
* 有梯子
* 一台内存起码8G的电脑(4G也可以)，Ubuntu 系统，硬盘起码40GB大小，或者更高。
* [SailfishOS-HardwareAdaptationDevelopmentKit](https://sailfishos.org/develop/hadk/) 1 READ部分pdf文档
* ~~https://wiki.merproject.org/wiki/Adaptations/faq-hadk~~ https://github.com/mer-hybris/hadk-faq （2019-10-28更新）
* 最关键的，一颗善于折腾的心和善于搜索的你
* irc日志 https://irclogs.sailfishos.org/logs/%23sailfishos-porters/ 



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
  <project path="hybris/droid-hal-version-vince" name="Sailfish-On-Vince/droid-hal-version-vince" revision="master" />
  <project path="hybris/droid-config-vince" name="Sailfish-On-Vince/droid-config-vince" revision="master" />
  <project path="rpm" name="Sailfish-On-Vince/droid-hal-vince" revision="master" />
</manifest>
EOF
```

##### 同步代码

`repo sync --fetch-submodules`

如果你要求快，可以用 `repo sync --fetch-submodules -c --no-tags --no-clone-bundle`，这样只会拉取当前要用的代码，但是不方便后面的修改提交

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

其实就是执行下面的命令，要下载这两个包，过程有些慢

（2019-06-13更新，修复链接地址为最新的） 

```
sdk-assistant create xiaomi-vince-latest http://releases.sailfishos.org/sdk/targets/Sailfish_OS-latest-Sailfish_SDK_Tooling-i486.tar.7z
sdk-assistant create xiaomi-vince-armv7hl http://releases.sailfishos.org/sdk/targets/Sailfish_OS-latest-Sailfish_SDK_Target-armv7hl.tar.7z
```

更新到最新（Update to latest）
```
 sudo ssu re x.y.z.ab
 sudo zypper ref
 sudo zypper dup
```

安装打包的工具

```
sudo zypper in android-tools createrepo_c
```


## 修改fixup-mountpoints

文件在`hybris/hybris-boot/fixup-mountpoints`，添加你的设备的，这里是vince。
adb到手机上，输入`ls -l /dev/block/platform/*/by-name/`, 获取分区信息，或者其他路径的，HADK里面有写

## Camera支持

```
cd $ANDROID_ROOT/external/droidmedia
echo 'DROIDMEDIA_32 := true' >> env.mk
echo 'FORCE_HAL:=1' >> env.mk

# For video recorder
# https://github.com/sailfishos/droidmedia/pull/11
echo 'MINIMEDIA_AUDIOPOLICYSERVICE_ENABLE:=1' >> env.mk
echo 'AUDIOPOLICYSERVICE_ENABLE:=1' >> env.mk
```

## 编译hybris-hal

```
cd $ANDROID_ROOT
source build/envsetup.sh
export USE_CCACHE=1
breakfast $DEVICE
make -j8 hybris-hal
```
期间可能会报错，谷歌搜一下

## 验证Kernel

```
cd $ANDROID_ROOT
hybris/mer-kernel-check/mer_verify_kernel_config ./out/target/product/$DEVICE/obj/KERNEL_OBJ/.config
```
出现WARNING或者ERROR，将提示的加入到你的defconfig中，我的在`kernel/xiaomi/vince/arch/arm64/configs/vince_defconfig`中
然后执行`make hybris-root`后重新验证。没有出现`ERROR`后可以执行`make hybris-recovery`


## 打包dhd（HADK 第7章）

再开一个终端(我们这里称终端2)，输入`sfossdk`，进入mer打包环境下

```
cd $ANDROID_ROOT
rpm/dhd/helpers/build_packages.sh -d
```

## 打包droidmedia与audioflingerglue

~~> 如果你的机器是32位的话那么下面的命令去掉`_32`,下面的也一样~~

在终端1中
```
make -j$(nproc --all) $(external/droidmedia/detect_build_targets.sh $PORT_ARCH $(gettargetarch))
```
在终端2中

```
DROIDMEDIA_VERSION=$(git --git-dir external/droidmedia/.git describe --tags | sed \
-r "s/\-/\+/g")
rpm/dhd/helpers/pack_source_droidmedia-localbuild.sh $DROIDMEDIA_VERSION
mkdir -p hybris/mw/droidmedia-localbuild/rpm
cp rpm/dhd/helpers/droidmedia-localbuild.spec \
hybris/mw/droidmedia-localbuild/rpm/droidmedia.spec
sed -ie "s/0.0.0/$DROIDMEDIA_VERSION/" \
hybris/mw/droidmedia-localbuild/rpm/droidmedia.spec
mv hybris/mw/droidmedia-$DROIDMEDIA_VERSION.tgz hybris/mw/droidmedia-localbuild
rpm/dhd/helpers/build_packages.sh --build=hybris/mw/droidmedia-localbuild

```

在终端1中

```
make -j$(nproc --all) $(external/audioflingerglue/detect_build_targets.sh $PORT_ARCH $(gettargetarch))
```

在终端2中
```
AUDIOFLINGERGLUE_VERSION=$(git --git-dir external/audioflingerglue/.git describe --tags | sed \
-r "s/\-/\+/g")
rpm/dhd/helpers/pack_source_audioflingerglue-localbuild.sh $AUDIOFLINGERGLUE_VERSION
mkdir -p hybris/mw/audioflingerglue-localbuild/rpm
cp rpm/dhd/helpers/audioflingerglue-localbuild.spec \
hybris/mw/audioflingerglue-localbuild/rpm/audioflingerglue.spec
sed -ie "s/0.0.0/$AUDIOFLINGERGLUE_VERSION/" \
hybris/mw/audioflingerglue-localbuild/rpm/audioflingerglue.spec
mv hybris/mw/audioflingerglue-$AUDIOFLINGERGLUE_VERSION.tgz hybris/mw/audioflingerglue-localbuild
rpm/dhd/helpers/build_packages.sh --build=hybris/mw/audioflingerglue-localbuild
```

然后重新打包dhd
```
rpm/dhd/helpers/build_packages.sh --droid-hal
```


## 打包其他中间件包(mw)

注意到 https://wiki.merproject.org/wiki/Adaptations/faq-hadk 搜索当前版本需要对应的mw版本号，不一定用最新的

执行 `rpm/dhd/helpers/build_packages.sh --mw` ,然后选择 `all` 即可

### 【进阶】上传到obs打包 

将droid-local-repo/vince下 droid-hal-vince/*.rpm 跟audioflingerglue*.rpm 、 droidmedia*.rpm 上传到obs的droid-hal-vince下

例如这些包：https://build.merproject.org/package/show/nemo:devel:hw:xiaomi:vince/droid-hal-vince

obs打包还需要dhc,dhv等等几个包，此处不详细说明了，可以到 https://github.com/mer-hybris 看其他机型的


## 打包dhv

也就是 droid-hal-$DEVICE-version

`rpm/dhd/helpers/build_packages.sh -v`

如果提示 droid-configs 之类的找不到，需要手动安装

```
sb2 -t $VENDOR-$DEVICE-$PORT_ARCH -R -msdk-install zypper -n install droid-config-$DEVICE
```


## Jolla-@RELEASE@-$DEVICE-@ARCH@.ks

~~~obs打包完之后，将droid-config-vince-kickstart-configuration-0.2.4*.armv7hl.rpm 下载下来，解压获得Jolla-@RELEASE@-$DEVICE-@ARCH@.ks放到$ANDROID_ROOT下面~~~

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

## 镜像制作

```
cd $ANDROID_ROOT
RELEASE=2.1.4.14
EXTRA_NAME=-alpha1
hybris/droid-configs/droid-configs-device/helpers/process_patterns.sh
sudo mic create fs --arch=$PORT_ARCH \
--tokenmap=ARCH:$PORT_ARCH,RELEASE:$RELEASE,EXTRA_NAME:$EXTRA_NAME \
--record-pkgs=name,url \
--outdir=sfe-$DEVICE-$RELEASE$EXTRA_NAME \
--pack-to=sfe-$DEVICE-$RELEASE$EXTRA_NAME.tar.bz2 \
$ANDROID_ROOT/Jolla-@RELEASE@-$DEVICE-@ARCH@.ks
```
在当前目录下会有一个 `sfe-$DEVICE-$RELEASE$EXTRA_NAME`目录，下面的 `sailfishos-$DEVICE-$RELEASE$EXTRA_NAME.zip`就是要使用的刷机包

## 刷机

刷入 lineageos-14.1的包，刷入上面的`sailfishos-$DEVICE-$RELEASE$EXTRA_NAME.zip`的包，重启

可以参考 https://wiki.merproject.org/wiki/Adaptations/libhybris/Install_SailfishOS_for_Vince


## 调试

欢迎加入 IRC #jolla-cn #sailfishos-porters (只限英文交流) 或 https://t.me/joinchat/GTqoL1HLIYXWNf-JeijTAg 讨论

相关文档 
* https://sailfishos.org/hadk 
* http://bit.ly/faq-hadk 
* http://bit.ly/port-channel-log 
* http://bit.ly/always-grep-irc-logs
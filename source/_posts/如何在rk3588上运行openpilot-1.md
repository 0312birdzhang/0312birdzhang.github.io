---
title: '如何在rk3588上运行openpilot[1]'
tags: [rk3588]
toc: true
date: 2024-04-14 16:31:55
---


![](/images/openpilot.png)

> 本文来自 https://birdzhang.xyz/2024/04/14/如何在rk3588上运行openpilot-1/ 转载请注明出处

## 1. 前言

2024-07-03 更新，现在的openpilot已经对aarch64设备有良好的支持，不用再去改很多SConstruct进行修改了，👍

使用rk3588跑openpilot的难点，主要在模型的适配上（相机部分已经很好的解决了，之前没有visionipc的时候是比较复杂的），以及兼容aarch64系统的打包等等


## 2. 系统适配

笔者使用的是 https://github.com/Joshua-Riek/ubuntu-rockchip 修改过的，可以兼容各个厂商出的rk3588板子，方面好用。安装好git等常用工具后，把openpilot的代码clone下来，然后执行`tools/ubuntu_setup.sh`即可安装上绝大多数的依赖。

对于rk3588，还有一些特殊的依赖需要安装，比如mpp、gstreamer部分，以及opencv需要重新编译添加gstreamer支持。笔者使用的是opencv_headless，参考 https://github.com/opencv/opencv/issues/21804

使用的gstreamer依赖：

```
sudo apt-get install --no-install-recommends \
  gstreamer1.0-gl \
  gstreamer1.0-opencv \
  gstreamer1.0-plugins-bad \
  gstreamer1.0-plugins-good \
  gstreamer1.0-plugins-ugly \
  gstreamer1.0-tools \
  libgstreamer-plugins-base1.0-dev \
  libgstreamer1.0-0 \
  libgstreamer1.0-dev
```


对于rknn的运行环境，参考瑞芯微的文档即可


## 3. 模型适配

模型适配主要分为两个部分，一个是模型本身，一个是模型加载的代码。这里我们只讲模型执行的部分（因为我对模型量化不了解🤦‍♂️

现在comma公司刻意简化模型的runner，我们可以根据onnxmodel.py很方便的改出rknnmodel.py。

首先我们定义一个字典，把模型的参数都放在里面，如下：

```
model_inputs = {
  "road": {
    "input_names": ['input_imgs', 'big_input_imgs', 'desire', 'traffic_convention', 'nav_features', 'nav_instructions', 'features_buffer'],
    "input_shapes":  {
      'input_imgs': [1, 12, 128, 256], 
      'big_input_imgs': [1, 12, 128, 256], 
      'desire': [1, 100, 8], 
      'traffic_convention': [1, 2], 
      'nav_features': [1, 256], 
      'nav_instructions': [1,150],
      'features_buffer': [1, 99, 128]
    },
    "input_dtypes": {
      'input_imgs': np.float32, 
      'big_input_imgs': np.float32,
      'desire': np.float32, 
      'traffic_convention': np.float32, 
      'nav_features': np.float32,
      'nav_instructions': np.float32,
      'features_buffer': np.float32
    }
  },
  "nav":{
    "input_names": ['input_img'],
    "input_shapes": {
      "input_img":[1,1,256,256]
    },
    "input_dtypes": {
      "input_img":np.float32 
    }
  },
  "dmonitor":{
    "input_names": ['input_img', 'calib'],
    "input_shapes": {
      "input_img":[1,1382400],
      "calib": [1,3]
    },
    "input_dtypes": {
      "input_img":np.float32,
      "calib": np.float32
    }
  }
}
```

再定义一个key，根据模型来区分，例如：

```
self.search_key = ""
# self.input_names = [x.name for x in self.session.get_inputs()]
# self.input_shapes = {x.name: [1, *x.shape[1:]] for x in self.session.get_inputs()}
# self.input_dtypes = {x.name: ORT_TYPES_TO_NP_TYPES[x.type] for x in self.session.get_inputs()}
if "nav" in path:
    self.search_key = "nav"
elif "dmonitor" in path:
    self.search_key = "dmonitor"
elif "supercombo" in path:
    self.search_key = "road"
self.input_names = model_inputs.get(self.search_key).get("input_names")
self.input_shapes = model_inputs.get(self.search_key).get("input_shapes")
self.input_dtypes = model_inputs.get(self.search_key).get("input_dtypes")
```

剩下的应该你都懂了怎么使用了😛。

## 4. SConscript修改

rk3588明显是aarch64架构的，和C3一样的架构，但不是高通的，用不到SNPE，所以我们既要兼容一部分larch64的，也有一部分linux aarch64的。

例如添加`/usr/lib/aarch64-linux-gnu`的path，注释掉`'system/camerad/SConscript'`，重新编译`third_party/acados`等等，需要一些尝试


## 5. 运行

假如都改好了后，运行`./launch_openpilot.sh`应该就会看到界面了


如果遇到其他问题，欢迎在评论区留言。如果有比较多人关注，会出第二期详细的内容。
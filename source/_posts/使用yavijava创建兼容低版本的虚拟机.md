---
title: 使用yavijava创建兼容低版本的虚拟机
date: 2020-08-21 13:43:54
tags: [yavijava, java]
---


### 痛点

在使用 https://github.com/yavijava/yavijava 创建虚拟机的过程中，默认会将虚拟机的兼容性自动设置为ESXI的版本，如在ESXI 6.5上创建的虚拟机，其兼容性则为 **ESXi 6.5 及更高版本 (虚拟机版本 13)**, 这样导致迁移的时候不能将这个虚拟机迁移到小于ESXI 6.5版本的主机上。

### 解决

在查询很多资料之后，确认可以通过 https://www.altaro.com/vmware/4-ways-to-downgrade-the-vm-hardware-version/ 文中的方法，将虚拟机先从清单中删掉，更改虚拟机的vmx文件，将`virtualHW.version`改为需要的版本，重新注册虚拟机即可。

在已知了这些方法之后，进行尝试, 发现在初始化虚拟机之后是无法再进行更改的，只有创建的时候设置好才行，如下即可。

```
		vmSpec.setVersion("vmx-10"); # 10 表示 esxi 5.5
		// call the createVM_Task method on the vm folder
		Task task = vmFolder.createVM_Task(vmSpec, rp, null);
		String result = task.waitForTask();

		if(result == Task.SUCCESS){
			System.out.println("VM Created Sucessfully");
		}else{
			System.out.println("VM could not be created. ");
			return;
		}
```


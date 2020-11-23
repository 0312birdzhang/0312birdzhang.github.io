---
title: python使用subprocess查看进程并过滤
date: 2020-11-23 16:22:17
tags: [python, subprocess]
---

来源： https://stackoverflow.com/questions/6780035/how-to-run-ps-cax-grep-something-in-python

将proc1的输出当作proc2的输入来实现

```
import subprocess

proc1 = subprocess.Popen(["ps","-ef"],stdout=subprocess.PIPE)
proc2 = subprocess.Popen(['grep', 'mysql'], stdin=proc1.stdout,
     stdout=subprocess.PIPE, stderr=subprocess.PIPE)
proc1.stdout.close() # Allow proc1 to receive a SIGPIPE if proc2 exits.
out, err = proc2.communicate()
outline = '{0}'.format(out)
```
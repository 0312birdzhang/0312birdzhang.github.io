---
title: python备份文件到谷歌Drive
date: 2017-05-19 10:48:59
tags: python
---

> 原文 https://developers.google.com/drive/v3/web/quickstart/python

## 安装依赖

`pip install --upgrade google-api-python-client`

## 下载认证文件 client_secret.json

谷歌上的步骤:

```
Use this wizard to create or select a project in the Google Developers Console and automatically turn on the API. Click Continue, then Go to credentials.
On the Add credentials to your project page, click the Cancel button.
At the top of the page, select the OAuth consent screen tab. Select an Email address, enter a Product name if not already set, and click the Save button.
Select the Credentials tab, click the Create credentials button and select OAuth client ID.
Select the application type Other, enter the name "Drive API Quickstart", and click the Create button.
Click OK to dismiss the resulting dialog.
Click the file_download (Download JSON) button to the right of the client ID.
Move this file to your working directory and rename it client_secret.json.
```

内容大概如下

```
{"installed":{"client_id":"334720361216-xxxxx.apps.googleusercontent.com","project_id":"analog-fastness-167807","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://accounts.google.com/o/oauth2/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_secret":"xxxxxx","redirect_uris":["urn:ietf:wg:oauth:2.0:oob","http://localhost"]}}
```

## 代码

```
#!/usr/bin/env python
# -*- coding: utf-8 -*-
'''
Created on 2017年5月16日
@author: debo.zhang
'''
#!/usr/bin/env python

from __future__ import print_function
import os

from apiclient.discovery import build
from httplib2 import Http
from oauth2client import file, client, tools
from googleapiclient.http import MediaFileUpload
try:
    import argparse
    flags = argparse.ArgumentParser(parents=[tools.argparser]).parse_args()
except ImportError:
    flags = None

SCOPES = 'https://www.googleapis.com/auth/drive.file'
store = file.Storage('storage.json')
creds = store.get()
if not creds or creds.invalid:
    home_dir = os.path.expanduser('~')
    credential_dir = os.path.join(home_dir, '.credentials')
    if not os.path.exists(credential_dir):
        os.makedirs(credential_dir)
    credential_path = os.path.join(credential_dir,
                                   'client_secret.json')
    flow = client.flow_from_clientsecrets(credential_path, SCOPES)
    creds = tools.run_flow(flow, store, flags) \
            if flags else tools.run(flow, store)

http = creds.authorize(Http())
DRIVE = build('drive', 'v3', http=http)
# DRIVE = build('drive', 'v2', http=creds.authorize(Http()))

FILES = (
    ('tmp.jpg', False),
)



for filename, convert in FILES:
    file_metadata = { 'name' : 'tmp.jpg' }
    media = MediaFileUpload('tmp.jpg',
                        mimetype='image/jpeg')
    res = DRIVE.files().create(body=file_metadata,
                                    media_body=media,
                                    fields='id').execute()
    print(res)
```
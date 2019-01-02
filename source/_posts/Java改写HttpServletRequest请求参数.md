---
title: Java改写HttpServletRequest请求参数
date: 2018-05-15 09:49:53
tags: [Java,httpservletrequest,改写,参数]
---

为什么会有这个需求呢？ 因为被 [cas](https://www.apereo.org/projects/cas) 的`AuthenticationFilter`坑了

下一篇再说一下`AuthenticationFilter`的坑，这里主要说修改请求的参数

代码是从网上找的，找不到具体来源了，直接贴代码吧

```java
package com.birdzhang.plugin;

import java.util.Collections;
import java.util.Enumeration;
import java.util.HashMap;
import java.util.Map;
import java.util.TreeMap;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletRequestWrapper;


/**
 * @author birdzhang
 *
 */
public class PrettyFacesWrappedRequest extends HttpServletRequestWrapper
{
    private final Map<String, String[]> modifiableParameters;
    private Map<String, String[]> allParameters = null;

    /**
     * Create a new request wrapper that will merge additional parameters into
     * the request object without prematurely reading parameters from the
     * original request.
     * 
     * @param request
     * @param additionalParams
     */
    public PrettyFacesWrappedRequest(final HttpServletRequest request, 
                                                    final Map<String, String[]> additionalParams)
    {
        super(request);
        modifiableParameters = new HashMap<String, String[]>();
        modifiableParameters.putAll(additionalParams);
    }

    @Override
    public String getParameter(final String name)
    {
        String[] strings = getParameterMap().get(name);
        if (strings != null)
        {
            return strings[0];
        }
        return super.getParameter(name);
    }

    @Override
    public Map<String, String[]> getParameterMap()
    {
        if (allParameters == null)
        {
            allParameters = new TreeMap<String, String[]>();
            Map<String, String[]> superMap = super.getParameterMap();
            // 在这里根据你的需要修改
            for (String key : superMap.keySet()) {
				if(key.equals("ticket")) {
					allParameters.put("token", superMap.get(key));
				}else {
					allParameters.put(key, superMap.get(key));
				}
			}
            allParameters.putAll(modifiableParameters);
        }
        //Return an unmodifiable collection because we need to uphold the interface contract.
        return Collections.unmodifiableMap(allParameters);
    }

    @Override
    public Enumeration<String> getParameterNames()
    {
        return Collections.enumeration(getParameterMap().keySet());
    }

    @Override
    public String[] getParameterValues(final String name)
    {
        return getParameterMap().get(name);
    }
}
```

使用:

```java
Map<String, String[]> extraParams = new HashMap<String, String[]>();
HttpServletRequest wrappedRequest = new PrettyFacesWrappedRequest(request, extraParams);
request.getRequestDispatcher(request.getRequestURI()).forward(wrappedRequest, response);
return;
```

完美的将`ticket`参数替换为`token`参数
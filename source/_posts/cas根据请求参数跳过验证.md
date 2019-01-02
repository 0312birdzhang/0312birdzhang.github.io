---
title: cas根据请求参数跳过验证
date: 2018-05-15 10:01:41
tags: [cas,跳过,参数]
---

接上一篇 https://birdzhang.xyz/2018/05/15/Java%E6%94%B9%E5%86%99HttpServletRequest%E8%AF%B7%E6%B1%82%E5%8F%82%E6%95%B0/ ，这里说一下cas的坑（这里的cas是3.5版本）

虽然cas有CAS Authentication Filter，但是这个只是根据请求的uri过滤的，那么这里就出现了一个奇怪的bug

即使我在`excludePaths`里面添加了`/test1/`，但是当请求地址为`/test1/123?ticket=123`的时候，还是会去cas服务器验证！！！

我们来看代码：

##### CAS Authentication Filter 代码


```java
package com.birdzhang.demo.check;

import java.io.IOException;

import javax.servlet.FilterChain;
import javax.servlet.FilterConfig;
import javax.servlet.ServletException;
import javax.servlet.ServletRequest;
import javax.servlet.ServletResponse;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

import org.jasig.cas.client.authentication.DefaultGatewayResolverImpl;
import org.jasig.cas.client.authentication.GatewayResolver;
import org.jasig.cas.client.util.AbstractCasFilter;
import org.jasig.cas.client.util.CommonUtils;
import org.jasig.cas.client.validation.Assertion;

public class AuthenticationFilter extends AbstractCasFilter{
	
	
	 /**
    * The URL to the CAS Server login.
    */
   private String casServerLoginUrl;

   /**
    * Whether to send the renew request or not.
    */
   private boolean renew = false;

   /**
    * Whether to send the gateway request or not.
    */
   private boolean gateway = false;
   /**
    * 添加属性，这里用来存放不过滤地址正则表达式，可以根据自己需求定制---1
    */
   private String excludePaths;
   
   private GatewayResolver gatewayStorage = new DefaultGatewayResolverImpl();

   protected void initInternal(final FilterConfig filterConfig) throws ServletException {
       if (!isIgnoreInitConfiguration()) {
           super.initInternal(filterConfig);
           setCasServerLoginUrl(getPropertyFromInitParams(filterConfig, "casServerLoginUrl", null));
           //log.trace("Loaded CasServerLoginUrl parameter: " + this.casServerLoginUrl);
           setRenew(parseBoolean(getPropertyFromInitParams(filterConfig, "renew", "false")));
           //log.trace("Loaded renew parameter: " + this.renew);
           setGateway(parseBoolean(getPropertyFromInitParams(filterConfig, "gateway", "false")));
           //log.trace("Loaded gateway parameter: " + this.gateway);

           final String gatewayStorageClass = getPropertyFromInitParams(filterConfig, "gatewayStorageClass", null);

           if (gatewayStorageClass != null) {
               try {
                   this.gatewayStorage = (GatewayResolver) Class.forName(gatewayStorageClass).newInstance();
               } catch (final Exception e) {
                   //log.error(e,e);
                   throw new ServletException(e);
               }
           }
           //自定义添加代码，用来读取web配置文件中excludes属性值 ---2
           excludePaths = getPropertyFromInitParams(filterConfig, "excludePaths", null);//filterConfig.getInitParameter("excludePaths");
           excludePaths = excludePaths.trim();
       }
   }

   public void init() {
       super.init();
       CommonUtils.assertNotNull(this.casServerLoginUrl, "casServerLoginUrl cannot be null.");
   }
//url判断逻辑，这里大家可以根据自己需要来制订规则
   private boolean isExclude(String uri){
   	boolean isInWhiteList = false;
   	if(excludePaths!=null&& uri!=null){
   		isInWhiteList = uri.matches(excludePaths);
   	}
       return isInWhiteList;
   }
  
   
   public final void doFilter(final ServletRequest servletRequest, final ServletResponse servletResponse, final FilterChain filterChain) throws IOException, ServletException {
       final HttpServletRequest request = (HttpServletRequest) servletRequest;
       final HttpServletResponse response = (HttpServletResponse) servletResponse;
       final HttpSession session = request.getSession(false);
       final Assertion assertion = session != null ? (Assertion) session.getAttribute(CONST_CAS_ASSERTION) : null;
      // 该判断是自定义的对符合条件的url进行通过处理 ---3
       if(isExclude(request.getRequestURI())){
       	filterChain.doFilter(request, response);
           return;
       }
       
       if (assertion != null) {
           filterChain.doFilter(request, response);
           return;
       }

       final String serviceUrl = constructServiceUrl(request, response);
       final String ticket = CommonUtils.safeGetParameter(request,getArtifactParameterName());
       final boolean wasGatewayed = this.gatewayStorage.hasGatewayedAlready(request, serviceUrl);

       if (CommonUtils.isNotBlank(ticket) || wasGatewayed) {
           filterChain.doFilter(request, response);
           return;
       }

       final String modifiedServiceUrl;

       //log.debug("no ticket and no assertion found");
       if (this.gateway) {
           //log.debug("setting gateway attribute in session");
           modifiedServiceUrl = this.gatewayStorage.storeGatewayInformation(request, serviceUrl);
       } else {
           modifiedServiceUrl = serviceUrl;
       }

/*       if (log.isDebugEnabled()) {
           log.debug("Constructed service url: " + modifiedServiceUrl);
       }*/

       final String urlToRedirectTo = CommonUtils.constructRedirectUrl(this.casServerLoginUrl, getServiceParameterName(), modifiedServiceUrl, this.renew, this.gateway);

  /*     if (log.isDebugEnabled()) {
           log.debug("redirecting to \"" + urlToRedirectTo + "\"");
       }*/

       response.sendRedirect(urlToRedirectTo);
   }

   public final void setRenew(final boolean renew) {
       this.renew = renew;
   }

   public final void setGateway(final boolean gateway) {
       this.gateway = gateway;
   }

   public final void setCasServerLoginUrl(final String casServerLoginUrl) {
       this.casServerLoginUrl = casServerLoginUrl;
   }
   
   public final void setGatewayStorage(final GatewayResolver gatewayStorage) {
   	this.gatewayStorage = gatewayStorage;
   }
}
```

可以看到在uri匹配到excludepath之后会走`filterChain.doFilter(request, response);`，由于我们并没有对filterChain做什么修改，所以最终还是跑到cas那里去了

修改后的代码如下：

```java
package com.birdzhang.plugin;

/**
 * @author debo.zhang
 *
 */
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

import javax.servlet.FilterChain;
import javax.servlet.FilterConfig;
import javax.servlet.ServletException;
import javax.servlet.ServletRequest;
import javax.servlet.ServletResponse;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

import org.jasig.cas.client.authentication.DefaultGatewayResolverImpl;
import org.jasig.cas.client.authentication.GatewayResolver;
import org.jasig.cas.client.util.AbstractCasFilter;
import org.jasig.cas.client.util.CommonUtils;
import org.jasig.cas.client.validation.Assertion;

public class AuthenticationFilter extends AbstractCasFilter{
	
	
	 /**
    * The URL to the CAS Server login.
    */
   private String casServerLoginUrl;

   /**
    * Whether to send the renew request or not.
    */
   private boolean renew = false;

   /**
    * Whether to send the gateway request or not.
    */
   private boolean gateway = false;
   /**
    * 添加属性，这里用来存放不过滤地址正则表达式，可以根据自己需求定制---1
    */
   private String excludePaths;
   
   private GatewayResolver gatewayStorage = new DefaultGatewayResolverImpl();

   protected void initInternal(final FilterConfig filterConfig) throws ServletException {
       if (!isIgnoreInitConfiguration()) {
           super.initInternal(filterConfig);
           setCasServerLoginUrl(getPropertyFromInitParams(filterConfig, "casServerLoginUrl", null));
           //log.trace("Loaded CasServerLoginUrl parameter: " + this.casServerLoginUrl);
           setRenew(parseBoolean(getPropertyFromInitParams(filterConfig, "renew", "false")));
           //log.trace("Loaded renew parameter: " + this.renew);
           setGateway(parseBoolean(getPropertyFromInitParams(filterConfig, "gateway", "false")));
           //log.trace("Loaded gateway parameter: " + this.gateway);

           final String gatewayStorageClass = getPropertyFromInitParams(filterConfig, "gatewayStorageClass", null);

           if (gatewayStorageClass != null) {
               try {
                   this.gatewayStorage = (GatewayResolver) Class.forName(gatewayStorageClass).newInstance();
               } catch (final Exception e) {
                   //log.error(e,e);
                   throw new ServletException(e);
               }
           }
           //自定义添加代码，用来读取web配置文件中excludes属性值 ---2
           excludePaths = getPropertyFromInitParams(filterConfig, "excludePaths", null);//filterConfig.getInitParameter("excludePaths");
           excludePaths = excludePaths.trim();
       }
   }

   public void init() {
       super.init();
       CommonUtils.assertNotNull(this.casServerLoginUrl, "casServerLoginUrl cannot be null.");
   }

   //url判断逻辑，这里大家可以根据自己需要来制订规则
   private boolean isExclude(String uri){
   	boolean isInWhiteList = false;
   	if(excludePaths!=null&& uri!=null){
   		isInWhiteList = uri.matches(excludePaths);
   	}
       return isInWhiteList;
   }
  
   
   
   public final void doFilter(final ServletRequest servletRequest, final ServletResponse servletResponse, final FilterChain filterChain) throws IOException, ServletException {
       HttpServletRequest request = (HttpServletRequest) servletRequest;
       final HttpServletResponse response = (HttpServletResponse) servletResponse;
       final HttpSession session = request.getSession(false);
       
       final Assertion assertion = session != null ? (Assertion) session.getAttribute(CONST_CAS_ASSERTION) : null;

       //hack for 云桥
       Map<String, String[]>	paramsMap = request.getParameterMap();
       
       if(null != paramsMap ) {
    	   if(paramsMap.containsKey("ticket") && paramsMap.containsKey("operation")) {
/*    		   String token = Arrays.toString(paramsMap.get("ticket"));
    		   request.removeAttribute("ticket");
    		   request.setAttribute("token", token.substring(1, token.length()-1));
    		   filterChain.doFilter(request, response);
               return;*/
               
    		   /*StringBuffer paramsBuff = new StringBuffer();
    	       for(String param: paramsMap.keySet()) {
    	    	   String newString = Arrays.toString(paramsMap.get(param));
    	    	   if(param.equals("ticket")) {
    	    		   paramsBuff.append("&").append("eticket").append("=").append(newString.substring(1, newString.length()-1));
    	    	   }else {
    	    		   paramsBuff.append("&").append(param).append("=").append(newString.substring(1, newString.length()-1));
    	    	   }
    	       }
    	       String port = request.getServerPort() == 80?"":":"+request.getServerPort();
    	       String scheme = request.getScheme();
    	       String host = request.getServerName();
    	       String redirectUrl = String.format("%s://%s%s%s?%s", 
    	    		   scheme,
    	    		   host,
    	    		   port,
    	    		   request.getRequestURI(),
    	    		   paramsBuff.toString().substring(1)
    	    		   );
    	       System.out.println("request url:"+redirectUrl);
    	       response.sendRedirect(redirectUrl);
    	       return;*/
    		   
    		   Map<String, String[]> extraParams = new HashMap<String, String[]>();
    		   HttpServletRequest wrappedRequest = new PrettyFacesWrappedRequest(request, extraParams);
    		   request.getRequestDispatcher(request.getRequestURI()).forward(wrappedRequest, response);
    		   return;
    	   }
       }
       
       
       // 该判断是自定义的对符合条件的url进行通过处理 
       if(isExclude(request.getRequestURI())){
       	filterChain.doFilter(request, response);
           return;
       }
       
      
       
       if (assertion != null) {
           filterChain.doFilter(request, response);
           return;
       }

       final String serviceUrl = constructServiceUrl(request, response);
       final String ticket = CommonUtils.safeGetParameter(request,getArtifactParameterName());
       final boolean wasGatewayed = this.gatewayStorage.hasGatewayedAlready(request, serviceUrl);

       if (CommonUtils.isNotBlank(ticket) || wasGatewayed) {
           filterChain.doFilter(request, response);
           return;
       }

       final String modifiedServiceUrl;

       //log.debug("no ticket and no assertion found");
       if (this.gateway) {
           //log.debug("setting gateway attribute in session");
           modifiedServiceUrl = this.gatewayStorage.storeGatewayInformation(request, serviceUrl);
       } else {
           modifiedServiceUrl = serviceUrl;
       }

/*       if (log.isDebugEnabled()) {
           log.debug("Constructed service url: " + modifiedServiceUrl);
       }*/

       final String urlToRedirectTo = CommonUtils.constructRedirectUrl(this.casServerLoginUrl, getServiceParameterName(), modifiedServiceUrl, this.renew, this.gateway);

  /*     if (log.isDebugEnabled()) {
           log.debug("redirecting to \"" + urlToRedirectTo + "\"");
       }*/

       response.sendRedirect(urlToRedirectTo);
   }

   public final void setRenew(final boolean renew) {
       this.renew = renew;
   }

   public final void setGateway(final boolean gateway) {
       this.gateway = gateway;
   }

   public final void setCasServerLoginUrl(final String casServerLoginUrl) {
       this.casServerLoginUrl = casServerLoginUrl;
   }
   
   public final void setGatewayStorage(final GatewayResolver gatewayStorage) {
   	this.gatewayStorage = gatewayStorage;
   }
}

```
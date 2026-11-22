---
title: Learn Performance
category: 参考资料
source: `https://web.dev/learn/performance`
summary: 本地镜像：Learn Performance（原文 web.dev）
---

> 本文档为站内参考资料，抓取自原文并整理，供离线学习。原文：`https://web.dev/learn/performance`

Skip to main content

1

## Welcome to Learn Performance!

Article

This course is designed for those new to web performance, a vital aspect of the user experience. It covers key web performance concepts and techniques for improving performance.

2

## Why speed matters

Article

Before you can get started with learning performance, you first have to understand its role in the user experience, and how it can result in better outcomes for users. This course starts off with a brief introduction into these topics, giving vital context as to why it's important to learn performance.

3

## General HTML performance considerations

Article

Every website starts with a request for an HTML document, that request has a big role to play in how fast your website loads. This module covers important concepts such as HTML caching, parser blocking, render blocking, and more, so you can ensure the first request for your website's HTML is off on the right foot.

4

## Understanding the critical path

Article

The critical rendering path is a concept in web performance that deals with how quickly the initial rendering of a page appears in the browser. This module goes into the theory behind the critical rendering path, covering concepts such as render-blocking and parser-blocking resources, and how they play a key role in how quickly a page appears in the browser.

5

## Optimize resource loading

Article

As a page loads, many resources are referenced within its HTML that provide a page with its appearance and layout through CSS, as well as its interactivity through JavaScript. In this module, a number of important concepts related to these resources and how they affect a page's load time are covered.

6

## Assist the browser with resource hints

Article

Resource hints are a collection of features available in HTML that can assist the browser in loading resources earlier and possibly even with higher resource priority. In this module, a few resource hints that can help your pages load even faster are covered.

7

## Image performance

Article

Images represent a large portion of the data transferred on many web pages today. This module covers how to optimize images, as well as serve them efficiently so that you minimize wasted bytes, regardless of the user's device.

8

## Video performance

Article

Video is a media type used often on web pages—but knowing how to serve them efficiently is one aspect of performance you shouldn't overlook. This module covers some key techniques for embedding videos in such a way that your website stays fast, as well adjacent performance considerations that can arise with their use.

9

## Optimize web fonts

Article

Web fonts are a commonly used resource on the web—and rightfully so—as they add to the design of a website in ways that other resources can't. Even so, web fonts still have a performance cost. In this module, a number of performance considerations and techniques around web fonts are explored.

10

## Code-split JavaScript

Article

Some resources are not crucial to a web page's initial load. JavaScript is one such resource that can be deferred until the time of need through a technique known as code splitting. By doing so, you can improve performance by lowering bandwidth and CPU contention—a critical consideration for improving both initial page load speed and input responsiveness during startup.

11

## Lazy load images and iframe elements

Article

Images and iframe elements can consume significant bandwidth and CPU processing time. However, not all images and iframe elements need to be loaded during the initial page load, and can be deferred to a later time in which the user is likeliest to see them. This technique is known as lazy loading. In this module, lazy loading images and iframe elements is explained so you can get your pages to load faster and only consume bandwidth and processing time only when needed.

12

## Prefetching, prerendering, and service worker precaching

Article

While much of performance deals with what you can do to optimize and eliminate unnecessary resources, it may seem a bit paradoxical to suggest that some resources should be loaded before they're needed. However, there are some cases in which it might be appropriate to load certain resources ahead of time. In this module, this aspect of performance is explored, as prefetching, prerendering, and service worker precaching are discussed.

13

## An overview of web workers

Article

Much of what the user sees in the browser occurs on a single thread known as the main thread. However, there are opportunities where you can start up new threads to do computationally expensive work so that the main thread can accommodate important user-facing tasks. The API that does this is known as the Web Worker API, and in this module, the basics of it are covered.

14

## A concrete web worker use case

Article

Now that you have a basic understanding of web workers and their capabilities and limitations, it's time to take a look at a concrete use case for a web worker. In this demo, a web worker is used to fetch a JPEG file, extract its metadata, and send it back to the main thread so the user can see it in the browser.

## Quiz

Confirm you've completed the Learn Performance course to claim your badge.

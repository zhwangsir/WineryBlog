---
title: Coroutines guide
category: 参考资料
source: `https://kotlinlang.org/docs/coroutines-guide.html`
summary: 本地镜像：Coroutines guide（原文 kotlinlang.org）
---

> 本文档为站内参考资料，抓取自原文并整理，供离线学习。原文：`https://kotlinlang.org/docs/coroutines-guide.html`

# Coroutines guide

Edit pageLast modified: 10 August 2026
Kotlin provides only minimal low-level APIs in its standard library to enable other libraries to utilize coroutines. Unlike many other languages with similar capabilities, `async` and `await` are not keywords in Kotlin and are not even part of its standard library. Moreover, Kotlin's concept of suspending function provides a safer and less error-prone abstraction for asynchronous operations than futures and promises.

`kotlinx.coroutines` is a rich library for coroutines developed by JetBrains. It contains a number of high-level coroutine-enabled primitives that this guide covers, including `launch`, `async`, and others.

This is a guide about the core features of `kotlinx.coroutines` with a series of examples, divided up into different topics.

In order to use coroutines as well as follow the examples in this guide, you need to add a dependency on the `kotlinx-coroutines-core` module as explained in the project README.

## Table of contents

*   Coroutines basics

*   Cancellation and timeouts

*   Flows

*   Tutorial: Intro to coroutines and channels

*   Composing suspending functions

*   Coroutine context and dispatchers

*   Channels

*   Coroutine exceptions handling

*   Shared mutable state and concurrency

*   Select expression (experimental)

*   Tutorial: Debug coroutines using IntelliJ IDEA

*   Tutorial: Debug Kotlin Flow using IntelliJ IDEA

## Additional references

*   Guide to UI programming with coroutines

*   Coroutines design document (KEEP)

*   Full kotlinx.coroutines API reference

*   Best practices for coroutines in Android

*   Additional Android resources for Kotlin coroutines and flow

Thanks for your feedback!

Was this page helpful?

Yes No

*   Coroutines guide
*   Table of contents
*   Additional references

UUIDsCoroutines basics

Contributing to KotlinReleasesPress KitSecurityBlogIssue TrackerBrand AssetsCareersKotlin MerchOpt-Out

Kotlin™ is protected under the Kotlin Foundation and licensed under theApache 2 license. 

Supported and developed byJetBrains

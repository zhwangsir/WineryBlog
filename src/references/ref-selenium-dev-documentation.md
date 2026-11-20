---
title: The Selenium Browser Automation Project
category: 参考资料
source: `https://www.selenium.dev/documentation/`
summary: 本地镜像：The Selenium Browser Automation Project（原文 www.selenium.dev）
---

> 本文档为站内参考资料，抓取自原文并整理，供离线学习。原文：`https://www.selenium.dev/documentation/`

# frozen_string_literal: true

require 'selenium-webdriver'

driver = Selenium::WebDriver.for :chrome

driver.get '`https://selenium.dev'`

driver.quit
```

```
const {Builder, Browser} = require('selenium-webdriver');

(async function helloSelenium() {
  let driver = await new Builder().forBrowser(Browser.CHROME).build();

  await driver.get('`https://selenium.dev'`);

  await driver.quit();
})();
```

```
package dev.selenium.hello

import org.openqa.selenium.chrome.ChromeDriver

fun main() {
    val driver = ChromeDriver()

    driver.get("`https://selenium.dev"`)

    driver.quit()
}
```

See the Overview to check the different project components and decide if Selenium is the right tool for you.

You should continue on to Getting Started to understand how you can install Selenium and successfully use it as a test automation tool, and scaling simple tests like this to run in large, distributed environments on multiple browsers, on several different operating systems.

* * *

##### Selenium Overview

Is Selenium for you? See an overview of the different project components.

##### WebDriver

WebDriver drives a browser natively; learn more about it.

##### Guides

Task-based guides: start from the problem you have and follow the links into the reference pages that solve it.

##### Selenium Manager

Selenium Manager is a command-line tool implemented in Rust that provides automated driver and browser management for Selenium. Selenium bindings use this tool by default, so you do not need to download it or add anything to your code or do anything else to use it.

##### Grid

Want to run tests in parallel across multiple machines? Then, Grid is for you.

##### Selenium IDE

The Selenium IDE is a standalone application that records and plays back a user’s actions.

##### Using AI coding agents with Selenium

How to get coding agents and large language models to write Selenium code that is current, correct, and not flaky.

##### Test Practices

Some guidelines and recommendations on testing from the Selenium project.

##### Selenium release notes

What changed in each recent Selenium release, newest first, with links to the announcement and to the full changelog of every binding.

##### Warnings

Explanations for the diagnostics, annotations, and IDE warnings Selenium surfaces.

##### Legacy

Documentation related to the legacy components of Selenium. Meant to be kept purely for historical reasons and not as a incentive to use deprecated components.

## Support the Selenium Project

Learn more or view the full list of sponsors.

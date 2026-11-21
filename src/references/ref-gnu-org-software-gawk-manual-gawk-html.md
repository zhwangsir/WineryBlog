---
title: Getting Started (The GNU Awk User’s Guide)
category: 参考资料
source: `https://www.gnu.org/software/gawk/manual/html_node/Getting-Started.html`
summary: 本地镜像：GNU awk 手册 Getting Started（原文 gnu.org）
---

> 本文档为站内参考资料，抓取自原文并整理，供离线学习。原文：`https://www.gnu.org/software/gawk/manual/html_node/Getting-Started.html`

The basic function of `awk` is to search files for lines (or other units of text) that contain certain patterns. When a line matches one of the patterns, `awk` performs specified actions on that line. `awk` continues to process input lines in this way until it reaches the end of the input files.

Programs in `awk` are different from programs in most other languages, because `awk` programs are _data driven_ (i.e., you describe the data you want to work with and then what to do when you find it). Most other languages are _procedural_; you have to describe, in great detail, every step the program should take. When working with procedural languages, it is usually much harder to clearly describe the data your program will process. For this reason, `awk` programs are often refreshingly easy to read and write.

When you run `awk`, you specify an `awk`_program_ that tells `awk` what to do. The program consists of a series of _rules_ (it may also contain _function definitions_, an advanced feature that we will ignore for now; see User-Defined Functions). Each rule specifies one pattern to search for and one action to perform upon finding the pattern.

Syntactically, a rule consists of a _pattern_ followed by an _action_. The action is enclosed in braces to separate it from the pattern. Newlines usually separate rules. Therefore, an `awk` program looks like this:

pattern { action }
pattern { action }
...

*   How to Run `awk` Programs
*   Data files for the Examples
*   Some Simple Examples
*   An Example with Two Rules
*   A More Complex Example
*   `awk` Statements Versus Lines
*   Other Features of `awk`
*   When to Use `awk`
*   Summary

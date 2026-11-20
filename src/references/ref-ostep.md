---
title: Operating Systems: Three Easy Pieces
category: 参考资料
source: `https://pages.cs.wisc.edu/~remzi/OSTEP/`
summary: 本地镜像：Operating Systems: Three Easy Pieces（原文 pages.cs.wisc.edu）
---

> 本文档为站内参考资料，抓取自原文并整理，供离线学习。原文：`https://pages.cs.wisc.edu/~remzi/OSTEP/`

## Operating Systems: Three Easy Pieces

### Remzi H. Arpaci-Dusseau and Andrea C. Arpaci-Dusseau (University of Wisconsin-Madison)

### NEW: Security Chapters by Peter Reiher (UCLA)
Blog: Why Textbooks Should Be Free **Quick:**Free Book Chapters - Hardcover - Softcover (Amazon) - Buy PDF - Buy in India - Buy Stuff - Donate - For Teachers - Homework - Projects - News - Acknowledgements - Other Books Welcome to **Operating Systems: Three Easy Pieces** (now **version 1.10** -- see book news for details), a free online operating systems book! The book is centered around three conceptual pieces that are fundamental to operating systems: **virtualization,****concurrency,** and **persistence.** In understanding the conceptual, you will also learn the practical, including how an operating system does things like schedule the CPU, manage memory, and store files persistently. Lots of fun stuff! Or maybe not so fun? This book **is and will always be free** in PDF form, as seen below. For those of you wishing to **BUY** a copy, please consider the following: 
（图：Image 2）
* Lulu Hardcover (v1.10): this may be the best printed form of the book (it really looks pretty good), but it is also the most expensive way to obtain _the black book_ of operating systems (a.k.a. _the comet book_ or _the asteroid book_ according to students). Now just: **$39.75** * Amazon Softcover (v1.10): Same book as softcover above, but printed through Amazon CreateSpace. Now just: **$28.27** (but works with Prime shipping) * Downloadable PDF (v1.10): this is a nice convenience and adds things like a hyperlinked table of contents, index of terms, lists of hints, tips, systems advice, and a few other things not seen in the free version, all in one massive DRM-free PDF. Once purchased, you will always be able to get the latest version. Just: **$10.00** * Kindle (still v1.00): Really, just the PDF and does not include all the bells and whistles common in e-pub books. **Warning:** Some resellers on Amazon buy old versions of the books and claim to sell them as “new” on Amazon (click here for an example); buy from them at your own risk. In general, buy either directly from Lulu.com or Amazon.com (not a reseller). For Amazon, go to this page and look for Seller Information to be Amazon.com.  **Merch:** Can't bear to go out in public without OSTEP? How about an Operating Systems: Three Easy Pieces T-shirt or laptop sticker or bathmat or blanket or mug or check out the whole store?  **Donate:** By popular demand, another way to support this site and its contents: **donate!** Click to donate $1 - $10 - $20 - $50 - or click here to donate any amount you want! Your donation helps keep this book going. Think about it: if everyone who came to this website donated just one dollar, we'd have at least three dollars. Thanks! Another way to help the book out: cite it! Here is the BiBTeX entry (seen below); you can also link to the site of the best free operating systems book on the market. > **Operating Systems: Three Easy Pieces** > Remzi H. Arpaci-Dusseau and Andrea C. Arpaci-Dusseau > Arpaci-Dusseau Books > November, 2023 (Version 1.10)  And now, the free online form of the book, in chapter-by-chapter form (now with chapter numbers!):
**Intro****Virtualization****Concurrency****Persistence****Security** Dedication3 _Dialogue_ 12 _Dialogue_ 25 _Dialogue_ 35 _Dialogue_ 52_Dialogue_ Preface4Processes13Address Spacescode26Concurrency and Threadscode36I/O Devices53_Intro Security_ TOC5Process APIcode14Memory API27Thread APIcode37Hard Disk Drives54_Authentication_ 1 _Dialogue_ 6Direct Execution15Address Translation28Lockscode38Redundant Disk Arrays (RAID)55_Access Control_ 2Introductioncode7CPU Scheduling16Segmentation29Locked Data Structures39Files and Directories56_Cryptography_ 8Multi-level Feedback17Free Space Management30Condition Variablescode40File System Implementation57_Distributed_ 9Lottery Schedulingcode18Introduction to Paging31Semaphorescode41Fast File System (FFS) 10Multi-CPU Scheduling19Translation Lookaside Buffers32Concurrency Bugs42FSCK and Journaling**Appendices** 11 _Summary_ 20Advanced Page Tables33Event-based Concurrency43Log-structured File System (LFS)_Dialogue_ 21Swapping: Mechanisms34 _Summary_ 44Flash-based SSDsVirtual Machines 22Swapping: Policies45Data Integrity and Protection_Dialogue_ 23Complete VM Systems46 _Summary_Monitors 24 _Summary_ 47 _Dialogue__Dialogue_ 48Distributed SystemsLab Tutorial 49Network File System (NFS)Systems Labs 50Andrew File System (AFS)xv6 Labs 51 _Summary_

**INSTRUCTORS:** If you are using these free chapters, **please just link to them directly** (instead of making a copy locally); we make little improvements frequently and thus would like to provide the latest to whomever is using it. Also: we have made our own class-preparation notes available to those of you teaching from this book; please drop us a line at **ostep.book@gmail.com** if you are interested.

**HOMEWORKS:** Some of the chapters have homeworks at the end, which require simulators and other code. More details on that, including how to find said code, can be found here: HOMEWORK

**PROJECTS:** While the book should provide a good conceptual guide to key aspects of modern operating systems, no education is complete without projects. We are in the process of making the projects we use at the University of Wisconsin-Madison widely available; an initial link to project descriptions is available here: PROJECTS. Coming soon: the automated testing framework that we use to grade projects.

**BOOKS NEWS:** Many small things to move to version 1.10. Track changes: NEWS

**ACKNOWLEDGEMENTS:** These students have greatly contributed to this effort, through endless bug reports and other comments. Your name could go here! (as well as in the printed book): ERRATA

**OTHER SYSTEMS BOOKS:** Interested in other systems books? Good! Of course, we assume some background in The C Programming Language
（图：Image 3）
, so that's a good investment. And Advanced Programming in the UNIX Environment
（图：Image 4）
 is a must for any shelf. On top of that, here are some OS books that could be worth your time: Operating Systems: Principles and Practice
（图：Image 5）
 - Operating System Concepts
（图：Image 6）
 - Operating Systems: Internals and Design Principles (8th Edition)
（图：Image 7）
 - Modern Operating Systems (4th Edition)
（图：Image 8）
 - Linux Kernel Development (3rd Edition)
（图：Image 9）
 - Understanding the Linux Kernel
（图：Image 10）
 - The Design and Implementation of the FreeBSD Operating System
（图：Image 11）
 - Solaris Internals: Solaris 10 and OpenSolaris Kernel Architecture
（图：Image 12）
 - Mac OS X Internals: A Systems Approach
（图：Image 13）
 - The Design of the UNIX Operating System
（图：Image 14）
 - UNIX: The Textbook
（图：Image 15）
 - The Linux Programming Interface: A Linux and UNIX System Programming Handbook
（图：Image 16）
.
**OTHER BOOKS:** So you're looking down here? Well, how about reading something other than tech books all day long? Honestly, you need to be more balanced. Here are some awesome books you should most definitely read. Fiction: Cloud Atlas: A Novel
（图：Image 17）
 - Life of Pi
（图：Image 18）
 - A Prayer for Owen Meany: A Novel
（图：Image 19）
 - All the Light We Cannot See
（图：Image 20）
 - The Book Thief
（图：Image 21）
 - The Fault in Our Stars
（图：Image 22）
 - Tenth of December: Stories
（图：Image 23）
 - If I Don't Six
（图：Image 24）
 - A Game of Thrones
（图：Image 25）
 - To Kill a Mockingbird
（图：Image 26）
 - The Kite Runner
（图：Image 27）
 - Ender's Game
（图：Image 28）
 - Foundation
（图：Image 29）
 - Slaughterhouse-Five
（图：Image 30）
 - The Shadow of the Wind
（图：Image 31）
 - Flowers for Algernon
（图：Image 32）
 - Holes
（图：Image 33）
 - Atonement
（图：Image 34）
 - The Name of the Wind
（图：Image 35）
 - Beloved
（图：Image 36）
 - For Whom the Bell Tolls
（图：Image 37）
 - Different Seasons
（图：Image 38）
 - Neuromancer
（图：Image 39）
 - Snow Crash
（图：Image 40）
 - Cryptonomicon
（图：Image 41）
 - Shantaram
（图：Image 42）
 - A Room with a View
（图：Image 43）
 - Jude the Obscure
（图：Image 44）
 - Illusions: The Adventures of a Reluctant Messiah
（图：Image 45）
 - A Canticle for Leibowitz
（图：Image 46）
 - A Wizard of Earthsea
（图：Image 47）
 - Black Swan Green
（图：Image 48）
 - The Stars My Destination
（图：Image 49）
 - Ancillary Justice
（图：Image 50）
 - My Brilliant Friend
（图：Image 51）
 - Crossing to Safety
（图：Image 52）
 - Possession
（图：Image 53）
 - The Selected Works of T.S. Spivet
（图：Image 54）
 - Essential Ellison
（图：Image 55）
 - The Demolished Man
（图：Image 56）
 - The Nightingale - The Overstory - The Windup Girl - The Water Knife Non-fiction: Seabiscuit: An American Legend
（图：Image 57）
 - Unbroken
（图：Image 58）
 - Surely You're Joking, Mr. Feynman!
（图：Image 59）
 - On Intelligence
（图：Image 60）
 - The Language Instinct
（图：Image 61）
 - Flow
（图：Image 62）
 - Guns, Germs, and Steel
（图：Image 63）
 - The Selfish Gene
（图：Image 64）
 - A Heartbreaking Work of Staggering Genius
（图：Image 65）
 - Lies My Teacher Told Me
（图：Image 66）
 - Freakonomics
（图：Image 67）
 - How the Irish Saved Civilization
（图：Image 68）
 - Cod
（图：Image 69）
 - The Devil in the White City
（图：Image 70）
 - The Swerve: How the World Became Modern
（图：Image 71）
 - The Drunkard's Walk
（图：Image 72）
 - The Visual Display of Quantitative Information
（图：Image 73）
 - Eats, Shoots & Leaves
（图：Image 74）
 - The Elements of Style
（图：Image 75）
 - The Design of Everyday Things
（图：Image 76）
 - Mountains Beyond Mountains
（图：Image 77）
 - The Soul of A New Machine
（图：Image 78）
 - Alan Turing: The Enigma
（图：Image 79）
 - Consider the Lobster
（图：Image 80）
 - The Vintage Guide to Classical Music
（图：Image 81）

**ACKS:** The authors wish to acknowledge all the sources of funding for their research over the years. In particular, the authors appreciate the strong support from the National Science Foundation (NSF), which is an essential part of the modern research and educational infrastructure of the USA.
.

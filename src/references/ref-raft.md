---
title: Raft Consensus Algorithm
category: 参考资料
source: `https://raft.github.io/`
summary: 本地镜像：Raft Consensus Algorithm（原文 raft.github.io）
---

> 本文档为站内参考资料，抓取自原文并整理，供离线学习。原文：`https://raft.github.io/`

## Quick Links

## What is Raft?

Raft is a consensus algorithm that is designed to be easy to understand. It's equivalent to Paxos in fault-tolerance and performance. The difference is that it's decomposed into relatively independent subproblems, and it cleanly addresses all major pieces needed for practical systems. We hope Raft will make consensus available to a wider audience, and that this wider audience will be able to develop a variety of higher quality consensus-based systems than are available today.

## Hold on—what is consensus?

Consensus is a fundamental problem in fault-tolerant distributed systems. Consensus involves multiple servers agreeing on values. Once they reach a decision on a value, that decision is final. Typical consensus algorithms make progress when any majority of their servers is available; for example, a cluster of 5 servers can continue to operate even if 2 servers fail. If more servers fail, they stop making progress (but will never return an incorrect result).

Consensus typically arises in the context of replicated state machines, a general approach to building fault-tolerant systems. Each server has a state machine and a log. The state machine is the component that we want to make fault-tolerant, such as a hash table. It will appear to clients that they are interacting with a single, reliable state machine, even if a minority of the servers in the cluster fail. Each state machine takes as input commands from its log. In our hash table example, the log would include commands like _set x to 3_. A consensus algorithm is used to agree on the commands in the servers' logs. The consensus algorithm must ensure that if any state machine applies _set x to 3_ as the _n_ th command, no other state machine will ever apply a different _n_ th command. As a result, each state machine processes the same series of commands and thus produces the same series of results and arrives at the same series of states.

## Raft Visualization

Here's a Raft cluster running in your browser. You can interact with it to see Raft in action. Five servers are shown on the left, and their logs are shown on the right. We hope to create a screencast soon to explain what's going on. This visualization (RaftScope) is still pretty rough around the edges; pull requests would be very welcome.

The Secret Lives of Data is a different visualization of Raft. It's more guided and less interactive, so it may be a gentler starting point.

## Publications

This is "the Raft paper", which describes Raft in detail: In Search of an Understandable Consensus Algorithm (Extended Version) by Diego Ongaro and John Ousterhout. A slightly shorter version of this paper received a Best Paper Award at the 2014 USENIX Annual Technical Conference.

Diego Ongaro's Ph.D. dissertation expands on the content of the paper in much more detail, and it includes a simpler cluster membership change algorithm. The dissertation also includes a formal specification of Raft written in TLA+; a slightly updated version of that specification is here.

More Raft-related papers:

*   Doug Woos, James R. Wilcox, Steve Anton, Zachary Tatlock, Michael D. Ernst, and Thomas Anderson.   
Planning for Change in a Formal Verification of the Raft Consensus Protocol.   
 Certified Programs and Proofs (CPP), January 2016.

*   James R. Wilcox, Doug Woos, Pavel Panchekha, Zachary Tatlock, Xi Wang, Michael D. Ernst, and Thomas Anderson.   
Verdi: A Framework for Implementing and Verifying Distributed Systems.   
 Programming Language Design and Implementation (PLDI), June 2015.

*   Hugues Evrard and Frédéric Lang.   
Automatic Distributed Code Generation from Formal Models of Asynchronous Concurrent Processes.   
 Parallel, Distributed, and Network-Based Processing (PDP), March 2015.

*   Heidi Howard, Malte Schwarzkopf, Anil Madhavapeddy, and Jon Crowcroft.   
Raft Refloated: Do We Have Consensus?.   
 SIGOPS Operating Systems Review, January 2015.

*   Heidi Howard.   
ARC: Analysis of Raft Consensus.   
 University of Cambridge, Computer Laboratory, UCAM-CL-TR-857, July 2014.

## Talks

These talks serve as good introductions to Raft:

*    Talk on Raft at CS@Illinois Distinguished Lecture Series by John Ousterhout, August 2016: 
（图：Image 1: preview of the video）

*    Talk on Raft and its TLA+ spec as part of Dr. TLA+ Series by Jin Li, July 2016: 
（图：Image 2: preview of the video）

*    Talk on Raft at Build Stuff 2015 by Diego Ongaro, November 2015: 
（图：Image 3: preview of the video）

*    Talks on Rust, Raft, and distributed systems at Rust Bay Area Meetup by Yvonne Coady, Diego Ongaro, Andrew Hobden, Dan Burkert, and Alex Newman, August 2015: 
（图：Image 4: preview of the video）

*    Talk on Raft at CoreOS Fest 2015 by Diego Ongaro, May 2015: 
（图：Image 5: preview of the video）

*    Talk on Raft at Sourcegraph meetup by Diego Ongaro, April 2015: 
（图：Image 6: preview of the video）

*    Talk on Raft at LinkedIn by Diego Ongaro, September 2014: 
（图：Image 7: preview of the video）

*    Talk on Raft at USI 2014 and /dev/summer 2014 by Arnaud Bailly, July 2014: 
（图：Image 8: preview of the video）

*    Talk on Raft at 2014 USENIX Annual Technical Conference by Diego Ongaro, June 2014: 
（图：Image 9: preview of the video）

*    Talk on Raft at CraftConf 2014 by Diego Ongaro, April 2014: 
（图：Image 10: preview of the video）

*    Talk on Raft at Rubyconf 2013 by Patrick Van Stee, November 2013: 
（图：Image 11: preview of the video）

*    Talk on Raft at RICON West 2013 by Diego Ongaro, October 2013: 
（图：Image 12: preview of the video）

*    Talk on Raft at Strange Loop 2013 by Ben Johnson, September 2013: 
（图：Image 13: preview of the video）

*    Talk on Raft and Rafter at the Erlang NYC Meetup by Tom Santero and Andrew Stone, August 2013: 
（图：Image 14: preview of the video）

*    Talk on Raft (venue unknown) by Patrick Van Stee, July 2013: 
（图：Image 15: preview of the video）

*    Lecture for the Raft User Study by John Ousterhout, March 2013: 
（图：Image 16: preview of the video）

## Courses teaching Raft

This is a list of courses that include lectures or programming assignments on Raft. This might be useful for other instructors and for online learners looking for materials. If you know of additional courses, please submit a pull request or an issue to update it.

*   University of Copenhagen, NDAK18001U Big Data Systems (BDS), Yongluan Zhou and Rodrigo Laigner. Includes lecture on Raft and programming assignments developing fault tolerant systems with Kafka. (Block 2 2021-2025 and Block 4 2026...) 
*   Czech Technical University in Prague, B4B36PDV: Paralelní a distribuované výpočty, Michal Jakob. Includes a lecture on Raft and a programming assignement in Java. (Spring 2026) 
*   The University of Hong Kong, COMP3358: Distributed and Parallel Computing, Heming Cui. Includes lecture on Raft. (Spring 2024) 
*   University of Virginia, CS4740: Cloud Computing, Chang Lou. Includes lecture on Raft and programming assignment (Go). (Spring 2024 ...) 
*   University of California, San Deigo, CSE224: Graduate Networked Systems, George Porter. Includes lecture on Raft and programming assignment (Go) to develop a fault-tolerant Dropbox clone. (Winter 2023/2022, Fall 2020/2019/2018 ...) 
*   Technical University of Munich, IN2259: Distributed Systems, Pramod Bhatotia and Martin Kleppmann. Includes lecture on Raft. (Winter 2022/2023, ...) 
*   University of Illinois Urbana-Champaign, CS425: Distributed Systems, Indranil Gupta, Nikita Borisov, and Radhika Mittal. Includes Raft programming assignment in Go. (Spring 2021, ...) 
*   The Chinese University of Hong Kong, CSCI4160: Distributed and Parallel Computing (Private), Eric Lo. Includes lecture on Paxos and Raft as well as Raft programming assignment in Java/Go (Fall 2019, Spring 2021, ...) 
*   Indian Institute of Technology Delhi, COL 819: Distributed Systems, Smruti R. Sarangi. Includes lecture on Raft (video) (PPTX) (Winter 2020, ...) 
*   Carnegie Mellon University, CS 440: Distributed Systems, Yuvraj Agarwal, Dave Andersen. Includes Raft programming assignment in Go. (Fall 2019, ...) 
*   Northeastern University, CS 3700: Networks and Distributed Systems, Christo Wilson, Long Lu. Includes an assignment to build a replicated key-value store based on the Raft protocol. (Fall 2018, ...) 
*   Institute Technology Bandung, IF3230. Raft assignments with testcases for showcasing edge cases and scoring (2018) 
*   Rose-Hulman Institute of Technology, CS 403: Programming Language Paradigms, Buffalo Hewner. Includes Raft programming assignment in Erlang (assignments). (Winter 2017, ...) 
*   Princeton University, COS-418: Distributed Systems, Mike Freedman and Kyle Jamieson. Includes lecture on Raft (PPTX) and programming assignments to build a Raft-based key-value store. (Fall 2016, ...) 
*   University of Washington, CSE 452: Distributed Systems, Tom Anderson. Includes lecture on Raft, though they call it Paxos. (Winter 2016, ...) 
*   University of Colorado, Boulder, CSCI 5673: Distributed Systems, Shivakant Mishra. Includes assignment to download a Raft implementation and build a fault-tolerant data structure with it. (Fall 2015, ...) 
*   University of Utah, CS 6963: Distributed Systems, Ryan Stutsman (@rstutsman). Will include something about Raft (TBD). (Fall 2015, ...) 
*   San Jose State University, CMPE 275 Enterprise Application Development, John Gash. Includes project to make a distributed filesystem using Raft. (Spring 2015, ...) 
*   Brown, CS 138: Distributed Computer Systems, Tom Doeppner, Rodrigo Fonseca (@rodrigo_fonseca). Includes Raft programming assignment in Go. (Spring 2015, ...) 
*   MIT, 6.824: Distributed Systems, Robert Morris. Includes lecture on Raft (lecture notes). See Jon Gjengset's posts for instructors and students. (Spring 2015, ...) 
*   University of San Francisco, CS 636: Graduate Operating Systems, Greg Benson (@gregorydbenson). Includes lecture on Raft. (Spring 2015, ...) 
*   Harvard, CS 261: Research Topics in Operating Systems, Margo Seltzer. Includes lecture on Raft (lecture notes). (Fall 2014, ...) 
*   University of Houston, COSC 6360: Operating Systems, Jehan-François Pâris (@jehanfrancois). Includes lecture on Raft (PPT). (Fall 2014, ...) 
*   Stanford, CS 244b: Distributed Systems, Dawson Engler, David Mazières (@dmazieres). Included guest lecture on Raft by Diego Ongaro. Several students chose to work on Raft-based final projects. (Fall 2014) 
*   NUST-SEECS, CS 332: Distributed Computing, Tahir Azim (@TahirAzim). Includes lecture on Raft based on user study materials (tweet). (Fall 2014, ...) 
*   Duke, CPS 512: Distributed Systems, Bruce Maggs. Includes guest lecture on Raft (PPTX) by Landon Cox (@lpcox). (Spring 2014, Spring 2015, ...) 
*   IIT Bombay, CS 733: Cloud Computing, Sriram Srinivasan. Includes Raft programming assignment in Go (assignments). (Spring 2014, Spring 2015, ...) 
*   Polytechnic University of Milan, Distributed Systems, Gianpaolo Cugola. 

## Where can I ask questions?

The best place to ask questions about Raft and its implementations is the raft-dev Google group. Some of the implementations also have their own mailing lists; check their READMEs.

## Where can I get Raft?

There are many implementations of Raft available in various stages of development. This table lists the implementations we know about with source code available. The most popular and/or recently updated implementations are towards the top. This information will inevitably get out of date; please submit a pull request or an issue to update it.

| Stars | Name | Primary Authors | Language | License | Leader Election + Log Replication? | Persistence? | Membership Changes? | Log Compaction? |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 9,173★ | hashicorp/raft | Armon Dadgar | Go | MPL-2.0 | Yes | Yes | Yes | Yes |
| 8,970★ | Aeron Cluster | Martin Thompson, Todd L. Montgomery, Michael Barker, Dmitry Vyazelenko | Java | Apache-2.0 | Yes | Yes | Yes | Yes |
| 16,963★ | TiKV | Jay, ngaut, siddontang, tiancaiamao | Rust | Apache-2.0 | Yes | Yes | Yes | Yes |
| 27,013★ | RethinkDB |  | C++ | Apache-2.0 | Yes | Yes | Yes | Yes |
| 4,237★ | braft | Zhangyi Chen, Yao Wang | C++ | Apache-2.0 | Yes | Yes | Yes | Yes |
| 2,127★ | Openraft | Yanpo Zhang, Anthony Dodd | Rust | Apache-2.0 or MIT | Yes | Yes | Yes | Yes |
| 1,967★ | .NEXT Raft | Roman Sakno | C# | MIT | Yes | Yes | Yes | Yes |
| 12,473★ | nebula-graph-storage | Sherman Ye, Doodle Wang | C++ | Apache-2.0 | Yes | Yes | Yes | Yes |
| 5,328★ | dragonboat | Lei Ni | Go | Apache-2.0 | Yes | Yes | Yes | Yes |
| 1,227★ | raft-java | Wenwei Hu | Java | Apache-2.0 | Yes | Yes | Yes | Yes |
| 3,821★ | SOFAJRaft | Boyan, Jiachun | Java | Apache-2.0 | Yes | Yes | Yes | Yes |
| 1,973★ | LogCabin | Diego Ongaro | C++ | ISC | Yes | Yes | Yes | Yes |
| 15,854★ | Seastar Raft | Gleb Natapov, Konstantin Osipov, Pavel Solodovnikov, Alejo Sanchez, Kamil Braun, Tomash Grabiec | C++20 | AGPL | Yes | Yes | Yes | Yes |
| 1,209★ | NuRaft | Jung-Sang Ahn | C++ | Apache-2.0 | Yes | Yes | Yes | Yes |
| 979★ | Ra | Team RabbitMQ | erlang | (Apache-2.0 OR MPL-1.1) | Yes | Yes | Yes | Yes |
| 1,158★ | etcd-io/raft | Blake Mizerany, Xiang Li, Yicheng Qin | Go | Apache-2.0 | Yes | Yes | Yes | Yes |
| 6,636★ | hazelcast-raft | Mehmet Dogan, Ensar Basri Kahveci | Java | Apache-2.0 | Yes | Yes | Yes | Yes |
| 1,490★ | Apache Ratis | Tsz-Wo (Nicholas) Sze | Java | Apache-2.0 | Yes | Yes | Yes | Yes |
| 1,092★ | async-raft | Anthony Dodd | Rust | Apache-2.0 or MIT | Yes | Yes | Yes | Yes |
| 2,428★ | go-raft (archived) | Ben Johnson, Xiang Li, CoreOS) | Go | MIT | Yes | Yes | No | Yes |
| 3,686★ | Tarantool | Vladislav Shpilevoy, Sergey Petrenko | C | BSD 2-Clause | Yes | Yes | Yes | Yes |
| 1,173★ | willemt/raft | Willem-Hendrik Thiart | C | BSD | Yes | Yes | Yes | Yes |
| 760★ | bakwc/PySyncObj | Filipp Ozinov | Python | MIT | Yes | Yes | Yes | Yes |
| 361★ | raftos | Alexander Zhebrak | Python | MIT | Yes |  | No | No |
| 426★ | Permazen/RaftKVDatabase | Archie Cobbs | Java | Apache-2.0 | Yes | Yes | Yes | Yes |
| 1,919★ | Kudu | David Alves, Todd Lipcon, Mike Percy | C++ | Apache-2.0 | Yes | Yes | Yes | Yes |
| 1,439★ | eliben/raft | Eli Bendersky | Go | Unlicense | Yes | Yes | No | No |
| 314★ | simpleRaft (archived) | Sean Reed | Python | MIT | No |  | No | No |
| 327★ | kanaka/raft.js | Joel Martin | Javascript | MPL-2.0 | Yes |  | Yes | No |
| 607★ | waraft | WhatsApp | Erlang | Apache-2.0 | Yes | Yes | Yes | Yes |
| 450★ | Juno (archived) | Brian Schroeder, Libby Kent, Stuart Popejoy, Will Martino | Haskell | BSD | No |  | No | No |
| 483★ | OpenDaylight | Moiz Raja, Kamal Rameshan, Robert Varga, Tom Pantelis | Java | EPL-1.0 | Yes | Yes | No | Yes |
| 273★ | Cornerstone | Andy Chen | C++ | Apache-2.0 | Yes | Yes | Yes | Yes |
| 259★ | MicroRaft | Ensar Basri Kahveci | Java | Apache-2.0 | Yes | Yes | Yes | Yes |
| 289★ | eraft | JieLiu, FengLin Zou, WeiZheng Wu, JiaCheng Huang, BiYong Liu, Zichen Xu | C++ | MIT | Yes | Yes | Yes | Yes |
| 843★ | RedisRaft | Redis Labs | C | (AGPL-3.0 OR RSAL) | Yes | Yes | Yes | Yes |
| 286★ | jgroups-raft | Bela Ban | Java | Apache-2.0 | Yes | Yes | Yes | Yes |
| 271★ | hoverbear/raft (archived) | Andrew Hobden, Dan Burkert | Rust | MIT | Yes |  | No | No |
| 179★ | Raft.Net | hhblaze@gmail.com | C# | BSD-2-Clause License | Yes | Yes | Yes | Yes |
| 116★ | ocaml-raft (archived) | Heidi Howard | OCaml | MIT | Yes |  | No | No |
| 182★ | jraft | Andy Chen | Java | Apache-2.0 | Yes | Yes | Yes | Yes |
| 158★ | Zatt | Simon Accascina | Python | AGPL-3.0 | Yes | Yes | Yes | Yes |
| 247★ | liferaft | Arnout Kazemier | Javascript | MIT | No |  | No | No |
| 200★ | akiradeveloper/lol | Akira Hayakawa | Rust | MIT | Yes | Yes | Yes | Yes |
| 204★ | verdi-raft | James Wilcox, Doug Woos, Pavel Panchekha, Zach Tatlock, Xi Wang, Mike Ernst, Tom Anderson | Coq | BSD | Yes |  | No | No |
| 58★ | miniraft-cpp | Aleksei Ozeritskii | C++ | BSD | Yes | Yes | No | No |
| 271★ | rafter | Andrew Stone | Erlang | Apache-2.0 | No |  | No | No |
| 216★ | ckite (archived) | Pablo Medina | Scala | Apache-2.0 | Yes | Yes | Yes | Yes |
| 282★ | akka-raft (archived) | Konrad Malawski | Scala | Apache-2.0 | Yes | Yes | Yes | Yes |
| 53★ | raft-clj | John Weaver | Clojure | EPL-1.0 | No |  | No | No |
| 89★ | cowsql/raft | Free Ekanayaka | C | LGPL-3.0 Linking Exception | Yes | Yes | Yes | Yes |
| 121★ | kontiki | Nicolas Trangez | Haskell | BSD | No |  | No | No |
| 137★ | skiff | Pedro Teixeira | Javascript | ISC | Yes | Yes | Yes | Yes |
| 40★ | raft-kotlin | Sasha Chepurnoi | Kotlin | MIT | Yes |  | Yes | No |
| 19★ | Kommander | Andres Gutierrez | C# | MIT | Yes |  | Yes | Yes |
| 240★ | xraft | XnnYygn | Java | MIT | Yes | Yes | Yes | Yes |
| 25★ | zaft | Lukasz Wala | Zig | MIT | Yes | Yes | No | No |
| 73★ | RaftCore (archived) | Guillermo Rodríguez | C# | MIT | Yes |  | No | No |
| 53★ | Raft-php | Waqee Khalid | PHP | MIT | Yes |  | No | No |
| 28★ | ScaleCube Raft Leader Election | ScaleCube | Java | Apache-2.0 | Yes |  | No | No |
| 163★ | zraft_lib | Gunin Alexander | Erlang | Apache-2.0 | Yes | Yes | Yes | Yes |
| 78★ | NRaft | Bert Willems | C# | MIT | No |  | No | No |
| 171★ | peterbourgon/raft (archived) | Peter Bourgon | Go | BSD-2-Clause | Yes |  | Yes | No |
| 49★ | Raft Lite | Liangrun Da | Rust | MIT | Yes | Yes | No | No |
| 20★ | Tube | Jason E. Aten, Ph.D. | Go | BSD-3-Clause | Yes | Yes | Yes | Yes |
| 65★ | Gondola (archived) | Patrick Chan, Wei-Cheng Pan | Java | New BSD | Yes |  | Yes | No |
| 22★ | raft4s | Alireza Meskin | Scala | Apache-2.0 | Yes | Yes | Yes | Yes |
| 58★ | archie/raft | Marcus Ljungblad | Scala | MIT | No |  | No | No |
| 41★ | foros | Wonguk Jeong | C++ | Apache-2.0 | Yes | Yes | No | No |
| 16★ | python3-raft | Arun Sharma, Sean Reed | Python | MIT | No | Yes | Yes | No |
| 95★ | barge (archived) | Dave Rusek | Java | Apache-2.0 | Yes |  | No | No |
| 34★ | ORaft | Mitsunori Komatsu | OCaml | Apache-2.0 | Yes |  | No | No |
| 105★ | allengeorge/libraft (archived) | Allen George | Java | BSD | Yes |  | No | No |
| 54★ | srned/Prez | Sureshkumar Nedunchezhian | C | BSD | Yes |  | No | No |
| 36★ | C5 replicator (archived) | Ryan Rawson, Alex Newman, Josh Greenberg | Java | Apache-2.0 | Yes | Yes | Yes | Yes |
| 37★ | xzwRaft | xzw | Java | Apache-2.0 | Yes | Yes | No | No |
| 55★ | Vesper | Nicola Manzini, Peng Ding | Python | MIT | Yes |  | Yes | No |
| 152★ | Qihoo360/raft | ZongzhiChen, AnAnZhao, KangWang | C++ | GPL-3.0 | Yes |  | No | No |
| 125★ | harryw/raft | Harry Wilkinson | Ruby | MIT | No |  | No | No |
| 34★ | ØMQ Raft for node.js | Rafał Michalski | Javascript | LGPL-3.0 | Yes | Yes | Yes | Yes |
| 40★ | tetrapods/raft | Aaron Davidson | Java | Apache-2.0 | Yes | Yes | No | Yes |
| 11★ | tuannh982/sraft (archived) | Tuan Nguyen Huu | Java | MIT | Yes | No | No | No |
| 53★ | dupdob/RAFTiNG | Cyrille Dupuydauby | C# | Apache-2.0 | No |  | No | No |
| 13★ | gatekv | Emilie PERETTI | Rust | MIT OR Apache-2.0 | Yes | Yes | No | No |
| 8★ | cafe-raft | Thai Van | Java | Apache-2.0 | Yes | Yes | No | No |
| 11★ | Anchor | Salah Allag | Go | MIT | Yes | Yes | Yes | Yes |
| 6★ | @maboke123/raft-core | Mathias Bouhon Keulen | TypeScript | MIT | Yes | Yes | Yes | Yes |
| 25★ | mind1949/raft | lianjie zhu | Go | MIT | Yes | Yes | Yes | No |
| 29★ | aioraft | lisael | Python | AGPL-3.0+ | No | No | Yes | No |
| 64★ | gaggle | Ben Ng | Javascript | MIT | Yes |  | No | No |
| 38★ | aurora | arthur | C++ | GPL-3.0 | Yes |  | Yes | No |
| 7★ | raft-angular | Dushyant Sabharwal | Angular 4 | MIT | Yes |  | Yes | No |
| 31★ | tf-Raft | Fawzi Abdulfattah | TypeScript | MIT | Yes | Yes | Yes | No |
| 77★ | floss (archived) | Alexander Flatter | Ruby | MIT | No |  | No | No |
| 34★ | lewiszlw/raft (archived) | Linwei Zhang | Rust | MIT | Yes | Yes | Yes | Yes |
| 39★ | xingyif/raft | Yifan Xing | Python | Apache-2.0 | Yes | Yes | Yes | Yes |
| 8★ | atomix (archived) (archived) | Jordan Halterman | Java | Apache-2.0 | Yes | Yes | Yes | Yes |
| 91★ | py-raft | Toby Burress | Python | Unlicense | No | No | Yes | No |
| 17★ | Raft-SPIN | Xingyu Xie | PROMELA | MIT | Yes | Yes | No | No |
| 5★ | scalaraft | Kim Je Min | Scala | Apache-2.0 | No |  | No | No |
|  | PyRaft | Yibu Ma | Python | BSD-3-Clause | Yes | Yes | Yes | Yes |
| 23★ | simple-raft-rs | jessa0, Signal Messenger | Rust | AGPL-3.0-or-later | Yes | No | No | No |
| 15★ | IvanProdaiko94/raft-protocol-implementation | Ivan Prodaiko | Go | MIT | Yes |  | No | No |
| 12★ | raftz | Matt Burdan | Zig | MIT | Yes | Yes | Yes | Yes |
| 21★ | pontoon | Matt Reiferson | Go | N/A | No |  | No | No |
| 14★ | graft | Ben Mills, William Dix | Go | N/A | No |  | No | No |
|  | RaftChat (archived) | SoonWon Moon, Bumsung Baek | Rust | MIT | Yes | No | No | No |
| 20★ | melee | Fredrick Galoso | Clojure | EPL-1.0 | No |  | No | No |
| 22★ | RSM | Olivier Paugam | Rust | MIT | Yes | Yes | No | Yes |
| 7★ | rasp | Kristian Brünn | C/C++ (Arduino) | MIT | Yes |  | No | No |
| 25★ | Flotten | Henrik Feldt | F# | MIT | No |  | No | No |
| 21★ | rafute | Yuki Ito | Elixir | MIT | Yes |  | No | No |
| 10★ | dataleading/easyRaft | Shanliang Shen | Java | Apache-2.0 | Yes |  | No | No |
| 5★ | nidus | Ryan Siemens | Python | MIT | Yes | Yes | No | No |
| 13★ | dannycoates/raft-core | Danny Coates | Javascript | BSD | No |  | No | No |
| 33★ | Chillaxd | Yassine Lamgarchal | Python | Apache-2.0 | Yes |  | No | No |
| 21★ | cppa-raft | Zhang Yichao | C++ | MIT | No |  | No | No |
| 13★ | santhosh-tekuri/raft | Santhosh Kumar Tekuri | Go | Apache-2.0 | Yes | Yes | Yes | Yes |
| 16★ | d-raft | Dengos Wei | C++ | Apache-2.0 | Yes |  | No | No |
| 15★ | r4j | Kaarel Kann | Java | Apache-2.0 | Yes |  | No | No |
|  | corgy-w/rafting | corgy-w | Java | Apache-2.0 | Yes | Yes | Yes | Yes |
| 13★ | Raft-Omnet | Edoardo Venir, Leonardo Ruzza | Omnet++ | Apache-2.0 | Yes | Yes | Yes | Yes |
|  | docflex/Raft-Consensus | Rehber Moin | Java | MIT | Yes | Yes | Yes | Yes |
| 15★ | Riff | Aaron Pritzlaff | Scala | Apache-2.0 | Yes | Yes | Yes | Yes |
| 9★ | RaftShop | Matteo Berti, Arnaldo Cesco , Salvatore Fiorilla | Jolie | LGPL | Yes |  | No | No |
| 7★ | LENSHOOD/go-raft | Zhang Xuhai | Go | MIT | Yes | No | No | No |
|  | raftpp | zwk | C++ | Apache-2.0 | Yes | Yes | Yes | Yes |
| 13★ | huckleberry | Jakob Sievers | Erlang | N/A | No |  | No | No |
| 7★ | Raft4WS | Filipe Campos | Java | Apache-2.0 | Yes |  | No | No |
| 6★ | Trabica | Hossam Karim | Scala | MIT | Yes | Yes | Yes | No |
|  | goraft | Edward Jin, Henry Lin, Dhylan Patel | Go | MIT | Yes | Yes | No | Yes |
|  | pvilas/raft | Pere Vilas | Java | N/A | No |  | No | No |
| 13★ | noeleo/raft | Noel Moldvai, Rohit Turumella, Josh Muhlfelder, James Butkovic | Bloom | BSD-2-Clause | No | No | No | No |
| 7★ | dinghy (archived) | Trevor Bernard | Clojure | Apache-2.0 | No |  | No | No |
|  | irapuan/raft_on_microbit | Irapuan Bottosso | MicroPython | MIT | Yes | No | No | No |
| 6★ | draft | Patrick Van Stee | Elixir | N/A | No |  | No | No |
| 9★ | meatcompute/raft-consensus | Mikaela Patella | Clojure | EPL-1.0 | No |  | No | No |
| 8★ | yora | Huy Le | Ruby | MIT | Yes |  | Yes | No |
| 8★ | whitewater | Adam Midvidy, Anh Mai, Karoun Kasraie, Sanketh Katta | Bloom | MIT | No |  | No | No |
| 5★ | seaturtles | Lionel Barrow | Go | N/A | No |  | No | No |
| 6★ | Rub-Raft | zhyzhyzhy | Java | Apache-2.0 | Yes | Yes | Yes | Yes |
| 5★ | RaftUDP | Emanuele Gallone | Python | MIT | Yes |  | No | No |
| 5★ | fxsjy/Ins | Junyi Sun | C++ | BSD | Yes | Yes | No | Yes |
| 7★ | huntlabs/hunt-raft | huntlabs | D | Apache-2.0 | Yes | Yes | Yes | Yes |
| 6★ | viile/raft | viile | D | MIT | Yes |  | No | No |
|  | GlucoRAFT | Shreyas | Python | MIT | Yes |  | Yes | No |
| 7★ | Raft-JVM | Tim Kellogg | Java | N/A | No |  | No | No |
| 6★ | giraft | Patrick Van Stee | Ruby | MIT | No |  | No | No |
|  | drpicox/uoc-raft-2013p | David Rodenas | Java | GPL-3.0 | No |  | No | No |
|  | zodiac-prime | Evan Phoenix | Ruby | MIT | No |  | No | No |
| 5★ | rafterl | Eric Moritz | Erlang | N/A | No |  | No | No |
|  | fz0raft | Evangelos Tsamis | F# | MIT | Yes |  | No | Yes |
|  | feeyo-raft | AMing Zhu | Java | BSD-3-Clause | Yes | Yes | Yes | Yes |
| 5★ | bspolley/raft | Alex Kaiser, Brennan Polley, Helen Weng | Bloom | N/A | No |  | No | No |
|  | fsraft | Karl-Johan Nilsson | F# | Unlicense | No |  | No | No |
|  | chelan | Eric Jutrzenka | Scala | N/A | Yes |  | No | No |
|  | cb372/raft | Chris Birchall | Scala | N/A | No |  | No | No |
|  | PecanRaft | Priyanshu Sharma | Java | Apache-2.0 | Yes | Yes | Yes | No |
|  | jalvaro/raft | Jordi Alvaro | Java | N/A | No |  | No | No |
|  | mruby-flotte | Hendrik | mruby | Apache-2.0 | Yes |  | No | No |
|  | lite-raft | Luigi Tarenga | Shell | MIT | Yes | Yes | Yes | Yes |

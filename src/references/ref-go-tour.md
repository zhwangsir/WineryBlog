---
title: A Tour of Go
category: 参考资料
source: https://go.dev/tour/concurrency
summary: 本地镜像：A Tour of Go（原文 go.dev）
---

> 本文档为站内参考资料，抓取自原文并整理，供离线学习。原文：https://go.dev/tour/concurrency

（图：Image 1）
A Tour of Go

（图：Image 2: System theme）

（图：Image 3: Dark theme）

（图：Image 4: Light theme）

*   Using the tour
    *   Welcome!
        *   Hello, 世界
        *   Go local
        *   Go offline (optional)
        *   The Go Playground
        *   Congratulations

*   Basics
    *   Packages, variables, and functions.
        *   Packages
        *   Imports
        *   Exported names
        *   Functions
        *   Functions continued
        *   Multiple results
        *   Named return values
        *   Variables
        *   Variables with initializers
        *   Short variable declarations
        *   Basic types
        *   Zero values
        *   Type conversions
        *   Type inference
        *   Constants
        *   Numeric Constants
        *   Congratulations!

    *   Flow control statements: for, if, else, switch and defer
        *   For
        *   For continued
        *   For is Go's "while"
        *   Forever
        *   If
        *   If with a short statement
        *   If and else
        *   Exercise: Loops and Functions
        *   Switch
        *   Switch evaluation order
        *   Switch with no condition
        *   Defer
        *   Stacking defers
        *   Congratulations!

    *   More types: structs, slices, and maps.
        *   Pointers
        *   Structs
        *   Struct Fields
        *   Pointers to structs
        *   Struct Literals
        *   Arrays
        *   Slices
        *   Slices are like references to arrays
        *   Slice literals
        *   Slice defaults
        *   Slice length and capacity
        *   Nil slices
        *   Creating a slice with make
        *   Slices of slices
        *   Appending to a slice
        *   Range
        *   Range continued
        *   Exercise: Slices
        *   Maps
        *   Map literals
        *   Map literals continued
        *   Mutating Maps
        *   Exercise: Maps
        *   Function values
        *   Function closures
        *   Exercise: Fibonacci closure
        *   Congratulations!

*   Methods and interfaces
    *   Methods and interfaces
        *   Methods
        *   Methods are functions
        *   Methods continued
        *   Pointer receivers
        *   Pointers and functions
        *   Methods and pointer indirection
        *   Methods and pointer indirection (2)
        *   Choosing a value or pointer receiver
        *   Interfaces
        *   Interfaces are implemented implicitly
        *   Interface values
        *   Interface values with nil underlying values
        *   Nil interface values
        *   The empty interface
        *   Type assertions
        *   Type switches
        *   Stringers
        *   Exercise: Stringers
        *   Errors
        *   Exercise: Errors
        *   Readers
        *   Exercise: Readers
        *   Exercise: rot13Reader
        *   Images
        *   Exercise: Images
        *   Congratulations!

*   Generics
    *   Generics
        *   Type parameters
        *   Generic types
        *   Congratulations!

*   Concurrency
    *   Concurrency
        *   Goroutines
        *   Channels
        *   Buffered Channels
        *   Range and Close
        *   Select
        *   Default Selection
        *   Exercise: Equivalent Binary Trees
        *   Exercise: Equivalent Binary Trees
        *   sync.Mutex
        *   Exercise: Web Crawler
        *   Where to Go from here...

## Goroutines

A _goroutine_ is a lightweight thread managed by the Go runtime.

go f(x, y, z)
starts a new goroutine running

f(x, y, z)
The evaluation of `f`, `x`, `y`, and `z` happens in the current goroutine and the execution of `f` happens in the new goroutine.

Goroutines run in the same address space, so access to shared memory must be synchronized. The `sync` package provides useful primitives, although you won't need them much in Go as there are other primitives. (See the next slide.)

<1/11>

goroutines.goSyntaxImports

19

1

package main

2

​

3

import (

4

 "fmt"

5

 "time"

6

)

7

​

8

func say(s string) {

9

 for i := 0; i < 5; i++ {

10

  time.Sleep(100 * time.Millisecond)

11

  fmt.Println(s)

12

 }

13

}

14

​

15

func main() {

16

 go say("world")

17

 say("hello")

18

}

19

​

RunKillFormatReset

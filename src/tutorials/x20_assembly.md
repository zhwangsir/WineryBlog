---
title: 汇编语言入门：CPU 在想什么
category: 计算机组成
order: 2
tags: [汇编, CPU, 寄存器, 计算机组成]
summary: 寄存器、内存寻址、栈与函数调用——读懂 CPU 视角的世界，看清高级语言之下的机器。
---

## 1. 为什么要学汇编

不是让你手写汇编，而是：调试看得懂崩溃栈、性能分析看得懂反汇编、理解缓冲区溢出（安全方向基石）。**汇编 = CPU 执行指令的直接文本化。**

```
C 语言:      x = a + b;
编译器生成:  mov eax, [a]     ; 把变量 a 从内存搬进寄存器 eax
             add eax, [b]     ; 加上 b
             mov [x], eax     ; 存回 x
```

CPU 只认识"从哪取数、做什么运算、结果放哪"。

## 2. 寄存器：CPU 的口袋

x86-64 的通用寄存器（每个 64 位）：

| 寄存器 | 惯例用途 |
| --- | --- |
| rax | 返回值 / 算术 |
| rbx, rcx, rdx, rsi, rdi | 通用 / 参数 |
| rsp | 栈顶指针 |
| rbp | 当前栈帧基址 |
| rip | **下一条指令地址**（程序计数器） |

函数调用约定（System V）：前 6 个整型参数依次放 `rdi, rsi, rdx, rcx, r8, r9`，返回值放 `rax`。看反汇编前先背这张表。

## 3. 高频指令 Top 10

```nasm
mov rax, rbx        ; 传送：rax = rbx
mov rax, [rdi]      ; 内存读：rax = rdi 指向的内存内容（[] 解引用）
add rax, 1          ; 加
sub rax, rbx        ; 减
imul rax, rbx       ; 乘
xor rax, rax        ; 异或自己 = 清零（惯用法）
cmp rax, 0          ; 比较（设置标志位）
je  label           ; 相等则跳（jump if equal）
jmp label           ; 无条件跳
call func / ret     ; 调用 / 返回
push rax / pop rax  ; 压栈 / 出栈
```

条件组合：`je`（等于）、`jne`（不等）、`jl/jg`（小于/大于）——if 语句在汇编里就是 cmp + 条件跳转。

## 4. 内存寻址：变量的真身

```nasm
mov al,  [rdi]              ; 读 1 字节
mov ax,  [rdi]              ; 读 2 字节
mov eax, [rdi]              ; 读 4 字节
mov rax, [rdi + 8]          ; 基址 + 偏移（结构体成员/数组元素）
mov rax, [rdi + rcx*8]      ; 数组下标访问：base + i*8
```

`[rdi + rcx*8]` 正是 `arr[i]` 的机器形态——数组下标本质是地址算术，这也是越界访问能摸到相邻内存的原因。

## 5. 栈与函数调用

每次 `call` 都在栈上压一个**栈帧**：

```nasm
func:
    push rbp            ; 保存调用者的栈帧基址
    mov  rbp, rsp       ; 建立自己的栈帧
    sub  rsp, 16        ; 给局部变量留空间
    ; ... 函数体 ...
    mov  rsp, rbp       ; 恢复栈顶
    pop  rbp            ; 恢复调用者栈帧
    ret                 ; 弹出返回地址到 rip
```

**缓冲区溢出的原理**：局部数组（如 `char buf[8]`）在栈帧里，写满 8 字节还继续写就会覆盖栈上更高地址处的**返回地址**——攻击者塞入自己的地址，`ret` 时 rip 就跳去执行攻击者的代码。理解了栈帧 layout，就理解了溢出攻击与防护（栈金丝雀/DEP）为什么长那样。

## 6. 一个完整例子：函数三数求和

```c
int add3(int a, int b, int c) { return a + b + c; }
```

```nasm
add3:
    lea eax, [rdi + rsi]    ; eax = a + b（lea 是"算地址"指令，常被用来做算术）
    add eax, edx            ; eax += c
    ret                     ; 返回值已在 rax（eax 是其低 32 位）
```

编译器优化后连栈都不用开——参数全在寄存器里。

## 7. 动手环境

```bash
# Linux 下最短的实验回路
gcc -O0 -S demo.c -o demo.s    # 输出汇编文本（-O0 便于阅读）
objdump -d a.out               # 反汇编二进制
gdb a.out                      # 布置断点后: disass / info registers
```

初学建议把 `-O2` 关掉（`-O0`），先看"直白版"汇编，再对照优化版感受编译器的魔法（内联、循环展开、指令重排）。

## 延伸阅读

- 站内相关：《计算机组成：硬件架构与各种处理单元》《操作系统核心概念》《文件上传漏洞原理、利用与防御》
- 《CSAPP 深入理解计算机系统》第 3 章——机器级程序
- Intel 汇编语法速查（vs AT&T：操作数方向相反）

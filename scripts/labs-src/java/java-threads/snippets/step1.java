class UnsafeCounter implements Counter {
    int count = 0;
    void increment() { count++; }     // 最朴素的写法：读 → 加 1 → 写回，三步之间可能被别的线程插进来
    int get() { return count; }
}
System.out.println("不加保护：期望 " + (2 * TIMES) + "，实际 " + race(new UnsafeCounter()));
// 不加保护：期望 200000，实际 十几万（每次运行都不同，几乎总是小于 200000）

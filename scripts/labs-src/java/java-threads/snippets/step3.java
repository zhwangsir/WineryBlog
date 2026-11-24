class AtomicCounter implements Counter {
    AtomicInteger count = new AtomicInteger(0);
    void increment() { count.incrementAndGet(); }   // CPU 原子指令：加 1 不可分割，不需要锁
    int get() { return count.get(); }
}
System.out.println("AtomicInteger：期望 " + (2 * TIMES) + "，实际 " + race(new AtomicCounter()));
// AtomicInteger：期望 200000，实际 200000

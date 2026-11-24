import java.util.concurrent.atomic.AtomicInteger;

// ===== 实验装置（三步都用它） =====

// 计数器的统一接口：三步分别换不同的实现，实验装置保持不变
interface Counter {
    void increment();
    int get();
}

// 每个线程自增的次数（两个线程加起来，正确的结果应该是 200000）
int TIMES = 100_000;

// 两个线程同时对同一个计数器各自自增 TIMES 次，等它们都结束后返回最终值
int race(Counter c) throws InterruptedException {
    Runnable task = () -> {
        for (int i = 0; i < TIMES; i++) c.increment();
    };
    Thread t1 = new Thread(task);
    Thread t2 = new Thread(task);
    t1.start();
    t2.start();
    t1.join();    // 等两个线程都跑完，再读结果
    t2.join();
    return c.get();
}

// ===== Step 1：不加任何保护——复现竞态 =====
// count++ 不是一步完成的：先读出 count、加 1、再写回。两个线程交错执行时会互相覆盖对方的结果
class UnsafeCounter implements Counter {
    int count = 0;
    void increment() { count++; }
    int get() { return count; }
}
System.out.println("不加保护：期望 " + (2 * TIMES) + "，实际 " + race(new UnsafeCounter()));
// 实际值几乎总是小于 200000，而且每次运行都不一样

// ===== Step 2：用 synchronized 修复 =====
// 同一时刻只允许一个线程进入这个方法，其它的线程在门外等着
class SyncCounter implements Counter {
    int count = 0;
    synchronized void increment() { count++; }
    int get() { return count; }
}
System.out.println("synchronized：期望 " + (2 * TIMES) + "，实际 " + race(new SyncCounter()));
// 200000

// ===== Step 3：用 AtomicInteger 修复 =====
// incrementAndGet 由 CPU 的原子指令保证「读—加—写」不可分割，不需要加锁
class AtomicCounter implements Counter {
    AtomicInteger count = new AtomicInteger(0);
    void increment() { count.incrementAndGet(); }
    int get() { return count.get(); }
}
System.out.println("AtomicInteger：期望 " + (2 * TIMES) + "，实际 " + race(new AtomicCounter()));
// 200000

import java.util.concurrent.atomic.AtomicInteger;

// 点右上角的「运行」：下面的代码会被粘贴进右侧的 jshell 逐段求值，System.out.println 的内容原样显示

// ===== 实验装置（已写好，三步都用它） =====

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
class UnsafeCounter implements Counter {
    int count = 0;
    void increment() {
        // TODO（Step 1）：写最朴素的实现 count++，然后点「运行」，把实际结果和期望值比一比
    }
    int get() { return count; }
}
System.out.println("不加保护：期望 " + (2 * TIMES) + "，实际 " + race(new UnsafeCounter()));

// TODO（Step 2）：照着 UnsafeCounter 写一个 SyncCounter，给 increment 方法加上 synchronized，
//   再打印一行「synchronized：期望 200000，实际 …」

// TODO（Step 3）：写一个 AtomicCounter：字段换成 AtomicInteger，自增用 incrementAndGet，
//   再打印一行「AtomicInteger：期望 200000，实际 …」

class SyncCounter implements Counter {
    int count = 0;
    synchronized void increment() { count++; }   // 进门先拿锁：别的线程只能在外面等
    int get() { return count; }
}
System.out.println("synchronized：期望 " + (2 * TIMES) + "，实际 " + race(new SyncCounter()));
// synchronized：期望 200000，实际 200000

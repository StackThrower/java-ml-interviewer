# Java Concurrency

## Key concepts
Threads share heap memory; the Java Memory Model (JMM) defines visibility and ordering through happens-before relationships. synchronized provides mutual exclusion and visibility (unlock happens-before subsequent lock on the same monitor). volatile guarantees visibility and ordering of a single variable but not atomicity of compound operations like count++. Atomic classes (AtomicInteger, LongAdder) use CAS for lock-free updates; LongAdder scales better under contention.

Locks: ReentrantLock adds tryLock, timeouts, fairness and multiple Conditions. ReadWriteLock and StampedLock for read-heavy workloads. Deadlock needs mutual exclusion, hold-and-wait, no preemption and circular wait; prevent it with consistent lock ordering or timeouts.

Executors: prefer ExecutorService over raw threads; choose pool sizes by workload (CPU-bound near the number of cores, IO-bound larger). Unbounded queues can hide overload and cause memory growth. CompletableFuture composes async work (thenApply, thenCompose, allOf, exceptionally); be careful about which executor runs the callbacks (default is the common ForkJoinPool).

Virtual threads (Java 21, Project Loom) are cheap, JVM-managed threads ideal for blocking IO-heavy workloads; avoid pinning (long synchronized blocks around blocking IO on older JDKs) and do not pool them. Structured concurrency groups related subtasks. ThreadLocal leaks are a risk in pooled threads.

## Core questions
Junior: Difference between a process and a thread? What does synchronized do? What is a race condition, with an example?
Middle: What is the difference between volatile and synchronized? Why is count++ not thread-safe even if count is volatile? How do you size a thread pool? What is a deadlock and how do you avoid it?
Senior: Explain happens-before and give examples. When would you choose virtual threads over a reactive framework? How would you debug a production service where threads are stuck? Explain safe publication and double-checked locking.

## Follow-up probes
If they mention volatile: ask whether volatile makes increment atomic. If they mention a thread pool: ask what happens when the queue is full and what rejection policies exist. If they mention CompletableFuture: ask where callbacks run and how exceptions propagate. If they mention virtual threads: ask what pinning is. For debugging: ask what a thread dump shows and how to spot a deadlock in it.

## Evaluation rubric
Strong signals: precise about visibility vs atomicity; understands happens-before; knows executor configuration trade-offs (bounded queues, rejection policies); can reason about deadlocks and contention; realistic understanding of virtual threads.
Weak signals: thinks volatile solves all concurrency issues; creates new threads per request; cannot describe a race condition concretely; no idea how to diagnose a hang.

## Red flags
Suggests Thread.sleep to fix race conditions; synchronizes on everything without considering contention; uses unbounded thread creation in a server.

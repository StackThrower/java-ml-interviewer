# JVM Internals and Performance

## Key concepts
JVM memory areas: heap (young generation with Eden and survivor spaces, old generation), metaspace for class metadata (native memory, replaced PermGen in Java 8), thread stacks, code cache and direct buffers. Objects are usually allocated in thread-local allocation buffers in Eden.

Garbage collection: generational hypothesis — most objects die young. Minor GCs collect the young generation; objects that survive enough cycles are promoted. G1 is the default collector: region-based, aims for a pause-time goal. ZGC and Shenandoah are low-latency concurrent collectors with very short pauses even on large heaps. Parallel GC maximises throughput. GC tuning starts with measurement: GC logs, allocation rate, pause times, heap after GC.

Class loading: bootstrap, platform and application class loaders using parent delegation; loading, linking (verification, preparation, resolution) and initialization. Classloader leaks happen in app servers when references keep old classloaders alive.

JIT: code starts interpreted; hot methods are compiled by C1 and then C2 (tiered compilation) with optimisations such as inlining, escape analysis and lock elision. Benchmarks need warm-up; use JMH.

Diagnosing problems: OutOfMemoryError types (Java heap space, Metaspace, GC overhead limit, unable to create native thread); heap dumps with jcmd or -XX:+HeapDumpOnOutOfMemoryError and analysis with Eclipse MAT; thread dumps with jstack or jcmd; profiling with async-profiler or Java Flight Recorder. In containers, the JVM respects cgroup memory limits; set -XX:MaxRAMPercentage rather than a hard-coded heap.

## Core questions
Junior: What is the difference between stack and heap? What does the garbage collector do? What is the JVM vs JRE vs JDK?
Middle: Explain generational garbage collection. What causes a memory leak in Java if there is a GC? How would you investigate an OutOfMemoryError in production?
Senior: How do you choose between G1, ZGC and Parallel GC? A service has p99 latency spikes every few minutes — how do you investigate? How should you configure JVM memory in Kubernetes containers?

## Follow-up probes
If they mention memory leaks: ask for concrete examples (static collections, caches without eviction, listeners, ThreadLocal). If they mention a heap dump: ask what they look for (dominator tree, retained size). If they mention GC tuning: ask what metrics they would collect first. If they mention containers: ask about the relationship between heap size and the container memory limit (non-heap memory).

## Evaluation rubric
Strong signals: clear model of heap regions and generations; knows how leaks happen despite GC; has a structured approach to production diagnosis (logs, dumps, profilers); understands collector trade-offs latency vs throughput; container-aware memory settings.
Weak signals: only knows "GC frees memory"; would immediately increase -Xmx without investigation; cannot name any diagnostic tool.

## Red flags
Calls System.gc as a fix; believes Java cannot have memory leaks; sets heap equal to the container limit.

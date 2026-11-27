# Java Collections

## Key concepts
Core interfaces: List, Set, Queue/Deque, Map. ArrayList is backed by a resizable array: O(1) amortized append and random access, O(n) insert in the middle. LinkedList has O(1) insert at known nodes but poor cache locality, so ArrayList or ArrayDeque usually win in practice.

HashMap internals: an array of buckets indexed by a spread of hashCode; collisions form a linked list that is converted to a red-black tree when a bucket exceeds 8 entries (and table size is at least 64), giving O(log n) worst case. Default load factor 0.75; when size exceeds capacity times load factor the table doubles and entries are redistributed. HashMap allows one null key; it is not thread-safe. LinkedHashMap preserves insertion or access order (useful for LRU caches via removeEldestEntry). TreeMap is a red-black tree with sorted keys and O(log n) operations.

Concurrent collections: ConcurrentHashMap uses CAS and per-bin locking (since Java 8) for high concurrency, does not allow null keys or values, and offers atomic compute, merge and putIfAbsent. Collections.synchronizedMap locks the whole map. CopyOnWriteArrayList is good for read-mostly lists. BlockingQueue implementations (ArrayBlockingQueue, LinkedBlockingQueue) support producer-consumer.

Fail-fast iterators throw ConcurrentModificationException when the collection is structurally modified during iteration except through the iterator itself. Immutable collections: List.of, Map.of, Collections.unmodifiableList (a view, not a copy).

## Core questions
Junior: Difference between ArrayList and LinkedList? Difference between HashMap and TreeMap? What is ConcurrentModificationException and how do you avoid it?
Middle: Explain how HashMap works internally, including collisions and resizing. HashMap vs ConcurrentHashMap vs Hashtable. How would you implement an LRU cache in Java?
Senior: Why does ConcurrentHashMap forbid null values? How do you choose a collection for a hot path processing millions of events per second? What are the memory overheads of boxed collections and how would you reduce them?

## Follow-up probes
If they describe buckets: ask what happens when many keys collide (treeification) and what a bad hashCode does to performance. If they mention ConcurrentHashMap: ask whether a check-then-act sequence like containsKey followed by put is safe, and what to use instead (computeIfAbsent). If they mention LinkedList being faster for inserts: ask about cache locality and when that really holds.

## Evaluation rubric
Strong signals: accurately explains hashing, buckets, load factor, resize and treeification; knows complexity of common operations; understands atomic compound operations on concurrent maps; picks collections based on access patterns and memory.
Weak signals: only lists class names; cannot explain why hashCode matters; believes synchronizedMap and ConcurrentHashMap are equivalent; unaware of fail-fast behaviour.

## Red flags
Uses mutable objects as map keys without concern; claims HashMap is thread-safe for concurrent writes; cannot state the big O of a HashMap lookup.

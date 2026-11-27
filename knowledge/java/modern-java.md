# Modern Java and Streams

## Key concepts
Lambdas and functional interfaces (Function, Supplier, Consumer, Predicate); method references. Streams API: lazy intermediate operations (map, filter, flatMap, sorted) and terminal operations (collect, reduce, forEach); streams are single-use. Collectors: toList, groupingBy, partitioningBy, toMap (watch for duplicate keys). Parallel streams use the common ForkJoinPool and help only for large, CPU-bound, easily splittable workloads without shared mutable state.

Optional is intended as a return type to signal absence; avoid Optional fields and parameters and avoid calling get without checking. Prefer orElseGet for expensive defaults.

Recent language features: var for local type inference (Java 10); text blocks (15); records (16) — immutable data carriers with generated equals, hashCode and toString, compact constructors for validation; sealed classes and interfaces (17) restrict hierarchies; pattern matching for instanceof (16) and for switch with record patterns (21) enable exhaustive, type-safe branching over sealed hierarchies; switch expressions (14); virtual threads (21); sequenced collections (21). LTS releases: 8, 11, 17, 21, 25.

Generics: type erasure, bounded wildcards and PECS (producer extends, consumer super), why you cannot create a generic array, invariance of List<Integer> vs List<Number>.

## Core questions
Junior: What is a lambda expression? Difference between map and flatMap in streams? What is Optional for?
Middle: When should you not use parallel streams? What are records and when would you use them instead of a class? Explain PECS with an example.
Senior: How would you model a domain with sealed interfaces and pattern matching, and what do you gain over the visitor pattern? What are the pitfalls of migrating a large codebase from Java 8 to 21?

## Follow-up probes
If they mention parallel streams: ask about the common pool and blocking IO inside them. If they mention records: ask whether records are deeply immutable when they contain a List. If they mention Optional: ask why Optional fields are discouraged. If they mention generics: ask what type erasure means at runtime.

## Evaluation rubric
Strong signals: writes idiomatic stream pipelines and knows when a loop is clearer; understands laziness and side-effect pitfalls; uses records and sealed types appropriately; good grasp of generics variance.
Weak signals: only knows Java 8 features; uses parallel streams as a default speed-up; misuses Optional.get; confused by wildcards.

## Red flags
Mutates shared state inside stream lambdas; claims records make all contained objects immutable; has never heard of features released after Java 8 while claiming to be senior.

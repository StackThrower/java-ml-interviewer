# Core Java and OOP

## Key concepts
Java is statically typed, compiled to bytecode and run on the JVM. Core OOP principles: encapsulation, inheritance, polymorphism, abstraction. Interfaces vs abstract classes: interfaces define capabilities and since Java 8 may have default and static methods; abstract classes may hold state and constructors. Composition is usually preferred over inheritance. Java is always pass-by-value: object references are copied, not the objects.

The equals and hashCode contract: if two objects are equal by equals, they must have the same hashCode. Overriding equals without hashCode breaks HashMap and HashSet. equals must be reflexive, symmetric, transitive, consistent, and return false for null.

Immutability: final class, private final fields, no setters, defensive copies of mutable inputs and outputs. String is immutable, which enables the string pool, safe sharing between threads and caching of hashCode. StringBuilder is the mutable, non-synchronized alternative for concatenation in loops.

Exceptions: checked exceptions (must be declared or handled, e.g. IOException) vs unchecked (RuntimeException subclasses, e.g. NullPointerException, IllegalArgumentException). Errors (OutOfMemoryError) should generally not be caught. try-with-resources closes AutoCloseable resources and records suppressed exceptions.

## Core questions
Junior: What is the difference between == and equals? Why must you override hashCode when you override equals? Difference between an interface and an abstract class? Checked vs unchecked exceptions?
Middle: How would you design an immutable class that holds a list? What goes wrong if a mutable object used as a HashMap key changes after insertion? When would you use composition instead of inheritance? What does the final keyword mean on a class, method, field and local variable?
Senior: How do you design a public API so it can evolve without breaking clients? Trade-offs of checked exceptions in large codebases and in lambdas. How would you implement equals correctly in a class hierarchy (the Liskov / symmetric equality problem)?

## Follow-up probes
If the candidate mentions hashCode: ask what happens in a HashMap when two keys have the same hashCode but are not equal. If they mention immutability: ask how to handle a Date or List field (defensive copy, unmodifiable views, List.copyOf). If they say "Java is pass by reference": ask them to explain what happens when a method reassigns its parameter. If they mention try-with-resources: ask about suppressed exceptions.

## Evaluation rubric
Strong signals: explains the equals/hashCode contract and its consequence for hash-based collections; knows immutability techniques including defensive copies; can articulate why composition is often better; correct mental model of pass-by-value with references; uses precise terminology.
Weak signals: memorised definitions without consequences; confuses == with equals for strings and boxed integers; cannot give a real example of polymorphism; thinks catching Exception everywhere is good practice.

## Red flags
Claims Java passes objects by reference; overrides equals without hashCode and sees no problem; swallows exceptions with empty catch blocks; uses inheritance purely for code reuse without considering coupling.

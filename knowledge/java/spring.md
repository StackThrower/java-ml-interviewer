# Spring and Spring Boot

## Key concepts
Inversion of Control and Dependency Injection: the Spring container creates and wires beans. Prefer constructor injection (immutability, easier testing, required dependencies explicit) over field injection. Bean scopes: singleton (default, one per container — must be thread-safe), prototype, request, session. Lifecycle: instantiation, dependency injection, aware callbacks, BeanPostProcessors, @PostConstruct, ready, @PreDestroy.

Spring Boot auto-configuration uses conditional annotations (@ConditionalOnClass, @ConditionalOnMissingBean, @ConditionalOnProperty) to configure beans based on the classpath and properties; starters bundle dependencies. Externalized configuration with profiles, application.yml and environment variables; @ConfigurationProperties for typed config.

AOP and proxies: @Transactional, @Async and @Cacheable work through proxies (JDK dynamic proxies or CGLIB). Self-invocation (calling a @Transactional method from another method in the same class) bypasses the proxy, so the annotation has no effect. @Transactional by default rolls back only on unchecked exceptions; propagation (REQUIRED, REQUIRES_NEW) and isolation levels matter.

Data access: Spring Data JPA repositories; the N+1 select problem with lazy associations and fixes (fetch joins, entity graphs, batch fetching); LazyInitializationException outside a transaction; open-session-in-view trade-offs. Web: @RestController, validation with @Valid, global error handling with @ControllerAdvice. Observability via Actuator and Micrometer. Testing: @SpringBootTest vs slice tests (@WebMvcTest, @DataJpaTest), Testcontainers for real databases.

## Core questions
Junior: What is dependency injection and why is it useful? What is a Spring bean? What does @Autowired do?
Middle: Why is constructor injection preferred? How does @Transactional work, and why might it not work when calling a method from the same class? What is the N+1 problem and how do you fix it?
Senior: How does Spring Boot auto-configuration decide which beans to create, and how do you override it? How would you structure transactions across a service calling an external API? How do you keep a large Spring application fast to start and easy to test?

## Follow-up probes
If they mention @Transactional: ask about self-invocation, rollback rules for checked exceptions, and propagation REQUIRES_NEW. If they mention JPA: ask how they would detect N+1 queries. If they mention singleton beans: ask what happens with mutable state in a singleton under concurrent requests. If they mention testing: ask when to use slice tests vs full context.

## Evaluation rubric
Strong signals: understands that Spring features are proxy-based and the consequences; reasons about transaction boundaries and rollback; knows N+1 and practical fixes; prefers constructor injection with clear reasons; pragmatic testing strategy.
Weak signals: annotation-driven cargo culting without understanding; cannot explain what auto-configuration does; unaware that singletons are shared across threads.

## Red flags
Puts remote HTTP calls inside long database transactions without concern; uses field injection everywhere and cannot test without the full context; stores request state in singleton fields.

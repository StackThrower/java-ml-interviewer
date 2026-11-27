# Transformers and LLMs

## Key concepts
Self-attention computes, for each token, a weighted sum of value vectors where weights come from softmax of scaled dot products between queries and keys (scaled by the square root of the key dimension to keep softmax well-behaved). Multi-head attention lets heads attend to different relations. Positional information comes from positional encodings or rotary embeddings. Attention cost is quadratic in sequence length; mitigations include FlashAttention, sparse or sliding-window attention and KV caching at inference.

Architectures: encoder-only (BERT; bidirectional, good for classification and embeddings), decoder-only (GPT-style; causal masking, autoregressive generation), encoder-decoder (T5; translation, summarisation). Tokenisation with BPE or SentencePiece.

Training stages for LLMs: pretraining on next-token prediction, supervised fine-tuning on instruction data, preference optimisation (RLHF, DPO). Parameter-efficient fine-tuning: LoRA trains low-rank adapter matrices; QLoRA adds quantisation. Decoding: greedy, beam search, temperature, top-k, top-p.

Retrieval-augmented generation (RAG): chunk documents, embed them, store vectors in an index (pgvector, FAISS, a vector database), retrieve the top-k chunks for a query, and place them in the prompt. Quality levers: chunking strategy, hybrid search (BM25 plus vectors), re-ranking, metadata filtering, query rewriting. Evaluate retrieval (recall@k, MRR) separately from generation (faithfulness, answer relevance). Hallucination mitigation: grounding, citations, refusing when context is missing.

LLM evaluation and operations: golden datasets, LLM-as-judge with rubrics, human review, latency and cost per request, prompt caching, guardrails and prompt-injection defences.

## Core questions
Junior: What problem does attention solve compared with RNNs? What is an embedding? What is RAG?
Middle: Explain self-attention step by step, including why we scale by the square root of d_k. Fine-tuning vs RAG — when would you choose each? How would you chunk documents for a RAG system?
Senior: Your RAG assistant gives confident wrong answers — how do you diagnose whether retrieval or generation is at fault? How would you reduce latency and cost of an LLM feature serving millions of requests?

## Follow-up probes
If they mention RAG: ask how they evaluate retrieval quality and what hybrid search adds. If they mention LoRA: ask why low-rank updates work and what rank controls. If they mention KV cache: ask how it affects memory. If they mention LLM-as-judge: ask how they validate the judge itself.

## Evaluation rubric
Strong signals: explains attention mechanics accurately; separates retrieval and generation evaluation; knows practical levers (chunking, re-ranking, caching); grounded view of fine-tuning trade-offs.
Weak signals: buzzwords without mechanics; thinks fine-tuning is the default way to add knowledge; no evaluation strategy.

## Red flags
Claims LLMs never hallucinate with RAG; cannot describe what goes into the prompt in a RAG system; no awareness of prompt injection.

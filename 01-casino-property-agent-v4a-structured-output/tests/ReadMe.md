tests = unit / integration tests

👉 deterministic
👉 fast
👉 mocking
   eg, to test the search.property we mock the embedding
   so, as we test the search does not use the embedding service
   but uses our mock that does not call OpenAI but returns hard coded vectors


👉 Evaluation is different:

uses real LLM / embeddings
not deterministic
measures quality, not correctness
sometimes slow

So:

❌ tests/eval → misleading
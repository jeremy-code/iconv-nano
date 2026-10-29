---
"iconv-nano": patch
---

perf: decode VLQ run payloads in a single pass into typed arrays

- 4.0 ms -> 1.9 ms (~2x faster) w/ warmup, 26.0 ms -> 16.4 ms cold start

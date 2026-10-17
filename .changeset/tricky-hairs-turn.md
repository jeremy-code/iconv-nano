---
"iconv-nano": patch
---

perf: replace null return in VlqRunsLookup with -1

- Using -1 instead of null makes the lookup about 10.7% faster on mapped code
  points. In practice, when benchmarking `encode`, the lookup contributes very
  little to the runtime cost, so the performance gains are mostly neglible.

---
"iconv-nano": patch
---

perf: replace VlqRuns arrays with Uint32Array and use .subarray

- 282 µs (out of 1189 µs) -> ~1 µs (out of 992 µs); memory ~917 KB -> ~449 KB
- Since the output is immediately used to build the table, the Uint32Arrays are GC'd immediately
- No change to public API

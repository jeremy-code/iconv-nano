---
"iconv-nano": patch
---

perf: update single-byte encodings to lookup code points from two-stage table

- Improves encoding throughput of single-byte encodings as much as 3x
- Decrease v8 size cost (previously 170 KB on heap) to 11 KB on heap and 50 KB off heap.

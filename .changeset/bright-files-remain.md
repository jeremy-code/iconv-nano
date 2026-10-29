---
"iconv-nano": patch
---

perf: optimize array creation in decodeVlqRuns w/ new Array().fill instead of Array.from

- 3065 µs (out of 4101 µs) in decodeVlqRuns w/ Array.from -> 282 µs (out of 1189 µs)

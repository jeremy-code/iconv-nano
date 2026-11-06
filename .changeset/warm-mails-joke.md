---
"iconv-nano": patch
---

perf: adjust buffer size in encode function based on isGBK option

- If isGBK is set, the buffer size is reduced to length * 2 instead of length * 4

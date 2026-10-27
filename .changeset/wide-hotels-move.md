---
"iconv-nano": patch
---

perf: reuse JIS0208 index for EUC-JP, Shift_JIS, ISO-2022-JP codecs

- Shift_JIS and ISO-2022-JP already used the JIS0208 index, so share that index
  for memory
- Instead of storing Shift_JIS index in memory, reuse JIS0208 index and make
  mappings manually to avoid unnecessary duplication

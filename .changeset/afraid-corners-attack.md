---
"iconv-nano": patch
---

perf: change TABLE structure to use single number entries for GB18030 mappings

- Instead of mapping number to arrays, map number to numbers and manipulate bits
  to get actual two bytes

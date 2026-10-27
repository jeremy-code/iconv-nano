---
"iconv-nano": patch
---

perf: change VLQ runs' blockIds table from Int32Array to Uint16Array

- There are most 4352 blocks representing for 0x10ffff Unicode code points (the
  max currently used is Big5 with 228); hence, minor performance gains using
  Uint16Array instead of Int32Array. This saves 8.7 KB per table

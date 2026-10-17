---
"iconv-nano": patch
---

perf: only slice buffer if necessary to avoid extra copy

- Previously, by default, `.slice` was always used to prevent case of string
  length and buffer length differing (i.e., surrogate pairs are replaced with
  '?'). Now, this is only done if necessary to speed up ASCII/single-byte input
  strings

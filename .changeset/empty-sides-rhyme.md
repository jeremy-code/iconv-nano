---
"iconv-nano": patch
---

fix: handle lone surrogates in UTF-16 encoding

- Previously, lone surrogates were encoded as bytes in the output. To match
  TextEncoder implementation, lone surrogates are now replaced with Unicode
  replacement character

---
"iconv-nano": patch
---

fix: add purity annotations to createIndexMap and decodeVlqRunsLookup functions

- While not useful right now (due to Rolldown not supporting namespace exports),
  in the future, it will make treeshaking better for someone who only wants to
  decode and not encode

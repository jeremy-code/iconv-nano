---
"iconv-nano": patch
---

perf: replace generic cache key function with concatenation of values or their defaults

- Previously, `getCachedTextDecoder` only cached the options that were
  explicitly given using `Object.entries` and `toSorted`. Since there is only
  three options, simply concatenate them deterministically. This comes with the
  change that now the same instance will be returned when options are ommitted
  (which does not touch on this API since the decoders always pass the same
  options), but I suspect that is more desirable behavior anyways.

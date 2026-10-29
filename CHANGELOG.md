# iconv-nano

## 0.0.18

### Patch Changes

- [`8e0f2d0`](https://github.com/jeremy-code/iconv-nano/commit/8e0f2d05324c1ce28e05c1f01b4920f2ebf688d0) Thanks [@jeremy-code](https://github.com/jeremy-code)! - fix: correct regex pattern for JSON encoding filter in minify-json-plugin

- [`660550f`](https://github.com/jeremy-code/iconv-nano/commit/660550f90887c14f2254a714d1460fcbe8b6a29f) Thanks [@jeremy-code](https://github.com/jeremy-code)! - fix: specify ArrayBuffer type for Typed Arrays in vlqRuns.ts

- [#33](https://github.com/jeremy-code/iconv-nano/pull/33) [`ddaf6a6`](https://github.com/jeremy-code/iconv-nano/commit/ddaf6a64e678b5b258e635b73f669398b95767d5) Thanks [@jeremy-code](https://github.com/jeremy-code)! - perf: decode VLQ run payloads in a single pass into typed arrays

  - 4.0 ms -> 1.9 ms (~2x faster) w/ warmup, 26.0 ms -> 16.4 ms cold start

## 0.0.17

### Patch Changes

- [#29](https://github.com/jeremy-code/iconv-nano/pull/29) [`76e46d3`](https://github.com/jeremy-code/iconv-nano/commit/76e46d3487223b10374cfe52f800b0f8ea25ad90) Thanks [@jeremy-code](https://github.com/jeremy-code)! - perf: change VLQ runs' blockIds table from Int32Array to Uint16Array

  - There are most 4352 blocks representing for 0x10ffff Unicode code points (the
    max currently used is Big5 with 228); hence, minor performance gains using
    Uint16Array instead of Int32Array. This saves 8.7 KB per table

- [#31](https://github.com/jeremy-code/iconv-nano/pull/31) [`a9aabf0`](https://github.com/jeremy-code/iconv-nano/commit/a9aabf09853fa63945c2a6933365db481ca120e2) Thanks [@jeremy-code](https://github.com/jeremy-code)! - perf: reuse JIS0208 index for EUC-JP, Shift_JIS, ISO-2022-JP codecs

  - Shift_JIS and ISO-2022-JP already used the JIS0208 index, so share that index
    for memory
  - Instead of storing Shift_JIS index in memory, reuse JIS0208 index and make
    mappings manually to avoid unnecessary duplication

## 0.0.16

### Patch Changes

- [`493f87e`](https://github.com/jeremy-code/iconv-nano/commit/493f87eed9a64f4d2df5f51375ca12f6c6910f6c) Thanks [@jeremy-code](https://github.com/jeremy-code)! - perf: replace TABLE with getGb18030CompatBytes switch/case

## 0.0.15

### Patch Changes

- [`c4b4b5a`](https://github.com/jeremy-code/iconv-nano/commit/c4b4b5a093c0d68a65200e693cc8cd1a78dbee74) Thanks [@jeremy-code](https://github.com/jeremy-code)! - perf: change TABLE structure to use single number entries for GB18030 mappings

  - Instead of mapping number to arrays, map number to numbers and manipulate bits
    to get actual two bytes

- [`d6964f2`](https://github.com/jeremy-code/iconv-nano/commit/d6964f251e57b059c8aeb45a8062a8a59d6682a8) Thanks [@jeremy-code](https://github.com/jeremy-code)! - refactor: simplify decode function by removing manual BOM handling

- [`7361380`](https://github.com/jeremy-code/iconv-nano/commit/7361380bd0eabafff8487c34fa865a8974cbab70) Thanks [@jeremy-code](https://github.com/jeremy-code)! - perf: add fast path for Uint8Array input in detectEndianness

- [#26](https://github.com/jeremy-code/iconv-nano/pull/26) [`8057e2a`](https://github.com/jeremy-code/iconv-nano/commit/8057e2a218895c8b42d9fee27b4aaee122b96853) Thanks [@jeremy-code](https://github.com/jeremy-code)! - perf: update single-byte encodings to lookup code points from two-stage table

  - Improves encoding throughput of single-byte encodings as much as 3x
  - Decrease v8 size cost (previously 170 KB on heap) to 11 KB on heap and 50 KB off heap.

## 0.0.14

### Patch Changes

- [`1676415`](https://github.com/jeremy-code/iconv-nano/commit/1676415586e2fbe16268b0b84469b833b0f4ea88) Thanks [@jeremy-code](https://github.com/jeremy-code)! - fix: add purity annotations to createIndexMap and decodeVlqRunsLookup functions

  - While not useful right now (due to Rolldown not supporting namespace exports),
    in the future, it will make treeshaking better for someone who only wants to
    decode and not encode

- [`3cbee37`](https://github.com/jeremy-code/iconv-nano/commit/3cbee376979da0005d9bd5286526eefeb7dc802f) Thanks [@jeremy-code](https://github.com/jeremy-code)! - perf: replace buf.set in GB18030 encoding with direct assignments

- [`d350a4b`](https://github.com/jeremy-code/iconv-nano/commit/d350a4b13c2379d41130258838cdee4069012dfd) Thanks [@jeremy-code](https://github.com/jeremy-code)! - perf: replace buf.set with direct assignments in iso-2022-jp encoder

- [`324958d`](https://github.com/jeremy-code/iconv-nano/commit/324958d7f5dd5c25881ba8e2db8ffac4a2b857d9) Thanks [@jeremy-code](https://github.com/jeremy-code)! - fix: ignore negative code points in decodeVlqRunsLookup

- [`170cbfd`](https://github.com/jeremy-code/iconv-nano/commit/170cbfddbce38f3b0b9f75fa819f28b24d2df165) Thanks [@jeremy-code](https://github.com/jeremy-code)! - perf: replace null return in VlqRunsLookup with -1

  - Using -1 instead of null makes the lookup about 10.7% faster on mapped code
    points. In practice, when benchmarking `encode`, the lookup contributes very
    little to the runtime cost, so the performance gains are mostly neglible.

- [`93b9d20`](https://github.com/jeremy-code/iconv-nano/commit/93b9d20abb50081a871273152d9f7dd87f2f8595) Thanks [@jeremy-code](https://github.com/jeremy-code)! - perf: only slice buffer if necessary to avoid extra copy

  - Previously, by default, `.slice` was always used to prevent case of string
    length and buffer length differing (i.e., surrogate pairs are replaced with
    '?'). Now, this is only done if necessary to speed up ASCII/single-byte input
    strings

## 0.0.13

### Patch Changes

- [`f70cb24`](https://github.com/jeremy-code/iconv-nano/commit/f70cb2404b83dcdf09ed5c1ac56e06ceab326366) Thanks [@jeremy-code](https://github.com/jeremy-code)! - perf: update createIndexMap to handle only number values and exclude -1

- [`68f96a1`](https://github.com/jeremy-code/iconv-nano/commit/68f96a158c16edc11720db020f50aa013e1ea0af) Thanks [@jeremy-code](https://github.com/jeremy-code)! - perf: use flat gb18030 encoding index data structure

## 0.0.12

### Patch Changes

- [`032c98f`](https://github.com/jeremy-code/iconv-nano/commit/032c98fb4a80ad5974f9101c16b24425a5a4061c) Thanks [@jeremy-code](https://github.com/jeremy-code)! - perf: avoid iterator overhead in encodeSingleByteEncoding

- [#20](https://github.com/jeremy-code/iconv-nano/pull/20) [`c97cbbe`](https://github.com/jeremy-code/iconv-nano/commit/c97cbbe687d1371dde383c5d40c7ff05450a301e) Thanks [@cometkim](https://github.com/cometkim)! - Avoid unnecessary iterator overhead, speed up heavy encodings perf by 50-100%

## 0.0.11

### Patch Changes

- [#15](https://github.com/jeremy-code/iconv-nano/pull/15) [`85e8079`](https://github.com/jeremy-code/iconv-nano/commit/85e807970e2cd7a65934cd954184a0724647791b) Thanks [@cometkim](https://github.com/cometkim)! - Compress all multi-byte reverse indexes (big5, euc-kr, gb18030, jis0208, jis0212, shift_jis) into VLQ-encoded run-length payloads: the shipped index chunks shrink by 69-85% gzipped (euc-kr: about 76 KB to 13 KB), module init no longer parses 7k-24k-entry JSON objects, encode lookups resolve through O(1) two-stage tables materialized from the payloads at module init.

## 0.0.10

### Patch Changes

- [#17](https://github.com/jeremy-code/iconv-nano/pull/17) [`9ab65b8`](https://github.com/jeremy-code/iconv-nano/commit/9ab65b8278db2a1863dd6b499d27d972551e2ac8) Thanks [@jeremy-code](https://github.com/jeremy-code)! - perf: switch to compact array format for single-byte encodings

  - Reduces bundle size by 15.68 kB
  - Improves performance substantially by using runtime index keyed by code point
    instead of string (goes from throughput of min. 10000 to min. 60000 in CI)

- [#17](https://github.com/jeremy-code/iconv-nano/pull/17) [`040fd6d`](https://github.com/jeremy-code/iconv-nano/commit/040fd6d91f03fa76a4a3c1c1b2fed694ba656387) Thanks [@jeremy-code](https://github.com/jeremy-code)! - perf: update iso-2022-jp-katakana encoding to use compact numeric array

## 0.0.9

### Patch Changes

- [`19c04a2`](https://github.com/jeremy-code/iconv-nano/commit/19c04a2bc0fddb81f01c41d637381d4f84091b9e) Thanks [@jeremy-code](https://github.com/jeremy-code)! - chore: add Codec type

- [`95f2a33`](https://github.com/jeremy-code/iconv-nano/commit/95f2a338059ab3fed032e69153ad1eacf1542848) Thanks [@jeremy-code](https://github.com/jeremy-code)! - chore: add Encoding, CanonicalEncoding types

## 0.0.8

### Patch Changes

- [`453e8e4`](https://github.com/jeremy-code/iconv-nano/commit/453e8e44ed632ca9bd4525a80a08d39dddf3e0ca) Thanks [@jeremy-code](https://github.com/jeremy-code)! - fix: use char iterator for index in Shift_JIS and EUC-JP encoders

  - Avoids unnecessary `String.fromCodePoint`

- [`46afc92`](https://github.com/jeremy-code/iconv-nano/commit/46afc9209abc1a0d9b891da6b6b5782d07b88f07) Thanks [@jeremy-code](https://github.com/jeremy-code)! - fix: increase buffer size for GB18030 encoding

- [`205e0f4`](https://github.com/jeremy-code/iconv-nano/commit/205e0f407c6174896a410aac6ccbf2f0ec5c4b58) Thanks [@jeremy-code](https://github.com/jeremy-code)! - feat: remove replacement codec

  - Besides not really making sense to have an associated encoder, constructing
    the decoder on Chrome throws an error

## 0.0.7

### Patch Changes

- [`d2a8902`](https://github.com/jeremy-code/iconv-nano/commit/d2a8902ba16e63c3bdd6c60f0b3fb41bd217f2b1) Thanks [@jeremy-code](https://github.com/jeremy-code)! - fix: optimize character lookup in encoding functions

## 0.0.6

### Patch Changes

- [`b6f04ac`](https://github.com/jeremy-code/iconv-nano/commit/b6f04ac720e2024d000fe9bb23421bb082c70392) Thanks [@jeremy-code](https://github.com/jeremy-code)! - feat: add detectEndianness option to UTF-16 decoder

  - Create detectEndianness utility function
  - Add detectEndianness option: when enabled, detects endianness from bytes

- [`772addd`](https://github.com/jeremy-code/iconv-nano/commit/772addd879d865f4c621d029bed72772a03749ae) Thanks [@jeremy-code](https://github.com/jeremy-code)! - feat: enhance UTF-8 decoder to handle BOM stripping

## 0.0.5

### Patch Changes

- [`eacf4c5`](https://github.com/jeremy-code/iconv-nano/commit/eacf4c508a897ae0a8eb790e04f751c1173a3ed6) Thanks [@jeremy-code](https://github.com/jeremy-code)! - refactor: simplify encode function in UTF-16 codec

- [`b5a91c3`](https://github.com/jeremy-code/iconv-nano/commit/b5a91c37b632f9a715c7ca732774c8bf1158a194) Thanks [@jeremy-code](https://github.com/jeremy-code)! - fix: set correct TextDecoder label in x-user-defined codec

- [`1eba5bc`](https://github.com/jeremy-code/iconv-nano/commit/1eba5bcf95b07b20b09f5721bb0f897dec58e278) Thanks [@jeremy-code](https://github.com/jeremy-code)! - chore: update target to ES2022

## 0.0.4

### Patch Changes

- [`1864254`](https://github.com/jeremy-code/iconv-nano/commit/186425401db3bc5f55109f887e4f4913d59f6f7b) Thanks [@jeremy-code](https://github.com/jeremy-code)! - fix: update byteOffset after returning four bytes in GB18030 encoding

- [`5732aac`](https://github.com/jeremy-code/iconv-nano/commit/5732aac7943eaecafedcd6d86fcadf3271665dfb) Thanks [@jeremy-code](https://github.com/jeremy-code)! - feat: implement x-user-defined codec

- [`e0cea75`](https://github.com/jeremy-code/iconv-nano/commit/e0cea75465a5e04c7e2d9f7928847616d66e2aea) Thanks [@jeremy-code](https://github.com/jeremy-code)! - feat: add isAsciiCodePoint utility function

- [`079d846`](https://github.com/jeremy-code/iconv-nano/commit/079d846bdb2547eaaaab64ab386d83375276485f) Thanks [@jeremy-code](https://github.com/jeremy-code)! - feat: implement ISO-2022-JP codec

- [`a577dce`](https://github.com/jeremy-code/iconv-nano/commit/a577dcecba29e9119e98106f689bf0b17cdb2c25) Thanks [@jeremy-code](https://github.com/jeremy-code)! - feat: implement replacement codec

- [`5d63240`](https://github.com/jeremy-code/iconv-nano/commit/5d632404698cd423edb260004a1f2731526b8aa5) Thanks [@jeremy-code](https://github.com/jeremy-code)! - chore: use slice instead of subarray, consistently handle unknown characters

## 0.0.3

### Patch Changes

- [`693c5fa`](https://github.com/jeremy-code/iconv-nano/commit/693c5fa1f116a76152ed049df262a02e3a3cd5ef) Thanks [@jeremy-code](https://github.com/jeremy-code)! - feat: add gbk codec

- [`5556814`](https://github.com/jeremy-code/iconv-nano/commit/555681484a127819d38c280d44278ce8c1187e15) Thanks [@jeremy-code](https://github.com/jeremy-code)! - feat: add EUC-JP codec support

- [`53a2424`](https://github.com/jeremy-code/iconv-nano/commit/53a2424cdc646bc3b1f19ef734578ed88acddc99) Thanks [@jeremy-code](https://github.com/jeremy-code)! - fix: update gb18030 encoding to not fall through after reading index

## 0.0.2

### Patch Changes

- [`4c15f11`](https://github.com/jeremy-code/iconv-nano/commit/4c15f110d9ceb716487097acfc0622aa09f6cb95) Thanks [@jeremy-code](https://github.com/jeremy-code)! - feat: add big5 codec

- [`7d56910`](https://github.com/jeremy-code/iconv-nano/commit/7d56910e40ba2c11dc9e54cfdd6ce325e3bb53ff) Thanks [@jeremy-code](https://github.com/jeremy-code)! - feat: add shift_jis codec

- [`22db694`](https://github.com/jeremy-code/iconv-nano/commit/22db69469b06eb253bdba3d0ffab9c39bff0a132) Thanks [@jeremy-code](https://github.com/jeremy-code)! - feat: use unified Encoder/Decoder interfaces for codecs

- [`77a72a3`](https://github.com/jeremy-code/iconv-nano/commit/77a72a3fbdf4472ced5552d861583f531d96628b) Thanks [@jeremy-code](https://github.com/jeremy-code)! - fix: correct encoding of characters with multiple UTF-16 code units

- [`9f90b86`](https://github.com/jeremy-code/iconv-nano/commit/9f90b86eeef3142178c95647621406b975330af1) Thanks [@jeremy-code](https://github.com/jeremy-code)! - feat: update generate-encodings.ts script to parse indexes from whatwg/encoding

  - Update generate-encodings.ts script to parse indexes from whatwg/encoding GitHub
  - Fix big5.json and gb18030-ranges.json to match whatwg/encoding indexes
  - Fix parsing with "first key wins" rule (it only mattered for shift_jis)

- [`9fddcbd`](https://github.com/jeremy-code/iconv-nano/commit/9fddcbd7c7b7879755757aad37d0f48a1f27d1c5) Thanks [@jeremy-code](https://github.com/jeremy-code)! - feat: add euc-kr codec

- [`b2e0c4c`](https://github.com/jeremy-code/iconv-nano/commit/b2e0c4ce6576a2b30503efcad8a052021bb7f03e) Thanks [@jeremy-code](https://github.com/jeremy-code)! - feat: add gb18030 codec

## 0.0.1

### Patch Changes

- [`2cb4a61`](https://github.com/jeremy-code/iconv-nano/commit/2cb4a6128510754250221f3d7f1297e0c899b435) Thanks [@jeremy-code](https://github.com/jeremy-code)! - fix: export iso-8859-8-i.ts as iso_8859_8_i for consistency

- [`9671f23`](https://github.com/jeremy-code/iconv-nano/commit/9671f235252c6c694555e593c04044db407c7deb) Thanks [@jeremy-code](https://github.com/jeremy-code)! - fix: fix incorrect utf-16le/utf-16be aliases

- [`b6309f2`](https://github.com/jeremy-code/iconv-nano/commit/b6309f2b2be41b87ebc7680deaa9b6af1ab58061) Thanks [@jeremy-code](https://github.com/jeremy-code)! - fix: invert stripBOM for correct BOM decoding handling

- [`fef4899`](https://github.com/jeremy-code/iconv-nano/commit/fef4899535ca2b130a3c2b78d9e10258535160fb) Thanks [@jeremy-code](https://github.com/jeremy-code)! - feat: add utf-16/utf-16le/utf-16be codec

# iconv-nano

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

# iconv-nano/encodings

Encodings were generated via [scripts/generate-encodings.ts](../scripts/generate-encodings.ts) by parsing [indexes.json](https://github.com/whatwg/encoding/blob/main/indexes.json) in the GitHub [whatwg/encoding](https://github.com/whatwg/encoding) repository.

The SHA-256 checksum for the `indexes.json` file used to create the encodings is located at [indexes.sha256](./indexes.sha256).

Modifications were made to the original file based on the [WHATWG encoding spec on indexes](https://encoding.spec.whatwg.org/#indexes):

- [gb18030-ranges.json](./gb18030-ranges.json) was flattened for more optimized data representation.
- [shift_jis.ts](./shift_jis.ts) was generated based on the by modifying the index for jis0208.
- [big5.ts](./big5.ts) was generated as described in the specification.
- Single-byte encodings ([ibm866.json](./ibm866.json), `iso-8859-*.json`, `koi8-*.json`, `windows-*.json`, [x-mac-cyrillic.json](./x-mac-cyrillic.json)) were preserved as-is, except that holes were replaced with -1.
- [iso-2022-jp-katakana.json](./iso-2022-jp-katakana.json) was preserved as-is.
- Additionally, some encodings are stored as a VLQ-encoded run-length payload (see `encodeVlqRunsPayload` in the generator, decoded at runtime by `src/utils/vlqRuns.ts`) to optimize performance and size. Currently applied to: `big5`, `ecu-kr`, `gb18030`, `jis0208`, `jis0212`, `shift_jis`.

The encoding files are imported by `iconv-nano` in the development code but are compiled into minified JavaScript files during build time.

# iconv-nano/encodings

Encodings were generated via [scripts/generate-encodings.ts](../scripts/generate-encodings.ts) by parsing [indexes.json](https://github.com/whatwg/encoding/blob/main/indexes.json) in the GitHub [whatwg/encoding](https://github.com/whatwg/encoding) repository.

The SHA-256 checksum for the `indexes.json` file used to create the encodings is located at [indexes.sha256](./indexes.sha256).

Modifications were made to the original file based on the [WHATWG encoding spec on indexes](https://encoding.spec.whatwg.org/#indexes):

- [gb18030-ranges.json](./gb18030-ranges.json) was preserved as-is due to the different format used.
- [shift_jis.json](./shift_jis.json) was generated based on the by modifying the index for jis0208.
- [big5.json](./big5.json) was generated as described in the specification.
- [euc-kr.ts](./euc-kr.ts) is stored as a VLQ-encoded run-length payload (see `encodeVlqRunsPayload` in the generator, decoded at runtime by `src/utils/vlqRuns.ts`) instead of a plain reverse-index object. Encodings can opt in via `VLQ_RUNS_ENCODINGS`.

The encoding files are imported by `iconv-nano` in the development code but are compiled into minified JavaScript files during build time.

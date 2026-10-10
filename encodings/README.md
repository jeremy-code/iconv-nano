# iconv-nano/encodings

Encodings were generated via [scripts/generate-encodings.ts](../scripts/generate-encodings.ts) by parsing [indexes.json](https://github.com/whatwg/encoding/blob/main/indexes.json) in the GitHub [whatwg/encoding](https://github.com/whatwg/encoding) repository.

The SHA-256 checksum for the `indexes.json` file used to create the encodings is located at [indexes.sha256](./indexes.sha256).

Modifications were made to the original file based on the [WHATWG encoding spec on indexes](https://encoding.spec.whatwg.org/#indexes):

- [gb18030-ranges.json](./gb18030-ranges.json) was preserved as-is due to the different format used.
- [shift_jis.json](./shift_jis.json) was generated based on the by modifying the index for jis0208.
- [big5.json](./big5.json) was generated as described in the specification.
- Single-byte encodings ([ibm866.json](./ibm866.json), `iso-8859-*.json`, `koi8-*.json`, `windows-*.json`, [x-mac-cyrillic.json](./x-mac-cyrillic.json)) are stored in an object where corresponding bytes are indexed by numerical code point.

The JSON files are imported by `iconv-nano` in the development code but are compiled into minified JavaScript files during build time.

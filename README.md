# iconv-nano

[github-actions]: https://www.github.com/jeremy-code/iconv-nano/actions/workflows/ci.yml
[github-actions-badge]: https://www.github.com/jeremy-code/iconv-nano/actions/workflows/ci.yml/badge.svg
[license-badge]: https://img.shields.io/github/license/jeremy-code/iconv-nano
[npm-version-badge]: https://img.shields.io/npm/v/iconv-nano
[npm-package]: https://www.npmjs.com/package/iconv-nano
[code-coverage-badge]: https://codecov.io/github/jeremy-code/iconv-nano/graph/badge.svg
[code-coverage]: https://codecov.io/github/jeremy-code/iconv-nano
[npm-package-size-badge]: https://badgen.net/packagephobia/install/iconv-nano
[npm-package-size]: https://packagephobia.com/result?p=iconv-nano

[![GitHub Actions][github-actions-badge]][github-actions] [![License][license-badge]](LICENSE) [![NPM version][npm-version-badge]][npm-package] [![Code coverage][code-coverage-badge]][code-coverage] [![NPM package size][npm-package-size-badge]][npm-package-size]

Documentation is available at this URL: <https://npmx.dev/package-docs/iconv-nano>.

## Installation

```shell
npm install iconv-nano # npm
yarn add iconv-nano    # yarn
pnpm add iconv-nano    # pnpm
```

## Features

- Tree-shakable
- Isomorphic: uses `Uint8Array` and `TextEncoder`/`TextDecoder` APIs
- Supports all WHATWG encodings

## Usage

```js
import * as iconv from "iconv-nano";

iconv.utf8.encode("😅").toHex(); // "f09f9885"
iconv.utf8.decode(Uint8Array.fromHex("f09f9885")); // "😅"

iconv.ascii.encode("😅").toHex(); // "3f"
iconv.ascii.decode(Uint8Array.fromHex("3f")); // "?"

iconv.utf16.encode("😅", { endianness: "little-endian" }).toHex(); // "3dd805de"
iconv.utf16.decode(Uint8Array.fromHex("3dd805de")); // "😅"

iconv.shift_jis.encode("文字化け").toHex(); // "95b68e9a89bb82af"
iconv.shift_jis.decode(Uint8Array.fromHex("95b68e9a89bb82af")); // "文字化け"
```

The [namespace import](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import#namespace_import) is important for tree-shaking since it allows you to selectively choose which encodings to use while remaining statically analyzable.

If you need string labels for encoding and still want the benefits of tree-shaking, you can do that with a constant like this:

```ts
import * as iconv from "iconv-nano";

const CODECS = {
  ascii: iconv.ascii,
  shift_jis: iconv.shift_jis,
  utf_8: iconv.utf_8,
  utf_16le: iconv.utf_16le,
} satisfies Partial<Record<iconv.Encoding, iconv.Codec>>;

type Encoding = keyof typeof CODECS;

const getBytes = (
  input: string,
  encoding: Encoding,
): Uint8Array<ArrayBuffer> => {
  return CODECS[encoding].encode(input);
};
```

While I don't recommend it, since it will bring ALL encodings into your bundle, you can use stringly-typed labels to get any codec like this:

```ts
import * as iconv from "iconv-nano";

const getBytes = (
  input: string,
  encoding: iconv.Encoding,
): Uint8Array<ArrayBuffer> => {
  return iconv[encoding].encode(input);
};
```

## Supported encodings

All encodings supported by the [WHATWG Encoding standard](https://encoding.spec.whatwg.org) are supported. Their aliases have also been exported.

<table>
  <thead>
    <tr>
      <th>Name</th>
      <th>Export</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td colspan="2">
        <a href="https://encoding.spec.whatwg.org/#the-encoding"
          >The Encoding</a
        >
      </td>
    </tr>
    <tr>
      <td><a href="https://en.wikipedia.org/wiki/UTF-8">UTF-8</a></td>
      <td>utf_8</td>
    </tr>
    <tr>
      <td colspan="2">
        <a href="https://encoding.spec.whatwg.org/#legacy-single-byte-encodings"
          >Legacy single-byte encodings</a
        >
      </td>
    </tr>
    <tr>
      <td><a href="https://en.wikipedia.org/wiki/Code_page_866">IBM-866</a></td>
      <td>ibm866</td>
    </tr>
    <tr>
      <td>
        <a href="https://en.wikipedia.org/wiki/ISO/IEC_8859-2">ISO-8859-2</a>
      </td>
      <td>iso_8859_2</td>
    </tr>
    <tr>
      <td>
        <a href="https://en.wikipedia.org/wiki/ISO/IEC_8859-3">ISO-8859-3</a>
      </td>
      <td>iso_8859_3</td>
    </tr>
    <tr>
      <td>
        <a href="https://en.wikipedia.org/wiki/ISO/IEC_8859-4">ISO-8859-4</a>
      </td>
      <td>iso_8859_4</td>
    </tr>
    <tr>
      <td>
        <a href="https://en.wikipedia.org/wiki/ISO/IEC_8859-5">ISO-8859-5</a>
      </td>
      <td>iso_8859_5</td>
    </tr>
    <tr>
      <td>
        <a href="https://en.wikipedia.org/wiki/ISO/IEC_8859-6">ISO-8859-6</a>
      </td>
      <td>iso_8859_6</td>
    </tr>
    <tr>
      <td>
        <a href="https://en.wikipedia.org/wiki/ISO/IEC_8859-7">ISO-8859-7</a>
      </td>
      <td>iso_8859_7</td>
    </tr>
    <tr>
      <td>
        <a href="https://en.wikipedia.org/wiki/ISO/IEC_8859-8">ISO-8859-8</a>
      </td>
      <td>iso_8859_8</td>
    </tr>
    <tr>
      <td>
        <a href="https://en.wikipedia.org/wiki/ISO-8859-8-I">ISO-8859-8-I</a>
      </td>
      <td>iso_8859_8_i</td>
    </tr>
    <tr>
      <td>
        <a href="https://en.wikipedia.org/wiki/ISO/IEC_8859-10">ISO-8859-10</a>
      </td>
      <td>iso_8859_10</td>
    </tr>
    <tr>
      <td>
        <a href="https://en.wikipedia.org/wiki/ISO/IEC_8859-13">ISO-8859-13</a>
      </td>
      <td>iso_8859_13</td>
    </tr>
    <tr>
      <td>
        <a href="https://en.wikipedia.org/wiki/ISO/IEC_8859-14">ISO-8859-14</a>
      </td>
      <td>iso_8859_14</td>
    </tr>
    <tr>
      <td>
        <a href="https://en.wikipedia.org/wiki/ISO/IEC_8859-15">ISO-8859-15</a>
      </td>
      <td>iso_8859_15</td>
    </tr>
    <tr>
      <td>
        <a href="https://en.wikipedia.org/wiki/ISO/IEC_8859-16">ISO-8859-16</a>
      </td>
      <td>iso_8859_16</td>
    </tr>
    <tr>
      <td><a href="https://en.wikipedia.org/wiki/KOI8-R">KOI8-R</a></td>
      <td>koi8_r</td>
    </tr>
    <tr>
      <td><a href="https://en.wikipedia.org/wiki/KOI8-U">KOI8-U</a></td>
      <td>koi8_u</td>
    </tr>
    <tr>
      <td>
        <a href="https://en.wikipedia.org/wiki/Mac_OS_Roman">Mac OS Roman</a>
      </td>
      <td>macintosh</td>
    </tr>
    <tr>
      <td>
        <a href="https://en.wikipedia.org/wiki/Windows-874">Windows-874</a>
      </td>
      <td>windows_874</td>
    </tr>
    <tr>
      <td>
        <a href="https://en.wikipedia.org/wiki/Windows-1250">Windows-1250</a>
      </td>
      <td>windows_1250</td>
    </tr>
    <tr>
      <td>
        <a href="https://en.wikipedia.org/wiki/Windows-1251">Windows-1251</a>
      </td>
      <td>windows_1251</td>
    </tr>
    <tr>
      <td>
        <a href="https://en.wikipedia.org/wiki/Windows-1252">Windows-1252</a>
      </td>
      <td>windows_1252</td>
    </tr>
    <tr>
      <td>
        <a href="https://en.wikipedia.org/wiki/Windows-1253">Windows-1253</a>
      </td>
      <td>windows_1253</td>
    </tr>
    <tr>
      <td>
        <a href="https://en.wikipedia.org/wiki/Windows-1254">Windows-1254</a>
      </td>
      <td>windows_1254</td>
    </tr>
    <tr>
      <td>
        <a href="https://en.wikipedia.org/wiki/Windows-1255">Windows-1255</a>
      </td>
      <td>windows_1255</td>
    </tr>
    <tr>
      <td>
        <a href="https://en.wikipedia.org/wiki/Windows-1256">Windows-1256</a>
      </td>
      <td>windows_1256</td>
    </tr>
    <tr>
      <td>
        <a href="https://en.wikipedia.org/wiki/Windows-1257">Windows-1257</a>
      </td>
      <td>windows_1257</td>
    </tr>
    <tr>
      <td>
        <a href="https://en.wikipedia.org/wiki/Windows-1258">Windows-1258</a>
      </td>
      <td>windows_1258</td>
    </tr>
    <tr>
      <td>
        <a href="https://en.wikipedia.org/wiki/Mac_OS_Cyrillic_encoding"
          >Mac OS Cyrillic</a
        > (`x-mac-cyrillic`)
      </td>
      <td>x_mac_cyrillic</td>
    </tr>
    <tr>
      <td colspan="2">
        <a
          href="https://encoding.spec.whatwg.org/#legacy-multi-byte-chinese-(simplified)-encodings"
          >Legacy multi-byte Chinese (simplified) encodings</a
        >
      </td>
    </tr>
    <tr>
      <td>
        <a href="https://en.wikipedia.org/wiki/GBK_(character_encoding)">GBK</a>
      </td>
      <td>GBK</td>
    </tr>
    <tr>
      <td><a href="https://en.wikipedia.org/wiki/GB_18030">GB 18030</a></td>
      <td>gb18030</td>
    </tr>
    <tr>
      <td colspan="2">
        <a
          href="https://encoding.spec.whatwg.org/#legacy-multi-byte-chinese-(traditional)-encodings"
          >Legacy multi-byte Chinese (traditional) encodings</a
        >
      </td>
    </tr>
    <tr>
      <td><a href="https://en.wikipedia.org/wiki/Big5">Big5</a></td>
      <td>big5</td>
    </tr>
    <tr>
      <td colspan="2">
        <a
          href="https://encoding.spec.whatwg.org/#legacy-multi-byte-japanese-encodings"
          >Legacy multi-byte Japanese encodings</a
        >
      </td>
    </tr>
    <tr>
      <td>
        <a href="https://en.wikipedia.org/wiki/Extended_Unix_Code#EUC-JP"
          >EUC-JP</a
        >
      </td>
      <td>euc_jp</td>
    </tr>
    <tr>
      <td>
        <a href="https://en.wikipedia.org/wiki/ISO/IEC_2022#ISO-2022-JP"
          >ISO-2022-JP</a
        >
      </td>
      <td>iso_2022_jp</td>
    </tr>
    <tr>
      <td><a href="https://en.wikipedia.org/wiki/Shift_JIS">Shift JIS</a></td>
      <td>shift_jis</td>
    </tr>
    <tr>
      <td colspan="2">
        <a
          href="https://encoding.spec.whatwg.org/#legacy-multi-byte-korean-encodings"
          >Legacy multi-byte Korean encodings</a
        >
      </td>
    </tr>
    <tr>
      <td>
        <a href="https://en.wikipedia.org/wiki/Extended_Unix_Code#EUC-KR"
          >EUC-KR</a
        >
      </td>
      <td>euc_kr</td>
    </tr>
    <tr>
      <td colspan="2">
        <a
          href="https://encoding.spec.whatwg.org/#legacy-miscellaneous-encodings"
          >Legacy miscellaneous encodings</a
        >
      </td>
    </tr>
    <tr>
      <td>
        <a href="https://en.wikipedia.org/wiki/UTF-16#UTF-16BE">UTF-16BE</a>
      </td>
      <td>utf_16be</td>
    </tr>
    <tr>
      <td>
        <a href="https://en.wikipedia.org/wiki/UTF-16#UTF-16LE">UTF-16LE</a>
      </td>
      <td>utf_16le</td>
    </tr>
    <tr>
      <td>
        <a href="https://encoding.spec.whatwg.org/#x-user-defined"
          >x-user-defined</a
        >
      </td>
      <td>x-user-defined</td>
    </tr>
  </tbody>
</table>

## Performance

Benchmarks comparing the performance of `iconv-nano` and `iconv-lite` can be found at the following GitHub repository: [jeremy-code/encoding-benchmarks](https://github.com/jeremy-code/encoding-benchmarks). Broadly, `iconv-nano` is either on-par or faster with `iconv-lite` when encoding, and usually faster than it when decoding. This becomes especially true when comparing performance in the browser where the Node.js Buffer API has been polyfilled for `iconv-lite`'s use.

## Compatibility

This library relies on the [`TextDecoder`](https://developer.mozilla.org/en-US/docs/Web/API/TextDecoder) API for decoding. The [Encoding API](https://developer.mozilla.org/en-US/docs/Web/API/Encoding_API) enjoys wide support in most JavaScript runtimes, being available since March 2017 in all major browsers[^1] and supported since Node.js v11.0.0,[^1] Deno v0.2.2,[^2] and Bun v0.1.0.[^3] If you look at the [web-platform-tests for encoding](https://wpt.fyi/results/encoding), browsers are in general spec-compliant with regard to their encoding implementations.

I tested server runtimes' implementations of `TextDecoder` on the encoding-related tests in the [web-platform-tests](https://github.com/web-platform-tests/wpt) test suite. Deno (v2.9.7) passed all tests. Bun (v1.4.2) failed one test ([fatal stream: iso-2022-jp](https://github.com/web-platform-tests/wpt/blob/788584597a223265879760fd2633f7859d09e5ad/encoding/textdecoder-mistakes.any.js#L671-L688)), though not on a part of the API this library touches. As of Node.js v26.10.0, the following encodings seem to have some issues: ISO-2022-JP, Big5, EUC-JP, EUC-KR, Shift JIS. For those encodings, consider using a `TextDecoder` polyfill such as [@exodus/bytes](https://npmjs.com/@exodus/bytes).

For a detailed table of encoding API support across runtimes, please review this [spreadsheet](https://docs.google.com/spreadsheets/d/1pdEefRG6r9fZy61WHGz0TKSt8cO4ISWqlpBN5KntIvQ/edit) by [ChALkeR](https://github.com/ChALkeR), creator of [@exodus/bytes](https://npmjs.com/@exodus/bytes).

## Notes

I'm waiting on ESM [namespace imports](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import#namespace_import) in Rolldown ([rolldown/rolldown#7874](https://github.com/rolldown/rolldown/issues/7874)) to be supported. It looks like it will be coming in Rolldown 1.4. While tree-shaking will still work for encodings, the individual `encode`/`decode` functions cannot be tree-shaken until this is resolved.

## License

This project is licensed under the BSD-2 Clause license. See the [LICENSE](LICENSE) file for details.

[^1]: https://developer.mozilla.org/en-US/docs/Web/API/TextDecoder#browser_compatibility

[^2]: https://github.com/denoland/deno/blob/main/Releases.md#v022--20181207

[^3]: https://github.com/oven-sh/bun/commit/43de33afc7fcc4cab25f578566e225ba9e4d4258
